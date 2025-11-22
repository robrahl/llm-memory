# Search & Ingest Endpoints - Implementation Summary

This document describes the new semantic search and document ingestion capabilities added to llm-memory.

## Overview

The llm-memory agent now supports:
1. **Semantic Search** - Vector-based similarity search using pgvector
2. **Document Ingestion** - Add documents to the knowledge base with automatic embedding generation
3. **Graceful Degradation** - Falls back to text search when LLM service is unavailable

## New Endpoints

### POST /search
Semantic search through the knowledge base using vector embeddings.

**Features:**
- Vector similarity search using pgvector
- Automatic fallback to text search if embeddings unavailable
- Configurable result limit (1-20 documents)
- Returns similarity scores for semantic matches

**Example:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "error handling patterns",
    "topK": 5,
    "useSemanticSearch": true
  }'
```

### POST /ingest
Add documents to the knowledge base with automatic embedding generation.

**Features:**
- Automatic embedding generation via LLM
- Metadata support for categorization
- Graceful handling when embeddings fail (document stored without embeddings)

**Example:**
```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "docKey": "adr-001",
    "content": "Architecture Decision Record: Use microservices...",
    "metadata": {"type": "ADR", "status": "accepted"}
  }'
```

## Technical Implementation

### Database Schema
The database schema was already in place with all required tables:
- `documents` table with `embedding VECTOR(384)` column
- ivfflat index for fast similarity search
- Supporting tables (architectural_policies, project_context, etc.)

### Embedding Generation
- Supports both Ollama and OpenAI-compatible providers
- Uses configurable embedding model (default: all-minilm)
- 384-dimensional embeddings (matches all-MiniLM-L6-v2)

### Search Algorithm
1. **Semantic Search (default):**
   - Generate query embedding
   - Use pgvector cosine similarity (`<=>` operator)
   - Return top-K results with similarity scores

2. **Text Search (fallback):**
   - ILIKE pattern matching on content and doc_key
   - Activated when semantic search is disabled or embeddings unavailable

### Configuration

**Environment Variables:**
- `EMBEDDING_MODEL` - Embedding model name (default: all-minilm)
- `LLM_BASE_URL` - LLM service URL
- `LLM_PROVIDER` - Provider type (ollama/openai/lmstudio)

**Search Limits:**
- MIN_SEARCH_LIMIT = 1
- DEFAULT_SEARCH_LIMIT = 5
- MAX_SEARCH_LIMIT = 20

## Testing

### Integration Tests
Run database schema validation:
```bash
npm run test:integration
```

### API Tests
Run endpoint tests (requires running service):
```bash
npm run test:api
```

Or manually:
```bash
./scripts/test-api-endpoints.sh http://localhost:3000
```

## Performance

- Query latency is tracked and returned in responses
- Embedding generation typically takes 100-500ms depending on LLM provider
- Vector similarity search is optimized with ivfflat index

## Error Handling

- **400 Bad Request** - Missing or invalid parameters
- **500 Internal Server Error** - Database or service errors
- **Graceful degradation** - Falls back to text search when LLM unavailable

## Security Notes

- No rate limiting (designed for single-user local deployment)
- For production use, add rate limiting middleware
- Database credentials should be secured via environment variables

## Next Steps

1. **Index your documents:**
   ```bash
   curl -X POST http://localhost:3000/ingest \
     -H "Content-Type: application/json" \
     -d @your-document.json
   ```

2. **Test semantic search:**
   ```bash
   curl -X POST http://localhost:3000/search \
     -H "Content-Type: application/json" \
     -d '{"query": "your search query", "topK": 5}'
   ```

3. **Monitor performance:**
   - Check `latency_ms` in responses
   - Review agent logs for errors

## Documentation

- Full API Reference: [docs/reference/api-reference.md](../docs/reference/api-reference.md)
- Architecture: [docs/reference/architecture.md](../docs/reference/architecture.md)
- PRD: [docs/reference/prd.md](../docs/reference/prd.md)

## Changes Made

### Modified Files
- `src/agent.ts` - Added search, ingest endpoints and getEmbedding helper function

### New Files
- `docs/reference/api-reference.md` - Complete API documentation
- `scripts/test-api-endpoints.sh` - Bash script for API testing
- `scripts/test-search-integration.ts` - TypeScript integration tests
- `SEARCH_IMPLEMENTATION.md` - This file

### Configuration
- Added search limit constants
- Added default embedding model constant
- Updated package.json with new test scripts

## Implementation Timeline

- ✅ Database schema reviewed (already in place)
- ✅ Semantic search endpoint implemented
- ✅ Document ingestion endpoint implemented
- ✅ Embedding generation helper added
- ✅ Error handling and fallback logic
- ✅ API documentation created
- ✅ Test scripts created
- ✅ Code review feedback addressed
- ✅ Security scan completed (CodeQL)

## Known Limitations

1. **Rate Limiting:** Not implemented (single-user deployment)
2. **Embedding Cache:** Embeddings generated on-demand (no caching)
3. **Batch Ingestion:** No batch endpoint (ingest one document at a time)
4. **Query Cache:** Not integrated with search endpoint yet

These limitations are acceptable for V0 single-user deployment and can be addressed in future iterations if needed.
