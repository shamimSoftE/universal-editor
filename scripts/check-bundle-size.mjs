import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BUDGETS = [
  { package: 'core', file: 'packages/core/dist/universal-editor.es.js', maxRawKb: 1250, maxGzipKb: 350 },
  { package: 'core', file: 'packages/core/dist/universal-editor.umd.js', maxRawKb: 850, maxGzipKb: 280 },
  { package: 'vue3', file: 'packages/vue3/dist/index.js', maxRawKb: 150, maxGzipKb: 35 },
  { package: 'vue3-css', file: 'packages/vue3/dist/style.css', maxRawKb: 85, maxGzipKb: 18 },
  { package: 'vue2', file: 'packages/vue2/dist/index.js', maxRawKb: 30, maxGzipKb: 10 },
  { package: 'extensions', file: 'packages/extensions/dist/index.js', maxRawKb: 10, maxGzipKb: 3 },
  { package: 'utils', file: 'packages/utils/dist/index.js', maxRawKb: 10, maxGzipKb: 3 },
];

export function analyzeBundleSizes() {
  let allPassed = true;
  const results = [];

  for (const b of BUDGETS) {
    const fullPath = path.join(rootDir, b.file);
    if (!fs.existsSync(fullPath)) {
      results.push({
        package: b.package,
        file: b.file,
        rawKb: 0,
        gzipKb: 0,
        maxRawKb: b.maxRawKb,
        maxGzipKb: b.maxGzipKb,
        passed: false,
      });
      allPassed = false;
      continue;
    }

    const content = fs.readFileSync(fullPath);
    const rawKb = parseFloat((content.length / 1024).toFixed(2));
    const gzipKb = parseFloat((zlib.gzipSync(content).length / 1024).toFixed(2));

    const passed = rawKb <= b.maxRawKb && gzipKb <= b.maxGzipKb;
    if (!passed) allPassed = false;

    results.push({
      package: b.package,
      file: b.file,
      rawKb,
      gzipKb,
      maxRawKb: b.maxRawKb,
      maxGzipKb: b.maxGzipKb,
      passed,
    });
  }

  return { results, allPassed };
}

if (process.argv[1] && process.argv[1].endsWith('check-bundle-size.mjs')) {
  console.log('========================================================================');
  console.log(' Universal Rich Text Editor — Phase 28: Production Bundle Budget Analysis');
  console.log('========================================================================\n');

  const { results, allPassed } = analyzeBundleSizes();

  console.log(
    'Package'.padEnd(14) +
    'File'.padEnd(42) +
    'Raw (KB)'.padStart(10) +
    'Budget'.padStart(9) +
    'Gzip (KB)'.padStart(12) +
    'Budget'.padStart(9) +
    '  Status'
  );
  console.log('-'.repeat(102));

  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(
      r.package.padEnd(14) +
      r.file.padEnd(42) +
      r.rawKb.toFixed(2).padStart(10) +
      (r.maxRawKb + 'KB').padStart(9) +
      r.gzipKb.toFixed(2).padStart(12) +
      (r.maxGzipKb + 'KB').padStart(9) +
      '  ' + status
    );
  }

  console.log('\n' + '='.repeat(102));
  if (allPassed) {
    console.log('🎉 ALL PRODUCTION BUNDLES COMPLY WITH STRICT PERFORMANCE BUDGETS!\n');
    process.exit(0);
  } else {
    console.error('❌ BUNDLE SIZE BUDGET EXCEEDED! Please optimize.\n');
    process.exit(1);
  }
}
