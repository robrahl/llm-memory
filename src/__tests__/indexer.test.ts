/**
 * Unit tests for the indexer worker module
 */

import { indexDocuments, testConnection, type DocumentInput } from '../indexer';

describe('Indexer Worker', () => {
  describe('testConnection', () => {
    it('should return a boolean indicating database connection status', async () => {
      const result = await testConnection();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('indexDocuments', () => {
    it('should handle empty document array', async () => {
      const documents: DocumentInput[] = [];
      const stats = await indexDocuments(documents);
      
      expect(stats.total).toBe(0);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.skipped).toBe(0);
    });

    it('should skip documents with empty content', async () => {
      const documents: DocumentInput[] = [
        { docKey: 'empty-doc', content: '' },
        { docKey: 'whitespace-doc', content: '   ' },
      ];
      
      const stats = await indexDocuments(documents, {
        batchSize: 5,
        concurrency: 1,
      });
      
      expect(stats.total).toBe(2);
      expect(stats.skipped).toBe(2);
    });

    it('should return statistics with timing information', async () => {
      const documents: DocumentInput[] = [
        { docKey: 'test-doc-1', content: 'Test document content' },
      ];
      
      const stats = await indexDocuments(documents);
      
      expect(stats.startTime).toBeInstanceOf(Date);
      expect(stats.endTime).toBeInstanceOf(Date);
      expect(stats.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should call onProgress callback during processing', async () => {
      const documents: DocumentInput[] = [
        { docKey: 'test-doc-1', content: 'First document' },
        { docKey: 'test-doc-2', content: 'Second document' },
      ];
      
      let progressCallCount = 0;
      
      await indexDocuments(documents, {
        batchSize: 1,
        onProgress: () => {
          progressCallCount++;
        },
      });
      
      expect(progressCallCount).toBeGreaterThan(0);
    });

    it('should process documents with metadata', async () => {
      const documents: DocumentInput[] = [
        {
          docKey: 'test-with-metadata',
          content: 'Document with metadata',
          metadata: {
            title: 'Test Document',
            author: 'Test Author',
          },
        },
      ];
      
      const stats = await indexDocuments(documents);
      
      expect(stats.total).toBe(1);
      // Should either succeed or fail, not skip
      expect(stats.successful + stats.failed).toBe(1);
    });
  });
});
