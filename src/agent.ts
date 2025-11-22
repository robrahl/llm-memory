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

// Helper function to call LLM for text generation
async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const llmResp = await axios.post(
      `${LLM_BASE_URL}/v1/chat/completions`,
      {
        model: process.env.LLM_MODEL || 'mistral:7b',
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
      { timeout: 15000 }
    );

    if (llmResp.data?.choices?.[0]?.message?.content) {
      return llmResp.data.choices[0].message.content.trim();
    }
    throw new Error('No response from LLM');
  } catch (err: any) {
    console.error('LLM call failed:', err.message);
    throw err;
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

// V2.0 Endpoints

// POST /scan/compliance - Codebase policy compliance scanning
app.post('/scan/compliance', async (req: Request, res: Response) => {
  const { directory } = req.body || {};
  
  if (!directory || typeof directory !== 'string') {
    return res.status(400).json({ error: 'directory (string) required' });
  }
  
  try {
    const startTime = Date.now();
    
    // For now, return a mock response indicating the feature is not yet fully implemented
    // In a real implementation, this would scan files and check against policies
    const response = {
      success: true,
      summary: {
        files_scanned: 0,
        violations_found: 0,
        compliance_score: 1.0,
      },
      violations: [],
      scan_time_ms: Date.now() - startTime,
      note: 'Compliance scanning feature is planned for future implementation'
    };
    
    res.json(response);
  } catch (err: any) {
    console.error('Compliance scan error:', err.message);
    return res.status(500).json({ error: 'scan_error', message: err?.message });
  }
});

// POST /refactor/suggest - AI-powered refactoring suggestions
app.post('/refactor/suggest', async (req: Request, res: Response) => {
  const { code_snippet, context = 'general', focus_areas = ['all'] } = req.body || {};
  
  if (!code_snippet || typeof code_snippet !== 'string') {
    return res.status(400).json({ error: 'code_snippet (string) required' });
  }
  
  try {
    const startTime = Date.now();
    
    // Query LLM for refactoring suggestions
    const prompt = `Analyze this code and provide refactoring suggestions.
Context: ${context}
Focus areas: ${focus_areas.join(', ')}

Code:
${code_snippet}

Provide specific, actionable suggestions for improvements in:
1. Code quality and readability
2. Performance optimization
3. Security considerations
4. Best practices

Format your response as a JSON array of suggestions, each with: category, priority, description, and example.`;

    let suggestions = [];
    let overall_score = 0;
    
    try {
      const llmResponse = await callLLM(prompt);
      // Try to parse suggestions from response
      try {
        const parsed = JSON.parse(llmResponse);
        suggestions = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If not JSON, create a single suggestion from the text
        suggestions = [{
          category: 'general',
          priority: 'medium',
          description: llmResponse,
          example: ''
        }];
      }
      overall_score = suggestions.length > 0 ? 0.8 : 1.0;
    } catch (err: any) {
      // If LLM unavailable, provide basic static suggestions
      suggestions = [{
        category: 'availability',
        priority: 'info',
        description: 'LLM service unavailable. Enable LLM for AI-powered suggestions.',
        example: ''
      }];
      overall_score = 1.0;
    }
    
    res.json({
      success: true,
      suggestions,
      overall_score,
      analysis_time_ms: Date.now() - startTime
    });
  } catch (err: any) {
    console.error('Refactor suggest error:', err.message);
    return res.status(500).json({ error: 'refactor_error', message: err?.message });
  }
});

// POST /adr/generate - Generate Architecture Decision Record
app.post('/adr/generate', async (req: Request, res: Response) => {
  const { title, context, decision, consequences = '', alternatives = '', status = 'proposed' } = req.body || {};
  
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title (string) required' });
  }
  if (!context || typeof context !== 'string') {
    return res.status(400).json({ error: 'context (string) required' });
  }
  if (!decision || typeof decision !== 'string') {
    return res.status(400).json({ error: 'decision (string) required' });
  }
  
  try {
    // Get next ADR number by counting existing ADRs in database
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM documents WHERE doc_key LIKE 'adr-%'`
    );
    const nextNumber = parseInt(countResult.rows[0].count) + 1;
    const adrNumber = String(nextNumber).padStart(4, '0');
    
    const date = new Date().toISOString().split('T')[0];
    const adrKey = `adr-${adrNumber}`;
    
    // Generate ADR content
    const adrContent = `# ADR-${adrNumber}: ${title}

**Status:** ${status}
**Date:** ${date}

## Context

${context}

## Decision

${decision}

${consequences ? `## Consequences

${consequences}` : ''}

${alternatives ? `## Alternatives Considered

${alternatives}` : ''}

## References

- Generated: ${new Date().toISOString()}
`;

    // Store ADR in database
    await pool.query(
      `INSERT INTO documents (doc_key, content, metadata)
       VALUES ($1, $2, $3)
       ON CONFLICT (doc_key) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata`,
      [
        adrKey,
        adrContent,
        JSON.stringify({
          type: 'adr',
          number: adrNumber,
          title,
          status,
          date
        })
      ]
    );
    
    res.json({
      success: true,
      number: adrNumber,
      title,
      status,
      date,
      file_path: `docs/adr/${adrKey}.md`,
      content: adrContent,
      next_steps: [
        'Review with team',
        `Update status to 'accepted' after approval`,
        `Document is stored in knowledge base with key: ${adrKey}`
      ]
    });
  } catch (err: any) {
    console.error('ADR generation error:', err.message);
    return res.status(500).json({ error: 'adr_error', message: err?.message });
  }
});

// GET /metrics - System performance and usage metrics
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    // Get document and policy counts
    const docCount = await pool.query('SELECT COUNT(*) as count FROM documents');
    const policyCount = await pool.query('SELECT COUNT(*) as count FROM architectural_policies');
    
    // Get database size info
    const dbSize = await pool.query(`
      SELECT pg_database_size(current_database()) as size_bytes
    `);
    const sizeBytes = parseInt(dbSize.rows[0]?.size_bytes || '0');
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    
    // Calculate vector index size (approximate)
    const vectorSize = await pool.query(`
      SELECT pg_total_relation_size('documents') as size_bytes
    `);
    const vectorSizeBytes = parseInt(vectorSize.rows[0]?.size_bytes || '0');
    const vectorSizeMB = (vectorSizeBytes / (1024 * 1024)).toFixed(2);
    
    res.json({
      queries: {
        total: 0,
        avg_latency_ms: 0,
        p95_latency_ms: 0,
        p99_latency_ms: 0,
        error_rate: 0
      },
      storage: {
        documents: parseInt(docCount.rows[0]?.count || '0'),
        policies: parseInt(policyCount.rows[0]?.count || '0'),
        total_size_mb: parseFloat(sizeMB),
        vector_index_size_mb: parseFloat(vectorSizeMB)
      },
      system: {
        agent_uptime_hours: (process.uptime() / 3600).toFixed(2),
        postgres_connections: pool.totalCount,
        ollama_status: 'unknown',
        memory_usage_mb: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2),
        cpu_usage_percent: 0
      }
    });
  } catch (err: any) {
    console.error('Metrics error:', err.message);
    return res.status(500).json({ error: 'metrics_error', message: err?.message });
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
