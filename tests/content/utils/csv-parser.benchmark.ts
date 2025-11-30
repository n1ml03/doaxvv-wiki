/**
 * Benchmark: parseCSV vs parseCSVChunked
 * So sánh hiệu suất với các dataset có kích thước khác nhau
 */

import { parseCSV } from '../../../src/content/utils/csv-parser';
import { parseCSVChunked } from '../../../src/content/utils/performance';

// Generate CSV với số dòng cụ thể
function generateCSV(rowCount: number, columnCount: number = 10): string {
  const headers = Array.from({ length: columnCount }, (_, i) => `column${i}`).join(',');
  const rows: string[] = [headers];
  
  for (let i = 0; i < rowCount; i++) {
    const row = Array.from({ length: columnCount }, (_, j) => `value_${i}_${j}`).join(',');
    rows.push(row);
  }
  
  return rows.join('\n');
}

// Benchmark function
async function benchmark(name: string, fn: () => Promise<void> | void, iterations: number = 5): Promise<number> {
  const times: number[] = [];
  
  // Warmup
  await fn();
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`${name}: ${avg.toFixed(2)}ms (avg of ${iterations} runs)`);
  return avg;
}

// Main benchmark
async function runBenchmarks() {
  const rowCounts = [100, 500, 1000, 5000, 10000, 50000, 100000];
  const results: Array<{rows: number, sync: number, async: number, diff: number}> = [];
  
  console.log('\n=== CSV Parser Benchmark (10 iterations each) ===\n');
  
  for (const rowCount of rowCounts) {
    const csv = generateCSV(rowCount);
    const sizeKB = (csv.length / 1024).toFixed(1);
    
    // Force GC if available
    if (global.gc) global.gc();
    
    // Benchmark parseCSV (sync)
    const syncTime = await benchmark(`parseCSV (${rowCount} rows, ${sizeKB}KB)`, () => {
      parseCSV(csv);
    }, 10);
    
    // Force GC if available
    if (global.gc) global.gc();
    
    // Benchmark parseCSVChunked (async)
    const asyncTime = await benchmark(`parseCSVChunked (${rowCount} rows, ${sizeKB}KB)`, async () => {
      await parseCSVChunked(csv);
    }, 10);
    
    const diff = ((asyncTime - syncTime) / syncTime * 100);
    results.push({ rows: rowCount, sync: syncTime, async: asyncTime, diff });
    console.log('');
  }
  
  // Summary table
  console.log('\n=== SUMMARY ===\n');
  console.log('Rows\t\tSync (ms)\tAsync (ms)\tDiff %\t\tBetter');
  console.log('─'.repeat(70));
  
  for (const r of results) {
    const winner = r.sync < r.async ? 'Sync' : 'Async';
    const improvement = r.sync < r.async 
      ? `Sync ${Math.abs(r.diff).toFixed(1)}% faster`
      : `Async ${Math.abs(r.diff).toFixed(1)}% faster`;
    console.log(`${r.rows}\t\t${r.sync.toFixed(2)}\t\t${r.async.toFixed(2)}\t\t${r.diff > 0 ? '+' : ''}${r.diff.toFixed(1)}%\t\t${improvement}`);
  }
  
  // Conclusion
  console.log('\n=== CONCLUSION ===');
  const asyncWins = results.filter(r => r.async < r.sync);
  const syncWins = results.filter(r => r.sync < r.async);
  
  console.log(`\nAsync (parseCSVChunked) wins: ${asyncWins.length}/${results.length} cases`);
  console.log(`Sync (parseCSV) wins: ${syncWins.length}/${results.length} cases`);
  
  if (asyncWins.length > 0) {
    const avgAsyncImprovement = asyncWins.reduce((sum, r) => sum + Math.abs(r.diff), 0) / asyncWins.length;
    console.log(`\nAverage improvement when Async wins: ${avgAsyncImprovement.toFixed(1)}%`);
    console.log(`Async performs better at: ${asyncWins.map(r => r.rows + ' rows').join(', ')}`);
  }
}

runBenchmarks().catch(console.error);
