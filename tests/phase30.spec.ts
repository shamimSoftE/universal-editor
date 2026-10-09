import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import { runReleaseVerification } from '../scripts/verify-release.mjs';
import {
  createEditor,
  ContentSanitizer,
  EventEmitter,
  countWords,
  countCharacters,
  calculateReadingTime,
  LazyExtensionRegistry,
} from '@universal-editor/core';
import { RichTextEditor, RichTextViewer } from '@universal-editor/vue3';

describe('Phase 30: Final Production Release & Enterprise Launch', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('1. Production Release Health & Integrity Audit', () => {
    it('executes full release verification suite and passes 100% of checks', () => {
      const { allPassed, checks } = runReleaseVerification();

      expect(allPassed).toBe(true);
      expect(checks.length).toBeGreaterThanOrEqual(50);

      const failedChecks = checks.filter((c: any) => !c.passed);
      expect(failedChecks).toEqual([]);
    });
  });

  describe('2. Semantic Versioning Harmonization (v1.0.0)', () => {
    const packages = ['core', 'vue3', 'vue2', 'extensions', 'utils'];

    it('verifies root package.json is versioned at 1.0.0', () => {
      const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
      expect(rootPkg.version).toBe('1.0.0');
    });

    for (const pkgName of packages) {
      it(`verifies @universal-editor/${pkgName} package.json is versioned at 1.0.0`, () => {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(rootDir, 'packages', pkgName, 'package.json'), 'utf-8')
        );
        expect(pkgJson.version).toBe('1.0.0');
        expect(pkgJson.license).toBe('MIT');
      });
    }

    it('verifies laravel/composer.json is versioned at 1.0.0', () => {
      const compJson = JSON.parse(
        fs.readFileSync(path.join(rootDir, 'laravel', 'composer.json'), 'utf-8')
      );
      expect(compJson.version).toBe('1.0.0');
      expect(compJson.name).toBe('vendor/laravel-universal-editor');
      expect(compJson.license).toBe('MIT');
    });
  });

  describe('3. Core & Adapter Exports Resolution', () => {
    it('resolves core engine exports correctly', () => {
      expect(typeof createEditor).toBe('function');
      expect(typeof ContentSanitizer).toBe('function');
      expect(typeof ContentSanitizer.sanitize).toBe('function');
      expect(typeof ContentSanitizer.generateCSPDirectives).toBe('function');
      expect(typeof ContentSanitizer.validateCSPHeader).toBe('function');
      expect(typeof EventEmitter).toBe('function');
      expect(typeof countWords).toBe('function');
      expect(typeof countCharacters).toBe('function');
      expect(typeof calculateReadingTime).toBe('function');
      expect(typeof LazyExtensionRegistry.load).toBe('function');
    });

    it('resolves Vue 3 component adapter exports correctly', () => {
      expect(RichTextEditor).toBeDefined();
      expect(RichTextViewer).toBeDefined();
      expect((RichTextEditor as any).__name || RichTextEditor.name).toBe('RichTextEditor');
      expect((RichTextViewer as any).__name || RichTextViewer.name).toBe('RichTextViewer');
    });
  });

  describe('4. TypeScript Declaration Coverage', () => {
    const packages = ['core', 'vue3', 'vue2', 'extensions', 'utils'];

    for (const pkg of packages) {
      it(`verifies @universal-editor/${pkg} has populated dist/index.d.ts`, () => {
        const dtsPath = path.join(rootDir, 'packages', pkg, 'dist', 'index.d.ts');
        expect(fs.existsSync(dtsPath)).toBe(true);
        const content = fs.readFileSync(dtsPath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      });
    }
  });

  describe('5. Milestone Completion Verification (Phases 1 to 30)', () => {
    it('verifies that all 30 phases are marked as completed in README.md', () => {
      const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf-8');

      for (let i = 1; i <= 30; i++) {
        const phaseRegex = new RegExp(`- \\[x\\] \\*\\*Phase ${i}:`, 'i');
        expect(
          phaseRegex.test(readme),
          `Expected Phase ${i} to be marked as completed in README.md`
        ).toBe(true);
      }

      const unchecked = (readme.match(/- \[ \] \*\*Phase \d+:/g) || []).length;
      expect(unchecked).toBe(0);
    });
  });

  describe('6. Documentation & Release Notes Integrity', () => {
    it('verifies CHANGELOG.md contains entries for all 30 phases', () => {
      const changelog = fs.readFileSync(path.join(rootDir, 'CHANGELOG.md'), 'utf-8');
      expect(changelog).toContain('[1.0.0]');

      for (let i = 1; i <= 30; i++) {
        expect(changelog).toContain(`Phase ${i}:`);
      }
    });

    it('verifies RELEASE_NOTES_v1.0.0.md contains comprehensive integration guides', () => {
      const notes = fs.readFileSync(path.join(rootDir, 'RELEASE_NOTES_v1.0.0.md'), 'utf-8');
      expect(notes).toContain('v1.0.0 Production Release Notes');
      expect(notes).toContain('Vue 3');
      expect(notes).toContain('Vanilla JavaScript');
      expect(notes).toContain('Laravel Backend');
      expect(notes).toContain('OWASP Top 10');
    });

    it('verifies root LICENSE is an MIT license', () => {
      const license = fs.readFileSync(path.join(rootDir, 'LICENSE'), 'utf-8');
      expect(license).toContain('MIT License');
      expect(license).toContain('Permission is hereby granted');
    });
  });
});
