# Architecture.md

**Goal**: Technical document for implementation. Contains component diagrams, data model, API contracts, deployment, security requirements and examples.

## Table of Contents

- [Overview & Goals](#overview--goals)
- [Component Architecture](#component-architecture)
- [Data Model & DB Schema (Postgres + pgvector)](#data-model--db-schema-postgres--pgvector)
- [Memory Layer Design](#memory-layer-design)
- [Indexer & Embeddings](#indexer--embeddings)
- [Agent Service (TypeScript) – API & Interfaces](#agent-service-typescript--api--interfaces)
- [Deployment (Docker / Synology DSM7)](#deployment-docker--synology-dsm7)
- [Backup / Restore](#backup--restore)
- [Monitoring & Observability](#monitoring--observability)
- [Security & Access Control](#security--access-control)
- [ADRs / Documentation Workflow](#adrs--documentation-workflow)
- [Example Implementations](#example-implementations)

## 1. Overview & Goals

- Local, extensible Developer Agent
- Persistent Memory for Rules & Knowledge
- Postgres (pgvector) as Single Source of Truth
- TypeScript-based Agent (Node.js)

## 2. Component Architecture

- **Agent Service (Node.js / TS)**: Core logic, prompt management, rule loading, query engine
- **Postgres + pgvector**: Relational data + vector storage for embeddings
- **Indexer**: CLI/Worker, generates embeddings & upserts vector records
- **LLM Runner (optional)**: Ollama / Local LLM / Remote API
- **Frontend (optional)**: React UI for Chat + Admin
- **Queue (optional)**: BullMQ / Redis for indexer and async jobs

### Diagram (textual):

```
[Frontend] -> [Agent Service] -> [Postgres (pgvector)]
               \-> [LLM Runner]
[Indexing Worker] -> [Embeddings Generator] -> [Postgres (pgvector)]
```

## 3. Data Model & DB Schema (Postgres + pgvector)

### Core Tables

```sql
CREATE TABLE architectural_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE project_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_key TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vector store table for LlamaIndex/Embeddings
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key TEXT,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(1536), -- adjust to embedding dimension
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vectors
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Notes:
- Adjust `VECTOR(1536)` based on embedding model (e.g. 1536 for OpenAI text-embedding-3-small)
- Alternative: Use pgvector extension; ivfflat accelerates search

## 4. Memory Layer Design

- **GlobalMemory**: Persistent policies; loaded at agent start and merged as "system prompt" or rules
- **ProjectMemory**: Project-scoped contexts; loaded per request (e.g. by project_key)
- **EphemeralMemory**: Short-lived conversations, not persistent

### API Concept

- `GET /memory/global` — returns all GlobalRules
- `POST /memory/global` — create/update rule (auth required)
- `GET /memory/project/:projectKey`
- `POST /memory/project/:projectKey`

**Policy Enforcement**: Incoming prompts are validated against GlobalRules before processing (Rule Engine).

## 5. Indexer & Embeddings

### Indexer Jobs:
- **Sources**: `/docs/adr/*.md`, `/wiki/*.md`, PR summaries, commit messages
- **Steps**: Normalize → Chunk → Embed → Upsert
- **Embedding Service**: Local (e.g., Ollama embedding model) or remote (API)
- **Chunking**: 512–1500 tokens per chunk (depending on model)
- **Similarity Search**: cosine similarity via pgvector

## 6. Agent Service (TypeScript) – API & Interfaces

### Example TypeScript Interfaces

```typescript
export interface ArchitecturalPolicy {
  id: string;
  key: string;
  value: any; // JSON schema for rule
  description?: string;
}

export interface DocumentRecord {
  id: string;
  docKey?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}
```

### Minimal API Contract

- `POST /query` — Body `{projectKey?: string, query: string, topK?: number}` → Response: `{answers: [...], sources: [...]}`
- `POST /ingest` — Body `{docKey, content, metadata}` → Indexes and stores
- `POST /policy` — Updates GlobalRules

### Rule Persistence Behavior:
- Agent loads GlobalMemory and adds system block during prompt construction: "Follow these rules: ..."
- All rule changes require `POST /policy` with auth; otherwise read-only

## 7. Deployment (Docker / Synology DSM7)

### Minimal Docker Compose Example

```yaml
version: '3.8'
services:
  postgres:
  image: postgres:16
  environment:
    POSTGRES_PASSWORD: changeme
    POSTGRES_DB: ai_memory
  volumes:
    - ./pgdata:/var/lib/postgresql/data
  ports:
    - "5432:5432"

  api:
  build: ./agent
  depends_on:
    - postgres
  ports:
    - "3000:3000"
  environment:
    - DATABASE_URL=postgresql://postgres:changeme@postgres:5432/ai_memory

  indexer:
  build: ./indexer
  depends_on:
    - postgres
```

### Synology Tips

- Enable Docker/Container on DSM7 and use docker-compose via SSH
- Storage locations: Bind volumes to NAS volume with snapshots
- Resource limits in Compose (cpu_shares / mem_limit)

## 8. Backup / Restore

- **Postgres Dump (daily)**: `pg_dump -Fc -f /backups/ai_memory_$(date +%F).dump ai_memory`
- **Restore**: `pg_restore -d ai_memory /backups/ai_memory_2025-11-16.dump`
- **Volume Snapshots**: Regular Synology Volume Snapshots
- **Indexer reindex**: On restore: start reindexer that re-reads documents

## 9. Monitoring & Observability

- **Metrics**: Query latencies, retrieval hits, indexer job status
- **Tools**: Prometheus + Grafana (lightweight) or simple logs + health endpoints
- **Health endpoints**: `/health`, `/metrics`

## 10. Security & Access Control

- API key-based auth (Bearer token) for write endpoints
- Admin UI behind VPN / reverse proxy (Synology DSM reverse proxy)
- **Secrets**: Use Docker secrets or env files on local NAS (protected)
- **Optional**: mTLS between services for additional security

## 11. ADRs / Documentation Workflow

[Content continues...]
