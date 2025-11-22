import express, { type Request, type Response } from 'express';
import axios from 'axios';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = parseInt(process.env.AGENT_PORT || '3000', 10);
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://host.docker.internal:11434';
const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:changeme@localhost:5432/ai_memory';
const DEFAULT_EMBEDDING_MODEL = 'all-minilm';

// Search configuration constants
const MIN_SEARCH_LIMIT = 1;
const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 20;

const pool = new Pool({ connectionString: DATABASE_URL });

app.get('/health', async (_req: Request, res: Response) => {
  const status = {
    status: 'ok',
    postgres: 'unknown',
    ollama: 'unknown',
  } as any;

  try {
    await pool.query('SELECT 1');
    status.postgres = 'connected';
  } catch (err: any) {
    status.postgres = 'disconnected';
    status.status = 'degraded';
    status.db_error = err?.message;
  }

    // Check LLM provider health
    try {
      let healthy = false;
      if (LLM_PROVIDER === 'openai' || LLM_PROVIDER === 'lmstudio') {
        const resp = await axios.get(`${LLM_BASE_URL}/v1/models`, { timeout: 5000 });
        healthy = resp.status === 200;
      } else if (LLM_PROVIDER === 'ollama') {
        const resp = await axios.get(`${LLM_BASE_URL}/api/tags`, { timeout: 5000 });
        healthy = resp.status === 200;
      } else {
        // Try OpenAI then Ollama
        try {
          const r1 = await axios.get(`${LLM_BASE_URL}/v1/models`, { timeout: 5000 });
          healthy = r1.status === 200;
        } catch {
          const r2 = await axios.get(`${LLM_BASE_URL}/api/tags`, { timeout: 5000 });
          healthy = r2.status === 200;
        }
      }
      status.ollama = healthy ? 'reachable' : 'unreachable';
      if (!healthy) {
        status.status = status.postgres === 'connected' ? 'degraded' : 'degraded';
      }
    } catch (err: any) {
      console.error('Healthcheck LLM Error:', err.message);
      status.ollama = 'unreachable';
      status.status = status.postgres === 'connected' ? 'degraded' : 'degraded';
      status.llm_error = err.message;
    }  res.json(status);
});

app.post('/policy', async (req: Request, res: Response) => {
  const { key, value, description } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key (string) required' });
  }
  if (value === undefined) {
    return res.status(400).json({ error: 'value (any) required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO architectural_policies (key, value, description)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = now()
       RETURNING id, key, value, description, created_at, updated_at`,
      [key, JSON.stringify(value), description || null]
    );
    res.json({ updated: true, policy: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'db_error', message: err?.message });
  }
});

app.get('/policies', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT key, description, value, created_at, updated_at
       FROM architectural_policies
       ORDER BY key ASC`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'db_error', message: err?.message });
  }
});

app.get('/policies/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const result = await pool.query(
      `SELECT key, description, value, created_at, updated_at
       FROM architectural_policies
       WHERE key = $1`,
      [key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'policy_not_found' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'db_error', message: err?.message });
  }
});

// Helper function to get embeddings from LLM
async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const embeddingModel = process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
    let embeddingUrl: string;
    let requestBody: any;

    if (LLM_PROVIDER === 'ollama') {
      embeddingUrl = `${LLM_BASE_URL}/api/embeddings`;
      requestBody = { model: embeddingModel, prompt: text };
    } else {
      // OpenAI/LMStudio compatible
      embeddingUrl = `${LLM_BASE_URL}/v1/embeddings`;
      requestBody = { model: embeddingModel, input: text };
    }

    const resp = await axios.post(embeddingUrl, requestBody, { timeout: 10000 });
    
    if (LLM_PROVIDER === 'ollama') {
      return resp.data?.embedding || null;
    } else {
      return resp.data?.data?.[0]?.embedding || null;
    }
  } catch (err: any) {
    console.error('Embedding generation failed:', err.message);
    return null;
  }
}

app.post('/query', async (req: Request, res: Response) => {
  const started = Date.now();
  const { query, topK } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query (string) required' });
  }
  const limit = Math.max(1, Math.min(parseInt(topK || '3', 10) || 3, 10));
  try {
    // Search policies by key/description/value text (case-insensitive)
    const result = await pool.query(
      `SELECT key, description, value::text AS value_text
       FROM architectural_policies
       WHERE LOWER(key) LIKE LOWER($1) 
          OR LOWER(description) LIKE LOWER($1) 
          OR LOWER(value::text) LIKE LOWER($1)
       ORDER BY updated_at DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );

    let answer = 'No matching policy found.';
    const sources = result.rows.map((r: any) => ({ key: r.key, excerpt: r.value_text.slice(0, 160) }));

    // If policies found, query LLM for synthesis
    if (result.rowCount && result.rows.length > 0) {
      const policyContext = result.rows
        .map((r: any) => `- ${r.key}: ${r.description}\n  ${r.value_text.slice(0, 300)}`)
        .join('\n\n');

      try {
        const llmResp = await axios.post(
          `${LLM_BASE_URL}/v1/chat/completions`,
          {
            model: process.env.LLM_MODEL || 'mistral:7b',
            messages: [
              {
                role: 'system',
                content: 'You are an architecture assistant. Answer based only on the provided policies. Be concise.',
              },
              {
                role: 'user',
                content: `Based on these policies:\n\n${policyContext}\n\nAnswer this question: ${query}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          },
          { timeout: 10000 }
        );

        if (llmResp.data?.choices?.[0]?.message?.content) {
          answer = llmResp.data.choices[0].message.content.trim();
        }
      } catch (llmErr: any) {
        // Fallback to policy synthesis if LLM fails
        const first = result.rows[0];
        const desc = first.description || '';
        answer = `Policy "${first.key}": ${desc}. Value: ${first.value_text.slice(0, 200)}`;
      }
    }

    const latency_ms = Date.now() - started;
    return res.json({
      answer,
      sources,
      latency_ms,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'db_error', message: err?.message });
  }
});

app.post('/search', async (req: Request, res: Response) => {
  const started = Date.now();
  const { query, topK, useSemanticSearch } = req.body || {};
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query (string) required' });
  }
  
  const limit = Math.max(MIN_SEARCH_LIMIT, Math.min(parseInt(topK || `${DEFAULT_SEARCH_LIMIT}`, 10) || DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT));
  
  try {
    let results: any[] = [];
    
    // Default to semantic search unless explicitly disabled
    const shouldUseSemanticSearch = useSemanticSearch ?? true;
    
    // If semantic search is enabled and embeddings are available
    if (shouldUseSemanticSearch) {
      const embedding = await getEmbedding(query);
      
      if (embedding && embedding.length > 0) {
        const embeddingStr = JSON.stringify(embedding);
        
        // Vector similarity search on documents table with single distance calculation
        const vectorResult = await pool.query(
          `SELECT id, doc_key, content, metadata,
                  1 - (embedding <=> $1::vector) AS similarity
           FROM documents
           WHERE embedding IS NOT NULL
           ORDER BY similarity DESC
           LIMIT $2`,
          [embeddingStr, limit]
        );
        
        results = vectorResult.rows.map((r: any) => ({
          id: r.id,
          doc_key: r.doc_key,
          content: r.content,
          metadata: r.metadata,
          similarity: parseFloat(r.similarity),
          source: 'semantic'
        }));
      }
    }
    
    // Fallback to text search if no semantic results or semantic search disabled
    if (results.length === 0) {
      const textResult = await pool.query(
        `SELECT id, doc_key, content, metadata
         FROM documents
         WHERE content ILIKE $1 OR doc_key ILIKE $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [`%${query}%`, limit]
      );
      
      results = textResult.rows.map((r: any) => ({
        id: r.id,
        doc_key: r.doc_key,
        content: r.content,
        metadata: r.metadata,
        similarity: null,
        source: 'text'
      }));
    }
    
    const latency_ms = Date.now() - started;
    
    return res.json({
      query,
      results,
      count: results.length,
      search_type: results.length > 0 ? results[0].source : 'none',
      latency_ms,
    });
  } catch (err: any) {
    console.error('Search error:', err.message);
    return res.status(500).json({ error: 'search_error', message: err?.message });
  }
});

app.post('/ingest', async (req: Request, res: Response) => {
  const { docKey, content, metadata } = req.body || {};
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content (string) required' });
  }
  
  try {
    const embedding = await getEmbedding(content);
    
    const result = await pool.query(
      `INSERT INTO documents (doc_key, content, metadata, embedding)
       VALUES ($1, $2, $3, $4)
       RETURNING id, doc_key, created_at`,
      [
        docKey || null,
        content,
        metadata ? JSON.stringify(metadata) : null,
        embedding ? JSON.stringify(embedding) : null
      ]
    );
    
    return res.json({
      success: true,
      document: result.rows[0],
      has_embedding: embedding !== null
    });
  } catch (err: any) {
    console.error('Ingest error:', err.message);
    return res.status(500).json({ error: 'ingest_error', message: err?.message });
  }
});

// Serve static UI files
const uiPath = path.join(__dirname, '../dist/ui');
app.use('/ui', express.static(uiPath));

// SPA fallback - serve index.html for all /ui/* routes
app.get('/ui/*', (_req: Request, res: Response) => {
  res.sendFile(path.join(uiPath, 'index.html'));
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`llm-memory agent listening on :${PORT}`);
});
