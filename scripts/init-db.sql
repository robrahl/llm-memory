-- Fallback init script for Docker Compose (if pgvector extension needs special handling)
-- This script is called by postgres container automatically on first startup

CREATE EXTENSION IF NOT EXISTS vector;
