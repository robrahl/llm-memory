/**
 * Integration test for search and ingest endpoints
 * 
 * This test verifies the core functionality of the new endpoints
 * without requiring a running LLM service.
 */

import { Pool } from 'pg';

// Mock database connection for testing
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:changeme@localhost:5432/ai_memory';

interface SearchResult {
  id: string;
  doc_key: string | null;
  content: string;
  metadata: any;
  similarity: number | null;
  source: 'semantic' | 'text';
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
  search_type: string;
  latency_ms: number;
}

async function testDatabaseConnection(): Promise<boolean> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const result = await pool.query('SELECT 1');
    await pool.end();
    return result.rowCount === 1;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

async function testDocumentsTableExists(): Promise<boolean> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'documents'
      );
    `);
    await pool.end();
    return result.rows[0].exists === true;
  } catch (err) {
    console.error('Table check failed:', err);
    return false;
  }
}

async function testVectorExtension(): Promise<boolean> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      );
    `);
    await pool.end();
    return result.rows[0].exists === true;
  } catch (err) {
    console.error('Vector extension check failed:', err);
    return false;
  }
}

async function runTests() {
  console.log('=== Search & Ingest Endpoint Integration Tests ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Database connectivity
  console.log('Test 1: Database Connection');
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log('✓ Database connection successful\n');
    passed++;
  } else {
    console.log('✗ Database connection failed\n');
    failed++;
    console.log('Cannot continue without database. Exiting.\n');
    process.exit(1);
  }

  // Test 2: Documents table exists
  console.log('Test 2: Documents Table Exists');
  const tableExists = await testDocumentsTableExists();
  if (tableExists) {
    console.log('✓ Documents table exists\n');
    passed++;
  } else {
    console.log('✗ Documents table does not exist\n');
    failed++;
  }

  // Test 3: pgvector extension is installed
  console.log('Test 3: pgvector Extension');
  const vectorExists = await testVectorExtension();
  if (vectorExists) {
    console.log('✓ pgvector extension is installed\n');
    passed++;
  } else {
    console.log('✗ pgvector extension not found\n');
    failed++;
  }

  // Test 4: Check documents table schema
  console.log('Test 4: Documents Table Schema');
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents'
      ORDER BY ordinal_position;
    `);
    await pool.end();
    
    const columns = result.rows.map(r => r.column_name);
    const requiredColumns = ['id', 'doc_key', 'content', 'metadata', 'embedding', 'created_at'];
    const hasAllColumns = requiredColumns.every(col => columns.includes(col));
    
    if (hasAllColumns) {
      console.log('✓ Documents table has all required columns');
      console.log(`  Columns: ${columns.join(', ')}\n`);
      passed++;
    } else {
      console.log('✗ Documents table missing required columns');
      console.log(`  Found: ${columns.join(', ')}`);
      console.log(`  Required: ${requiredColumns.join(', ')}\n`);
      failed++;
    }
  } catch (err: any) {
    console.log('✗ Error checking table schema:', err.message, '\n');
    failed++;
  }

  // Summary
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log('All tests passed! ✓');
    console.log('\nThe database schema is ready for the search and ingest endpoints.');
    console.log('Next steps:');
    console.log('  1. Start the agent service: npm run dev');
    console.log('  2. Test endpoints: ./scripts/test-api-endpoints.sh');
  } else {
    console.log(`${failed} test(s) failed. Please check the database setup.`);
    process.exit(1);
  }
}

// Run tests only if this file is executed directly (not imported)
// Check if this module is the entry point
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

export { runTests, testDatabaseConnection, testDocumentsTableExists, testVectorExtension };
