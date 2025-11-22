# Indexer Worker & CLI Tool

## Overview

The indexer worker and CLI tool provide batch import functionality for documents into the llm-memory knowledge base with automatic embedding generation using pgvector.

## Features

- **Batch Processing**: Efficiently process multiple documents in configurable batches
- **Concurrent Embeddings**: Generate embeddings concurrently for faster processing
- **Retry Logic**: Automatic retry with exponential backoff for failed embeddings
- **Progress Tracking**: Real-time progress updates during import
- **Error Handling**: Graceful handling of failures with detailed statistics
- **Metadata Support**: Store custom metadata with each document

## CLI Tool Usage

### Basic Import

Import a single markdown file:

```bash
npm run import -- ./docs/README.md
```

Import a directory:

```bash
npm run import -- ./docs/
```

### Advanced Options

Import with recursive directory scanning:

```bash
npm run import -- ./docs --recursive
```

Custom batch size (default: 10):

```bash
npm run import -- ./docs --batch-size 20
```

Custom concurrency (default: 3):

```bash
npm run import -- ./docs --concurrency 5
```

Verbose output:

```bash
npm run import -- ./docs -v
```

Combine options:

```bash
npm run import -- ./knowledge --recursive --batch-size 20 --concurrency 5 -v
```

### Help

```bash
npm run import -- --help
```

## Programmatic Usage

You can also use the indexer worker programmatically in your code:

```typescript
import { indexDocuments, type DocumentInput } from './src/indexer';

const documents: DocumentInput[] = [
  {
    docKey: 'doc-1',
    content: 'Document content here...',
    metadata: {
      title: 'My Document',
      author: 'John Doe',
      tags: ['documentation', 'guide'],
    },
  },
  // ... more documents
];

const stats = await indexDocuments(documents, {
  batchSize: 10,
  concurrency: 3,
  maxRetries: 3,
  onProgress: (stats) => {
    console.log(`Progress: ${stats.successful}/${stats.total}`);
  },
});

console.log('Import completed:', stats);
```

## Configuration

The indexer uses the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `LLM_BASE_URL`: LLM provider URL for embeddings
- `LLM_PROVIDER`: Provider type (`ollama`, `openai`, `lmstudio`)
- `EMBEDDING_MODEL`: Model name for embeddings (default: `all-minilm`)

## Database Schema

The documents are stored in the `documents` table:

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key TEXT UNIQUE,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Upsert Behavior

The indexer uses `ON CONFLICT` to handle duplicate `doc_key` values:
- If a document with the same `doc_key` exists, it will be updated
- If it doesn't exist, a new document will be created
- The `updated_at` timestamp is automatically updated on upserts

## Performance

### Batch Size

- **Small batches (5-10)**: Lower memory usage, more frequent progress updates
- **Large batches (20-50)**: Better throughput, higher memory usage

### Concurrency

- **Low concurrency (1-3)**: Lower load on LLM provider, sequential processing
- **High concurrency (5-10)**: Faster processing, higher load on LLM provider

### Recommendations

For typical usage:
- Batch size: 10-20 documents
- Concurrency: 3-5 simultaneous embeddings
- Retry count: 3 attempts

For large imports (1000+ documents):
- Batch size: 20-50 documents
- Concurrency: 5-10 simultaneous embeddings
- Monitor LLM provider capacity

## Error Handling

The indexer handles errors gracefully:

1. **Empty Content**: Documents with empty content are skipped
2. **Embedding Failures**: Automatic retry with exponential backoff
3. **Database Errors**: Individual document failures don't stop the batch
4. **Statistics**: Detailed stats show successful, failed, and skipped documents

## Examples

### Import Documentation

```bash
npm run import -- ./docs --recursive --batch-size 15
```

### Import Single File

```bash
npm run import -- ./README.md
```

### Import with Progress

```bash
npm run import -- ./knowledge --verbose
```

## Testing

Run tests:

```bash
npm test
```

The test suite includes:
- Connection testing
- Empty document handling
- Progress callback verification
- Metadata support validation

## Troubleshooting

### Connection Failed

If you see "Failed to connect to database":
1. Check `DATABASE_URL` environment variable
2. Ensure PostgreSQL is running
3. Verify network connectivity

### Embedding Failures

If embeddings fail consistently:
1. Check `LLM_BASE_URL` is accessible
2. Verify the embedding model is available
3. Check LLM provider logs
4. Try increasing `maxRetries` option

### Slow Performance

If imports are slow:
1. Increase `concurrency` (if LLM provider can handle it)
2. Increase `batchSize` for better throughput
3. Check network latency to LLM provider
4. Monitor database performance

## See Also

- [Architecture](../docs/reference/architecture.md)
- [Search Implementation](../SEARCH_IMPLEMENTATION.md)
- [API Documentation](../docs/reference/api.md)
