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
  doc_key TEXT,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(384), -- all-MiniLM-L6-v2 is 384-dim
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vector index (ivfflat for fast similarity search)
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
