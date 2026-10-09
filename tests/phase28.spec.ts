import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  ContentSanitizer,
  LazyExtensionRegistry,
  PerformanceMonitor,
  createLazyEditor,
  countWords,
  countCharacters,
  countParagraphs,
  calculateReadingTime,
} from '@universal-editor/core';
// @ts-ignore
import { analyzeBundleSizes } from '../scripts/check-bundle-size.mjs';

describe('Phase 28: Production Optimization & Performance Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const packagesDir = path.join(rootDir, 'packages');
  const laravelConfigPath = path.join(rootDir, 'laravel', 'config', 'editor.php');

  beforeEach(() => {
    ContentSanitizer.clearCache();
    LazyExtensionRegistry.clear();
  });

  describe('1. Tree-Shaking & Side-Effects Manifests', () => {
    const packagesToCheck = [
      { name: 'core', expected: ['*.css', './src/ui/styles.css'] },
      { name: 'vue3', expected: ['*.css', './dist/style.css'] },
      { name: 'vue2', expected: false },
      { name: 'extensions', expected: false },
      { name: 'utils', expected: false },
    ];

    for (const pkg of packagesToCheck) {
      it(`verifies package.json in ${pkg.name} specifies sideEffects: ${JSON.stringify(pkg.expected)}`, () => {
        const pkgJsonPath = path.join(packagesDir, pkg.name, 'package.json');
        expect(fs.existsSync(pkgJsonPath)).toBe(true);

        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        expect(pkgJson.sideEffects).toEqual(pkg.expected);
      });
    }
  });

  describe('2. Production Bundle Size Budgets', () => {
    it('confirms all package bundles satisfy strict performance budgets', () => {
      const { results, allPassed } = analyzeBundleSizes();
      expect(allPassed).toBe(true);

      for (const res of results) {
        expect(res.passed).toBe(true);
        expect(res.rawKb).toBeLessThanOrEqual(res.maxRawKb);
        expect(res.gzipKb).toBeLessThanOrEqual(res.maxGzipKb);
      }
    });

    it('validates demo bundle code-splitting chunks exist in demo/dist', () => {
      const demoDist = path.join(rootDir, 'demo', 'dist', 'assets');
      expect(fs.existsSync(demoDist)).toBe(true);

      const files = fs.readdirSync(demoDist);
      const hasVueChunk = files.some((f) => f.startsWith('vendor-vue') && f.endsWith('.js'));
      const hasEditorChunk = files.some((f) => f.startsWith('vendor-editor') && f.endsWith('.js'));
      const hasIndexChunk = files.some((f) => f.startsWith('index-') && f.endsWith('.js'));

      expect(hasVueChunk).toBe(true);
      expect(hasEditorChunk).toBe(true);
      expect(hasIndexChunk).toBe(true);
    });
  });

  describe('3. High-Throughput Sanitization & Memory Cache', () => {
    it('caches sanitized HTML output for subsequent identical calls', () => {
      const htmlPayload = '<p>Performance testing <strong>bold text</strong> and <script>alert(1)</script>clean link.</p>';
      
      expect(ContentSanitizer.getCacheSize()).toBe(0);

      // First run: uncached
      const firstResult = ContentSanitizer.sanitize(htmlPayload);
      expect(firstResult).not.toContain('<script>');
      expect(firstResult).toContain('<strong>bold text</strong>');
      expect(ContentSanitizer.getCacheSize()).toBe(1);

      // Second run: retrieved from cache
      const secondResult = ContentSanitizer.sanitize(htmlPayload);
      expect(secondResult).toBe(firstResult);
      expect(ContentSanitizer.getCacheSize()).toBe(1);

      // Verify clearCache()
      ContentSanitizer.clearCache();
      expect(ContentSanitizer.getCacheSize()).toBe(0);
    });

    it('benchmarks sanitization cache throughput (> 1,000 ops in < 25ms)', () => {
      const payload = '<p>Enterprise monorepo <em>high-throughput</em> sanitization benchmark.</p>';

      const start = performance.now();
      for (let i = 0; i < 2000; i++) {
        ContentSanitizer.sanitize(payload);
      }
      const duration = performance.now() - start;

      // 2,000 cached sanitizations should complete in < 25ms
      expect(duration).toBeLessThan(25);
    });
  });

  describe('4. Lazy Loading & Performance Monitoring', () => {
    it('deduplicates dynamic extension loading via LazyExtensionRegistry', async () => {
      let callCount = 0;
      const mockLoader = async () => {
        callCount++;
        return { name: 'AsyncExtension', installed: true };
      };

      expect(LazyExtensionRegistry.isLoaded('test-ext')).toBe(false);

      const [res1, res2, res3] = await Promise.all([
        LazyExtensionRegistry.load('test-ext', mockLoader),
        LazyExtensionRegistry.load('test-ext', mockLoader),
        LazyExtensionRegistry.load('test-ext', mockLoader),
      ]);

      expect(res1).toEqual(res2);
      expect(res2).toEqual(res3);
      expect(callCount).toBe(1); // Only called once despite 3 concurrent calls
      expect(LazyExtensionRegistry.isLoaded('test-ext')).toBe(true);
    });

    it('measures execution duration accurately via PerformanceMonitor', async () => {
      const { result, durationMs } = await PerformanceMonitor.measure('test-operation', async () => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) sum += i;
        return sum;
      });

      expect(result).toBe(49995000);
      expect(durationMs).toBeGreaterThanOrEqual(0);
      expect(durationMs).toBeLessThan(50);
    });

    it('provides createLazyEditor API signature', () => {
      expect(typeof createLazyEditor).toBe('function');
    });
  });

  describe('5. Large Document Performance Benchmark (10,000 Words)', () => {
    it('calculates document statistics on 10,000 words in under 30ms', () => {
      const sampleParagraph = 'Enterprise scalable rich text editor engine with real-time reactive collaboration and ProseMirror schema. ';
      const largeText = sampleParagraph.repeat(800); // ~10,400 words

      const start = performance.now();
      const words = countWords(largeText);
      const chars = countCharacters(largeText, false);
      const charsNoSpaces = countCharacters(largeText, true);
      const paragraphs = countParagraphs(largeText);
      const reading = calculateReadingTime(words);
      const duration = performance.now() - start;

      expect(words).toBeGreaterThan(10000);
      expect(chars).toBeGreaterThan(50000);
      expect(charsNoSpaces).toBeGreaterThan(40000);
      expect(paragraphs).toBeGreaterThan(0);
      expect(reading.minutes).toBeGreaterThan(40);
      expect(duration).toBeLessThan(30); // Sub-30ms performance on 10,000+ words
    });
  });

  describe('6. Laravel Backend Performance Configuration', () => {
    it('verifies laravel/config/editor.php defines Phase 28 performance caching options', () => {
      expect(fs.existsSync(laravelConfigPath)).toBe(true);

      const content = fs.readFileSync(laravelConfigPath, 'utf-8');
      expect(content).toContain("'performance' => [");
      expect(content).toContain("'cache_sanitized_output'");
      expect(content).toContain("'cache_ttl_seconds'");
      expect(content).toContain("'cdn_url'");
      expect(content).toContain("'etag_enabled'");
      expect(content).toContain("'gzip_compression'");
      expect(content).toContain("'max_payload_kb'");
    });
  });
});
