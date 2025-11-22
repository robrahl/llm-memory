/**
 * Indexer Worker - Batch import documents into pgvector
 * 
 * This module provides functionality to:
 * - Batch process documents for embedding generation
 * - Insert documents with embeddings into the database
 * - Handle errors and retries gracefully
 * - Track progress and statistics
 */

import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:changeme@localhost:5432/ai_memory';
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://host.docker.internal:11434';
const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
const DEFAULT_EMBEDDING_MODEL = 'all-minilm';

export interface DocumentInput {
  docKey: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface IndexerStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
}

export interface IndexerOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  concurrency?: number;
  onProgress?: (stats: IndexerStats) => void;
}

const DEFAULT_OPTIONS: Required<IndexerOptions> = {
  batchSize: 10,
  maxRetries: 3,
  retryDelayMs: 1000,
  concurrency: 3,
  onProgress: () => {},
};

/**
 * Get embedding for text from LLM provider
 */
async function getEmbedding(text: string, retries = 0, maxRetries = 3): Promise<number[] | null> {
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

    const resp = await axios.post(embeddingUrl, requestBody, { timeout: 30000 });
    
    if (LLM_PROVIDER === 'ollama') {
      return resp.data?.embedding || null;
    } else {
      return resp.data?.data?.[0]?.embedding || null;
    }
  } catch (err: any) {
    console.error(`Embedding generation failed (attempt ${retries + 1}/${maxRetries}):`, err.message);
    
    if (retries < maxRetries) {
      const delay = Math.pow(2, retries) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return getEmbedding(text, retries + 1, maxRetries);
    }
    
    return null;
  }
}

/**
 * Process documents in batches and insert into database
 */
export async function indexDocuments(
  documents: DocumentInput[],
  options: IndexerOptions = {}
): Promise<IndexerStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  const stats: IndexerStats = {
    total: documents.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
  };

  try {
    // Process documents in batches
    for (let i = 0; i < documents.length; i += opts.batchSize) {
      const batch = documents.slice(i, i + opts.batchSize);
      
      // Process batch with concurrency control
      await processBatch(pool, batch, stats, opts);
      
      // Report progress
      opts.onProgress(stats);
    }
    
    stats.endTime = new Date();
    stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();
  } finally {
    await pool.end();
  }
  
  return stats;
}

/**
 * Process a batch of documents with concurrency control
 */
async function processBatch(
  pool: Pool,
  batch: DocumentInput[],
  stats: IndexerStats,
  options: Required<IndexerOptions>
): Promise<void> {
  const semaphore = new Semaphore(options.concurrency);
  
  const promises = batch.map(async (doc) => {
    await semaphore.acquire();
    
    try {
      await processDocument(pool, doc, stats, options);
    } finally {
      semaphore.release();
    }
  });
  
  await Promise.all(promises);
}

/**
 * Process a single document: generate embedding and insert into DB
 */
async function processDocument(
  pool: Pool,
  doc: DocumentInput,
  stats: IndexerStats,
  options: Required<IndexerOptions>
): Promise<void> {
  try {
    // Skip empty content
    if (!doc.content || doc.content.trim().length === 0) {
      stats.skipped++;
      return;
    }
    
    // Generate embedding with retries
    const embedding = await getEmbedding(doc.content, 0, options.maxRetries);
    
    // Insert document into database
    await pool.query(
      `INSERT INTO documents (doc_key, content, metadata, embedding)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (doc_key) 
       DO UPDATE SET 
         content = EXCLUDED.content,
         metadata = EXCLUDED.metadata,
         embedding = EXCLUDED.embedding,
         updated_at = now()`,
      [
        doc.docKey,
        doc.content,
        doc.metadata ? JSON.stringify(doc.metadata) : null,
        embedding ? JSON.stringify(embedding) : null
      ]
    );
    
    stats.successful++;
  } catch (err: any) {
    console.error(`Failed to process document ${doc.docKey}:`, err.message);
    stats.failed++;
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const resolve = this.queue.shift();
    if (resolve) {
      resolve();
    } else {
      this.permits++;
    }
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    return false;
  } finally {
    await pool.end();
  }
}
