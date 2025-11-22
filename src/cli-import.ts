#!/usr/bin/env node
/**
 * CLI Tool - Import Markdown Files
 * 
 * Quick tool to import .md files into the knowledge base with embeddings.
 * 
 * Usage:
 *   npm run import -- <path>                    # Import single file or directory
 *   npm run import -- <path> --batch-size 20    # Custom batch size
 *   npm run import -- <path> --concurrency 5    # Custom concurrency
 *   npm run import -- <path> --recursive        # Recursive directory scan
 */

import fs from 'fs';
import path from 'path';
import { indexDocuments, testConnection, type DocumentInput, type IndexerStats } from './indexer.js';

interface CliOptions {
  batchSize: number;
  concurrency: number;
  recursive: boolean;
  verbose: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { targetPath: string; options: CliOptions } {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }
  
  const targetPath = args[0];
  const options: CliOptions = {
    batchSize: 10,
    concurrency: 3,
    recursive: false,
    verbose: false,
  };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--batch-size' && i + 1 < args.length) {
      options.batchSize = parseInt(args[++i], 10) || 10;
    } else if (arg === '--concurrency' && i + 1 < args.length) {
      options.concurrency = parseInt(args[++i], 10) || 3;
    } else if (arg === '--recursive' || arg === '-r') {
      options.recursive = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }
  
  return { targetPath, options };
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
🚀 LLM-Memory Markdown Importer

Usage:
  npm run import -- <path> [options]
  
Arguments:
  path                    Path to .md file or directory

Options:
  --batch-size <n>        Number of documents per batch (default: 10)
  --concurrency <n>       Number of concurrent operations (default: 3)
  --recursive, -r         Recursively scan directories
  --verbose, -v           Verbose output
  --help, -h              Show this help message

Examples:
  npm run import -- ./docs/policies/
  npm run import -- ./README.md
  npm run import -- ./docs --recursive --batch-size 20
  npm run import -- ./knowledge --concurrency 5 -v
`);
}

/**
 * Discover markdown files in a path
 */
function discoverMarkdownFiles(targetPath: string, recursive: boolean): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Path does not exist: ${targetPath}`);
  }
  
  const stats = fs.statSync(targetPath);
  
  if (stats.isFile()) {
    if (targetPath.endsWith('.md')) {
      files.push(targetPath);
    } else {
      throw new Error(`File is not a markdown file: ${targetPath}`);
    }
  } else if (stats.isDirectory()) {
    const entries = fs.readdirSync(targetPath);
    
    for (const entry of entries) {
      const fullPath = path.join(targetPath, entry);
      const entryStat = fs.statSync(fullPath);
      
      if (entryStat.isFile() && entry.endsWith('.md')) {
        files.push(fullPath);
      } else if (entryStat.isDirectory() && recursive) {
        files.push(...discoverMarkdownFiles(fullPath, recursive));
      }
    }
  }
  
  return files;
}

/**
 * Read and parse markdown file
 */
function parseMarkdownFile(filePath: string): DocumentInput {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  const fileName = path.basename(filePath, '.md');
  
  // Extract title from first H1 heading if available
  let title = fileName;
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1].trim();
  }
  
  return {
    docKey: relativePath,
    content: content,
    metadata: {
      title,
      fileName,
      filePath: relativePath,
      importedAt: new Date().toISOString(),
    },
  };
}

/**
 * Format progress output
 */
function formatProgress(stats: IndexerStats): string {
  const processed = stats.successful + stats.failed + stats.skipped;
  const progress = ((processed / stats.total) * 100).toFixed(1);
  return `Progress: ${processed}/${stats.total} (${progress}%) | ✓ ${stats.successful} | ✗ ${stats.failed} | ⊘ ${stats.skipped}`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 LLM-Memory Markdown Importer\n');
  
  try {
    // Parse arguments
    const { targetPath, options } = parseArgs();
    
    if (options.verbose) {
      console.log('Options:', {
        targetPath,
        batchSize: options.batchSize,
        concurrency: options.concurrency,
        recursive: options.recursive,
      });
      console.log();
    }
    
    // Test database connection
    console.log('📡 Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      console.error('   Check DATABASE_URL environment variable');
      process.exit(1);
    }
    console.log('✅ Database connected\n');
    
    // Discover markdown files
    console.log('🔍 Discovering markdown files...');
    const files = discoverMarkdownFiles(targetPath, options.recursive);
    
    if (files.length === 0) {
      console.log('⚠️  No markdown files found');
      process.exit(0);
    }
    
    console.log(`📚 Found ${files.length} markdown file(s)\n`);
    
    if (options.verbose) {
      files.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file}`);
      });
      console.log();
    }
    
    // Parse files
    console.log('📖 Parsing files...');
    const documents = files.map(file => parseMarkdownFile(file));
    console.log('✅ Files parsed\n');
    
    // Index documents
    console.log('🔄 Indexing documents...\n');
    
    let lastProgress = '';
    const stats = await indexDocuments(documents, {
      batchSize: options.batchSize,
      concurrency: options.concurrency,
      onProgress: (s) => {
        const progress = formatProgress(s);
        if (progress !== lastProgress) {
          if (lastProgress) {
            // Clear previous line
            process.stdout.write('\r\x1b[K');
          }
          process.stdout.write(progress);
          lastProgress = progress;
        }
      },
    });
    
    // Clear progress line
    if (lastProgress) {
      process.stdout.write('\n');
    }
    
    // Print summary
    console.log('\n✅ Import completed!\n');
    console.log('📊 Summary:');
    console.log(`   Total:      ${stats.total}`);
    console.log(`   Successful: ${stats.successful} ✓`);
    console.log(`   Failed:     ${stats.failed} ✗`);
    console.log(`   Skipped:    ${stats.skipped} ⊘`);
    console.log(`   Duration:   ${(stats.durationMs! / 1000).toFixed(2)}s`);
    console.log();
    
    if (stats.failed > 0) {
      console.log('⚠️  Some documents failed to import. Check logs for details.');
      process.exit(1);
    }
    
  } catch (err: any) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

// Run main if executed directly
if (require.main === module) {
  main();
}

export { main, discoverMarkdownFiles, parseMarkdownFile };
