# Testing Guide for Indexer & Search Features

## Overview

This guide covers testing the new indexer worker, CLI tool, and search UI components.

## Prerequisites

- Running PostgreSQL with pgvector extension
- LLM provider (Ollama, OpenAI, or LMStudio) for embeddings
- Node.js 18+ installed
- Docker (optional, for containerized testing)

## Unit Tests

### Running Unit Tests

```bash
npm test
```

The test suite includes:
- Indexer worker functionality
- Connection testing
- Document processing
- Progress tracking
- Error handling

### Test Coverage

Tests verify:
- Empty document handling
- Batch processing
- Concurrent operations
- Retry logic
- Statistics tracking

## Integration Tests

### Database Schema Tests

Test the database schema and pgvector setup:

```bash
npm run test:integration
```

This validates:
- Database connectivity
- Documents table exists
- pgvector extension installed
- Table schema is correct

### API Endpoint Tests

Test the /query and /search endpoints:

```bash
npm run test:api
```

This script tests:
- Health check endpoint
- Policy CRUD operations
- Query endpoint
- Search endpoint (semantic and text)
- Ingest endpoint

## CLI Tool Testing

### Help Command

```bash
npm run import -- --help
```

Expected output: Help message with usage instructions

### File Discovery Test

Test discovering markdown files:

```bash
# Create test files
mkdir -p /tmp/test-docs
echo "# Test Doc 1" > /tmp/test-docs/doc1.md
echo "# Test Doc 2" > /tmp/test-docs/doc2.md

# Test discovery (will fail on DB connection, but shows discovery)
npm run import -- /tmp/test-docs -v
```

Expected output:
- Discovers 2 markdown files
- Fails on database connection (if DB not running)

### Single File Import

```bash
npm run import -- ./README.md
```

### Directory Import

```bash
npm run import -- ./docs
```

### Recursive Import

```bash
npm run import -- ./docs --recursive
```

### Custom Options

```bash
npm run import -- ./docs -r --batch-size 20 --concurrency 5 -v
```

## Web UI Testing

### Manual UI Testing

1. Start the development server:

```bash
npm run dev
```

2. In another terminal, start the UI:

```bash
npm run dev:ui
```

3. Open browser to `http://localhost:5173/ui`

4. Test the new Search Tester tab:
   - Navigate to "Search Tester" tab
   - Enter a search query
   - Adjust Top K value
   - Toggle semantic search on/off
   - Click "Search Documents"
   - Verify results display correctly

### UI Test Scenarios

#### Scenario 1: Semantic Search

1. Toggle "Semantic Search" ON
2. Enter query: "docker deployment"
3. Click "Search Documents"
4. Verify:
   - Results appear with similarity scores
   - Search type badge shows "semantic"
   - Latency is displayed
   - Documents are ranked by similarity

#### Scenario 2: Text Search

1. Toggle "Semantic Search" OFF
2. Enter query: "authentication"
3. Click "Search Documents"
4. Verify:
   - Results appear without similarity scores
   - Search type badge shows "text"
   - Documents match text query

#### Scenario 3: No Results

1. Enter nonsensical query: "xyzabc123"
2. Click "Search Documents"
3. Verify:
   - "No documents found" message appears
   - No error is thrown

#### Scenario 4: Error Handling

1. Stop the backend server
2. Try to search
3. Verify:
   - Error message is displayed
   - UI doesn't crash

### Query Tester

Test the existing Query Tester tab:
1. Navigate to "Query Tester" tab
2. Enter: "What are naming conventions?"
3. Adjust Top K value
4. Click "Execute Query"
5. Verify answer and sources display

## End-to-End Testing

### Complete Workflow Test

1. **Import Documents**:
```bash
npm run import -- ./docs --recursive -v
```

2. **Start Services**:
```bash
docker-compose up -d
```

3. **Verify Health**:
```bash
curl http://localhost:3000/health
```

4. **Test Search API**:
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "docker deployment",
    "topK": 5,
    "useSemanticSearch": true
  }'
```

5. **Test UI**:
   - Open `http://localhost:3000/ui`
   - Use Search Tester
   - Verify results match API

## Performance Testing

### Large Import Test

Test with many documents:

```bash
# Create 100 test documents
mkdir -p /tmp/large-test
for i in {1..100}; do
  echo "# Document $i" > /tmp/large-test/doc$i.md
  echo "This is test document number $i with some content." >> /tmp/large-test/doc$i.md
done

# Import with custom settings
npm run import -- /tmp/large-test --batch-size 20 --concurrency 5 -v
```

Monitor:
- Import duration
- Memory usage
- Database connections
- Embedding generation time

### Search Performance Test

Test search performance:

1. Import 1000+ documents
2. Run multiple searches
3. Measure latency
4. Check for memory leaks

```bash
# Example search performance test
for i in {1..10}; do
  time curl -X POST http://localhost:3000/search \
    -H "Content-Type: application/json" \
    -d '{"query": "test query", "topK": 10}'
  echo ""
done
```

## Troubleshooting Tests

### Database Connection Issues

If tests fail with database errors:

1. Check DATABASE_URL environment variable
2. Verify PostgreSQL is running
3. Run schema initialization:
```bash
docker-compose exec postgres psql -U postgres -d ai_memory -f /scripts/init-pgvector.sql
```

### Embedding Generation Issues

If embeddings fail:

1. Check LLM_BASE_URL is accessible
2. Verify embedding model is available
3. Test embedding endpoint manually:
```bash
# For Ollama
curl http://localhost:11434/api/embeddings \
  -d '{"model": "all-minilm", "prompt": "test"}'

# For OpenAI-compatible
curl http://localhost:11434/v1/embeddings \
  -d '{"model": "all-minilm", "input": "test"}'
```

### UI Build Issues

If UI build fails:

1. Clear node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

2. Clear vite cache:
```bash
rm -rf .vite node_modules/.vite
```

3. Rebuild:
```bash
npm run build:ui
```

## Automated Test Scripts

### test-all.sh

Create a comprehensive test script:

```bash
#!/bin/bash
set -e

echo "=== Running All Tests ==="

echo "1. Unit Tests"
npm test

echo "2. Integration Tests"
npm run test:integration

echo "3. Build Tests"
npm run build
npm run build:ui

echo "4. Lint Check"
npm run lint

echo "=== All Tests Passed ==="
```

## Continuous Integration

Add to CI pipeline:

```yaml
- name: Run Tests
  run: |
    npm test
    npm run test:integration
    npm run lint
    npm run build
    npm run build:ui
```

## Manual Verification Checklist

- [ ] CLI help displays correctly
- [ ] CLI discovers files properly
- [ ] Import progress is shown
- [ ] Statistics are accurate
- [ ] Search UI tab appears
- [ ] Semantic search works
- [ ] Text search works
- [ ] Results display correctly
- [ ] Error handling works
- [ ] No console errors
- [ ] Mobile responsive

## Known Issues

None at this time.

## See Also

- [Indexer README](INDEXER_README.md)
- [Search Implementation](SEARCH_IMPLEMENTATION.md)
- [Architecture](docs/reference/architecture.md)
