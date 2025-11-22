CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create architectural_policies table
CREATE TABLE IF NOT EXISTS architectural_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create documents table (for KB)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key TEXT UNIQUE,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(384), -- all-MiniLM-L6-v2 is 384-dim
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vector index (ivfflat for fast similarity search)
-- Performance tuning notes:
-- - lists: Number of inverted lists (clusters). Recommended: sqrt(rows) to 10*sqrt(rows)
-- - For < 1M rows: lists = 100 is a good default
-- - For 1M+ rows: Consider lists = 1000 or more
-- - Probe count (set at query time): Adjust probes in queries for speed vs accuracy tradeoff
-- - Index build requires at least 'lists' number of rows; index builds automatically after rows exist
-- - Use HNSW index for better recall at the cost of slightly slower build time (PostgreSQL 14+)
CREATE INDEX IF NOT EXISTS idx_documents_embedding 
  ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create project_context table
CREATE TABLE IF NOT EXISTS project_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_key TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create query_cache table (for offline mode)
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  answer TEXT,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create policy_versions table (for V1)
CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES architectural_policies(id) ON DELETE CASCADE,
  policy_key TEXT NOT NULL,
  version INT DEFAULT 1,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  effective_date TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_policies_key ON architectural_policies(key);
CREATE INDEX IF NOT EXISTS idx_documents_dockey ON documents(doc_key);
CREATE INDEX IF NOT EXISTS idx_project_context_key ON project_context(project_key);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_policy_versions_key ON policy_versions(policy_key);

-- Insert sample policies for testing
INSERT INTO architectural_policies (key, value, description)
VALUES 
  (
    'naming_convention',
    '{"rule": "All microservices named {SomethingService}", "examples": ["AuthService", "PaymentService", "AnalyticsService"]}'::jsonb,
    'Consistent service naming for discovery and contracts'
  ),
  (
    'error_handling',
    '{"rule": "All async operations must have timeout + retry logic", "timeout_ms": 30000, "retry_count": 3}'::jsonb,
    'Prevent hanging requests in distributed systems'
  ),
  (
    'logging_level',
    '{"rule": "Use structured JSON logging", "levels": ["debug", "info", "warn", "error"]}'::jsonb,
    'Structured logging for debugging and monitoring'
  )
ON CONFLICT (key) DO NOTHING;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON architectural_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- ===================================================================
--
-- Vector Search Index Tuning:
-- 
-- 1. IVFFlat Index Configuration:
--    - lists parameter: Number of clusters for inverted file index
--    - Formula: lists = sqrt(total_rows) to 10 * sqrt(rows)
--    - Examples:
--      * 10,000 rows   → lists = 100 (current default)
--      * 100,000 rows  → lists = 316 to 1000
--      * 1,000,000 rows → lists = 1000 to 3162
--
-- 2. Query-time Tuning (adjust probes):
--    SET ivfflat.probes = 10;  -- Default
--    SET ivfflat.probes = 20;  -- Better recall, slower
--    SET ivfflat.probes = 5;   -- Faster, lower recall
--
-- 3. Alternative Index (HNSW - better recall):
--    CREATE INDEX idx_documents_embedding_hnsw 
--      ON documents USING hnsw (embedding vector_cosine_ops) 
--      WITH (m = 16, ef_construction = 64);
--    
--    HNSW parameters:
--    - m: Number of connections per layer (8-64, default: 16)
--    - ef_construction: Size of dynamic candidate list (10-200, default: 64)
--    - Higher values = better recall but slower build
--
-- 4. Query Performance Tips:
--    - Keep embedding dimensions consistent (384 for all-MiniLM-L6-v2)
--    - Use approximate search for datasets > 10K documents
--    - Add WHERE filters before vector search when possible
--    - Monitor query performance with EXPLAIN ANALYZE
--
-- 5. Database Configuration (postgresql.conf):
--    shared_buffers = 256MB        # 25% of RAM for cache
--    effective_cache_size = 1GB    # 50-75% of RAM
--    maintenance_work_mem = 128MB  # For index creation
--    work_mem = 64MB              # Per query operation
--
-- 6. Monitoring Index Usage:
--    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
--    FROM pg_stat_user_indexes
--    WHERE tablename = 'documents';
--
-- 7. Rebuild Index (after significant data changes):
--    REINDEX INDEX idx_documents_embedding;
--
-- ===================================================================
