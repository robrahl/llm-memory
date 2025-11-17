import express, { type Request, type Response } from 'express';
import axios from 'axios';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = parseInt(process.env.AGENT_PORT || '3000', 10);
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://host.docker.internal:11434';
const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:changeme@localhost:5432/ai_memory';

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
      const resp = await axios.get(`${LLM_BASE_URL}/v1/models`, { timeout: 1500 });
      healthy = resp.status === 200;
    } else if (LLM_PROVIDER === 'ollama') {
      const resp = await axios.get(`${LLM_BASE_URL}/api/tags`, { timeout: 1500 });
      healthy = resp.status === 200;
    } else {
      // Try OpenAI then Ollama
      try {
        const r1 = await axios.get(`${LLM_BASE_URL}/v1/models`, { timeout: 1000 });
        healthy = r1.status === 200;
      } catch {
        const r2 = await axios.get(`${LLM_BASE_URL}/api/tags`, { timeout: 1000 });
        healthy = r2.status === 200;
      }
    }
    status.ollama = healthy ? 'reachable' : 'unreachable';
    if (!healthy) {
      status.status = status.postgres === 'connected' ? 'degraded' : 'degraded';
    }
  } catch {
    status.ollama = 'unreachable';
    status.status = status.postgres === 'connected' ? 'degraded' : 'degraded';
  }

  res.json(status);
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

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`llm-memory agent listening on :${PORT}`);
});
