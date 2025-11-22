# API Reference

This document describes all available API endpoints for the llm-memory agent service.

## Base URL

```
http://localhost:3000
```

(In production/Docker: adjust based on your deployment configuration)

## Health Check

### GET /health

Check the health status of the agent service and its dependencies.

**Response:**
```json
{
  "status": "ok",
  "postgres": "connected",
  "ollama": "reachable"
}
```

Status values:
- `ok` - All services operational
- `degraded` - Some services unavailable

---

## Policy Management

### POST /policy

Create or update an architectural policy.

**Request Body:**
```json
{
  "key": "naming_convention",
  "value": {
    "rule": "All microservices named {SomethingService}",
    "examples": ["AuthService", "PaymentService"]
  },
  "description": "Consistent service naming"
}
```

**Response:**
```json
{
  "updated": true,
  "policy": {
    "id": "uuid",
    "key": "naming_convention",
    "value": {...},
    "description": "...",
    "created_at": "2025-11-22T...",
    "updated_at": "2025-11-22T..."
  }
}
```

### GET /policies

List all architectural policies.

**Response:**
```json
[
  {
    "key": "naming_convention",
    "description": "Consistent service naming",
    "value": {...},
    "created_at": "2025-11-22T...",
    "updated_at": "2025-11-22T..."
  }
]
```

### GET /policies/:key

Get a specific policy by key.

**Response:**
```json
{
  "key": "naming_convention",
  "description": "Consistent service naming",
  "value": {...},
  "created_at": "2025-11-22T...",
  "updated_at": "2025-11-22T..."
}
```

**Error Response (404):**
```json
{
  "error": "policy_not_found"
}
```

---

## Query & Search

### POST /query

Query the agent with a question. Searches policies and generates an LLM-synthesized answer.

**Request Body:**
```json
{
  "query": "What is our naming convention?",
  "topK": 3
}
```

Parameters:
- `query` (string, required) - The question to ask
- `topK` (number, optional) - Number of policies to retrieve (1-10, default: 3)

**Response:**
```json
{
  "answer": "Based on the naming convention policy...",
  "sources": [
    {
      "key": "naming_convention",
      "excerpt": "All microservices named {SomethingService}..."
    }
  ],
  "latency_ms": 320
}
```

### POST /search

Semantic search through the knowledge base using vector embeddings.

**Request Body:**
```json
{
  "query": "error handling patterns",
  "topK": 5,
  "useSemanticSearch": true
}
```

Parameters:
- `query` (string, required) - Search query
- `topK` (number, optional) - Number of results (1-20, default: 5)
- `useSemanticSearch` (boolean, optional) - Use vector similarity search (default: true)

**Response:**
```json
{
  "query": "error handling patterns",
  "results": [
    {
      "id": "uuid",
      "doc_key": "error-handling-guide",
      "content": "Error handling best practices...",
      "metadata": {
        "category": "patterns",
        "tags": ["error-handling", "resilience"]
      },
      "similarity": 0.89,
      "source": "semantic"
    }
  ],
  "count": 5,
  "search_type": "semantic",
  "latency_ms": 180
}
```

Result fields:
- `similarity` - Cosine similarity score (0-1, higher is better). Only present for semantic search.
- `source` - Either "semantic" (vector search) or "text" (fallback text search)

**Fallback Behavior:**
If semantic search is unavailable (no embeddings or LLM service down), the endpoint automatically falls back to text-based search.

### POST /ingest

Add a document to the knowledge base with automatic embedding generation.

**Request Body:**
```json
{
  "docKey": "architecture-decision-001",
  "content": "We decided to use microservices architecture because...",
  "metadata": {
    "type": "ADR",
    "date": "2025-11-22",
    "author": "team"
  }
}
```

Parameters:
- `docKey` (string, optional) - Unique identifier for the document
- `content` (string, required) - The document content to index
- `metadata` (object, optional) - Additional metadata

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "doc_key": "architecture-decision-001",
    "created_at": "2025-11-22T..."
  },
  "has_embedding": true
}
```

**Note:** Embedding generation happens automatically if an LLM service is available. If embedding generation fails, the document is still stored but without embeddings (semantic search won't find it).

---

## Configuration

### Environment Variables

- `AGENT_PORT` - Port for the agent service (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `LLM_BASE_URL` - LLM service URL (default: http://host.docker.internal:11434)
- `LLM_PROVIDER` - LLM provider type: "ollama", "openai", or "lmstudio" (default: openai)
- `LLM_MODEL` - Model name for chat completions (default: mistral:7b)
- `EMBEDDING_MODEL` - Model name for embeddings (default: all-minilm)

### Search Configuration

Constants defined in the code:
- `MIN_SEARCH_LIMIT = 1`
- `DEFAULT_SEARCH_LIMIT = 5`
- `MAX_SEARCH_LIMIT = 20`

---

## Error Responses

All endpoints return appropriate HTTP status codes:

- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (database or service error)

Error response format:
```json
{
  "error": "error_type",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

**Note:** The current implementation does not include rate limiting as it's designed for single-user local deployment. For production multi-user scenarios, consider adding rate limiting middleware.

---

## Examples

### Querying for Architecture Guidance

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How should I handle errors in async operations?",
    "topK": 3
  }'
```

### Semantic Search for Patterns

```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "retry patterns",
    "topK": 5,
    "useSemanticSearch": true
  }'
```

### Adding a Document

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "docKey": "adr-001",
    "content": "We decided to adopt event-driven architecture...",
    "metadata": {
      "type": "ADR",
      "status": "accepted"
    }
  }'
```

### Creating a Policy

```bash
curl -X POST http://localhost:3000/policy \
  -H "Content-Type: application/json" \
  -d '{
    "key": "api_versioning",
    "value": {
      "rule": "Use semantic versioning for all APIs",
      "format": "v{major}.{minor}.{patch}"
    },
    "description": "API versioning standard"
  }'
```

---

## See Also

- [Architecture Guide](architecture.md) - Technical architecture overview
- [PRD](prd.md) - Product requirements and design decisions
