import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 26: NPM & Composer Production Packages Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const packagesDir = path.join(rootDir, 'packages');
  const laravelDir = path.join(rootDir, 'laravel');

  describe('1. NPM Package Manifest Configurations', () => {
    const expectedPackages = [
      {
        dir: 'core',
        name: '@universal-editor/core',
        main: './dist/universal-editor.umd.js',
        module: './dist/universal-editor.es.js',
        types: './dist/index.d.ts',
        hasCssExport: true,
      },
      {
        dir: 'vue3',
        name: '@universal-editor/vue3',
        main: './dist/index.cjs',
        module: './dist/index.js',
        types: './dist/index.d.ts',
        hasCssExport: true,
      },
      {
        dir: 'vue2',
        name: '@universal-editor/vue2',
        main: './dist/index.cjs',
        module: './dist/index.js',
        types: './dist/index.d.ts',
        hasCssExport: false,
      },
      {
        dir: 'extensions',
        name: '@universal-editor/extensions',
        main: './dist/index.cjs',
        module: './dist/index.js',
        types: './dist/index.d.ts',
        hasCssExport: false,
      },
      {
        dir: 'utils',
        name: '@universal-editor/utils',
        main: './dist/index.cjs',
        module: './dist/index.js',
        types: './dist/index.d.ts',
        hasCssExport: false,
      },
    ];

    for (const pkg of expectedPackages) {
      it(`validates ${pkg.name} package.json structure, semver, and conditional exports`, () => {
        const pkgJsonPath = path.join(packagesDir, pkg.dir, 'package.json');
        expect(fs.existsSync(pkgJsonPath)).toBe(true);

        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        expect(pkgJson.name).toBe(pkg.name);
        expect(pkgJson.version).toBe('1.0.0');
        expect(pkgJson.type).toBe('module');
        expect(pkgJson.license).toBe('MIT');
        expect(pkgJson.main).toBe(pkg.main);
        expect(pkgJson.module).toBe(pkg.module);
        expect(pkgJson.types).toBe(pkg.types);

        // Exports field validation
        expect(pkgJson.exports).toBeDefined();
        expect(pkgJson.exports['.']).toBeDefined();
        expect(pkgJson.exports['.'].types).toBeDefined();
        expect(pkgJson.exports['.'].import).toBeDefined();
        expect(pkgJson.exports['.'].require).toBeDefined();

        if (pkg.hasCssExport) {
          const hasCssKey = Object.keys(pkgJson.exports).some((k) => k.includes('css') || k.includes('style'));
          expect(hasCssKey).toBe(true);
        }

        // Files array whitelist
        expect(Array.isArray(pkgJson.files)).toBe(true);
        expect(pkgJson.files).toContain('dist');
      });
    }
  });

  describe('2. Composer Package Manifest Configuration (laravel-universal-editor)', () => {
    it('validates laravel/composer.json structure, PSR-4 autoloading, and service provider discovery', () => {
      const composerJsonPath = path.join(laravelDir, 'composer.json');
      expect(fs.existsSync(composerJsonPath)).toBe(true);

      const composer = JSON.parse(fs.readFileSync(composerJsonPath, 'utf-8'));
      expect(composer.name).toBe('vendor/laravel-universal-editor');
      expect(composer.version).toBe('1.0.0');
      expect(composer.type).toBe('library');
      expect(composer.license).toBe('MIT');

      // PHP version and requirements
      expect(composer.require).toBeDefined();
      expect(composer.require.php).toContain('8.1');

      // PSR-4 Autoload
      expect(composer.autoload).toBeDefined();
      expect(composer.autoload['psr-4']).toBeDefined();
      expect(composer.autoload['psr-4']['UniversalEditor\\Laravel\\']).toBe('src/');

      // Laravel Auto-discovery
      expect(composer.extra).toBeDefined();
      expect(composer.extra.laravel).toBeDefined();
      expect(composer.extra.laravel.providers).toContain('UniversalEditor\\Laravel\\EditorServiceProvider');
      expect(composer.extra.laravel.aliases.Editor).toBe('UniversalEditor\\Laravel\\Facades\\Editor');
    });
  });

  describe('3. Production Distribution Bundles & Sourcemaps', () => {
    it('verifies @universal-editor/core distribution outputs (ESM, UMD, Sourcemap, Types)', () => {
      const distDir = path.join(packagesDir, 'core', 'dist');
      expect(fs.existsSync(path.join(distDir, 'universal-editor.es.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'universal-editor.umd.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'universal-editor.es.js.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'universal-editor.umd.js.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.d.ts'))).toBe(true);
    });

    it('verifies @universal-editor/vue3 distribution outputs (ESM, CJS, CSS, Sourcemap, Types)', () => {
      const distDir = path.join(packagesDir, 'vue3', 'dist');
      expect(fs.existsSync(path.join(distDir, 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'style.css'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.js.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.d.ts'))).toBe(true);
    });

    it('verifies @universal-editor/vue2 distribution outputs (ESM, CJS, Sourcemap, Types)', () => {
      const distDir = path.join(packagesDir, 'vue2', 'dist');
      expect(fs.existsSync(path.join(distDir, 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.js.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.d.ts'))).toBe(true);
    });

    it('verifies @universal-editor/extensions distribution outputs (ESM, CJS, Sourcemap, Types)', () => {
      const distDir = path.join(packagesDir, 'extensions', 'dist');
      expect(fs.existsSync(path.join(distDir, 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.js.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.d.ts'))).toBe(true);
    });

    it('verifies @universal-editor/utils distribution outputs (ESM, CJS, Sourcemap, Types)', () => {
      const distDir = path.join(packagesDir, 'utils', 'dist');
      expect(fs.existsSync(path.join(distDir, 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.js.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs.map'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.d.ts'))).toBe(true);
    });
  });

  describe('4. Dynamic Import & Bundle Runtime Verification', () => {
    it('successfully dynamically imports the built ESM bundles and exercises exports', async () => {
      // Import built extensions
      const extBundle = await import('../packages/extensions/dist/index.js');
      expect(extBundle.ExtensionRegistry).toBeDefined();
      const registry = new extBundle.ExtensionRegistry();
      registry.register({ name: 'mock-ext' }, { priority: 200 });
      expect(registry.has('mock-ext')).toBe(true);

      // Import built utils
      const utilsBundle = await import('../packages/utils/dist/index.js');
      expect(utilsBundle.EventEmitter).toBeDefined();
      const emitter = new utilsBundle.EventEmitter();
      let triggered = false;
      emitter.on('test-event', () => {
        triggered = true;
      });
      emitter.emit('test-event');
      expect(triggered).toBe(true);

      // Import built vue2
      const vue2Bundle = await import('../packages/vue2/dist/index.js');
      expect(vue2Bundle.VUE2_ADAPTER_VERSION).toBe('1.0.0');
      expect(vue2Bundle.UniversalEditorVue2Plugin).toBeDefined();

      // Import built vue3
      const vue3Bundle = await import('../packages/vue3/dist/index.js');
      expect(vue3Bundle.RichTextEditor).toBeDefined();
      expect(vue3Bundle.RichTextViewer).toBeDefined();
      expect(vue3Bundle.default).toBeDefined();
    });
  });
});
