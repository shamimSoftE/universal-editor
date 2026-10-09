import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 27: Demo Website & Multi-Page Showcase Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const demoDir = path.join(rootDir, 'demo');
  const vueDemoPath = path.join(demoDir, 'src', 'VueDemo.vue');
  const demoIndexPath = path.join(demoDir, 'index.html');
  const demoDistDir = path.join(demoDir, 'dist');
  const styleCssPath = path.join(demoDir, 'src', 'style.css');

  describe('1. Demo Structure & Asset Existence', () => {
    it('contains all essential Phase 27 demo files', () => {
      expect(fs.existsSync(vueDemoPath)).toBe(true);
      expect(fs.existsSync(demoIndexPath)).toBe(true);
      expect(fs.existsSync(styleCssPath)).toBe(true);
      expect(fs.existsSync(demoDistDir)).toBe(true);
      expect(fs.existsSync(path.join(demoDistDir, 'index.html'))).toBe(true);
    });

    it('validates demo/index.html header and metadata for Phase 27', () => {
      const indexHtml = fs.readFileSync(demoIndexPath, 'utf-8');
      expect(indexHtml).toContain('Phase 27: Enterprise Documentation');
      expect(indexHtml).toContain('10 Dedicated Pages');
      expect(indexHtml).toContain('11 Interactive Showcases');
      expect(indexHtml).toContain('vue-app');
    });

    it('validates demo/src/style.css contains Phase 27 layout and inspector classes', () => {
      const css = fs.readFileSync(styleCssPath, 'utf-8');
      expect(css).toContain('.site-nav-container');
      expect(css).toContain('.site-nav-btn');
      expect(css).toContain('.demo-preset-bar');
      expect(css).toContain('.demo-preset-pill');
      expect(css).toContain('.realtime-inspector');
      expect(css).toContain('.inspector-output-box');
      expect(css).toContain('.features-grid');
      expect(css).toContain('.docs-view-container');
    });
  });

  describe('2. Ten Dedicated Site Pages (Page 34 Spec)', () => {
    const expectedPages = [
      { id: 'home', title: 'Home' },
      { id: 'demo', title: 'Editor Demo' },
      { id: 'features', title: 'Features' },
      { id: 'examples', title: 'Examples' },
      { id: 'docs', title: 'Documentation' },
      { id: 'api', title: 'API' },
      { id: 'extensions', title: 'Extensions' },
      { id: 'laravel', title: 'Laravel' },
      { id: 'vue', title: 'Vue' },
      { id: 'changelog', title: 'Changelog' },
    ];

    it('defines exactly 10 site pages with corresponding navigation tabs', () => {
      const vueFile = fs.readFileSync(vueDemoPath, 'utf-8');
      for (const page of expectedPages) {
        expect(vueFile).toContain(`id: '${page.id}', title: '${page.title}'`);
        expect(vueFile).toContain(`id="'nav-' + page.id"`);
      }
    });

    it('contains page views and section containers for all 10 pages', () => {
      const vueFile = fs.readFileSync(vueDemoPath, 'utf-8');
      expect(vueFile).toContain("v-if=\"activePage === 'home'\"");
      expect(vueFile).toContain("v-show=\"activePage === 'demo'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'features'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'examples'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'docs'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'api'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'extensions'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'laravel'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'vue'\"");
      expect(vueFile).toContain("v-if=\"activePage === 'changelog'\"");
    });
  });

  describe('3. Eleven Interactive Demo Presets (Page 34 Spec)', () => {
    const expectedPresets = [
      { key: 'basic', title: 'Basic Editor' },
      { key: 'advanced', title: 'Advanced Editor' },
      { key: 'image', title: 'Image Editor' },
      { key: 'table', title: 'Table Editor' },
      { key: 'code', title: 'Code Editor' },
      { key: 'slash', title: 'Slash Commands' },
      { key: 'mention', title: 'Mention' },
      { key: 'autosave', title: 'Autosave' },
      { key: 'dark', title: 'Dark Mode' },
      { key: 'viewer', title: 'Read-only Viewer' },
      { key: 'ai', title: 'AI Demo' },
    ];

    it('defines all 11 interactive presets with distinct content and metadata', () => {
      const vueFile = fs.readFileSync(vueDemoPath, 'utf-8');
      for (const preset of expectedPresets) {
        expect(vueFile).toContain(`${preset.key}: {`);
        expect(vueFile).toContain(`title: '${preset.title}'`);
      }
    });

    it('implements interactive preset switching function', () => {
      const vueFile = fs.readFileSync(vueDemoPath, 'utf-8');
      expect(vueFile).toContain('function selectDemoPreset(presetKey: DemoPresetKey)');
      expect(vueFile).toContain('activeDemoPreset.value = presetKey');
      expect(vueFile).toContain('content.value = demoPresets[presetKey].content');
      expect(vueFile).toContain(':id="\'preset-\' + key"');
    });
  });

  describe('4. Real-Time Output Inspection Beside Editor (Page 34 Spec)', () => {
    it('implements synchronized side-by-side layout with editor and inspector', () => {
      const vueFile = fs.readFileSync(vueDemoPath, 'utf-8');
      expect(vueFile).toContain('class="editor-grid"');
      expect(vueFile).toContain('class="card realtime-inspector"');
      expect(vueFile).toContain('OUTPUT HTML');
      expect(vueFile).toContain('OUTPUT JSON');
      expect(vueFile).toContain('LIVE VIEWER');
      expect(vueFile).toContain('STATISTICS');
    });

    it('computes sanitized HTML and ProseMirror AST JSON for inspection', () => {
      const vueFile = fs.readFileSync(vueDemoPath, 'utf-8');
      expect(vueFile).toContain('liveFormattedHtml = computed(');
      expect(vueFile).toContain('liveFormattedJson = computed(');
      expect(vueFile).toContain('copyInspectorContent');
      expect(vueFile).toContain('docStats = computed(');
    });

    it('provides copy actions for both generated HTML and ProseMirror JSON', () => {
      const vueFile = fs.readFileSync(vueDemoPath, 'utf-8');
      expect(vueFile).toContain("@click=\"copyInspectorContent('html')\"");
      expect(vueFile).toContain("@click=\"copyInspectorContent('json')\"");
    });
  });

  describe('5. Production Build Verification', () => {
    it('confirms demo/dist contains built index.html and compiled JS/CSS bundles', () => {
      const files = fs.readdirSync(demoDistDir);
      expect(files).toContain('index.html');
      expect(files).toContain('assets');

      const assets = fs.readdirSync(path.join(demoDistDir, 'assets'));
      const jsBundle = assets.find((f) => f.endsWith('.js'));
      const cssBundle = assets.find((f) => f.endsWith('.css'));

      expect(jsBundle).toBeDefined();
      expect(cssBundle).toBeDefined();
      expect(fs.statSync(path.join(demoDistDir, 'assets', jsBundle!)).size).toBeGreaterThan(100000);
      expect(fs.statSync(path.join(demoDistDir, 'assets', cssBundle!)).size).toBeGreaterThan(10000);
    });
  });
});
