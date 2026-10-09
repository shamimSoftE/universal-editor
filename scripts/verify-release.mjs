import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function runReleaseVerification() {
  const checks = [];

  function addCheck(name, passed, message) {
    checks.push({ name, passed, message });
  }

  // 1. Root Manifest & Legal Files
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  addCheck('Root package.json version is 1.0.0', rootPkg.version === '1.0.0', `Found: ${rootPkg.version}`);
  addCheck('Root LICENSE file exists', fs.existsSync(path.join(rootDir, 'LICENSE')), 'MIT License verified');
  addCheck('CHANGELOG.md exists', fs.existsSync(path.join(rootDir, 'CHANGELOG.md')), 'Changelog verified');
  addCheck('RELEASE_NOTES_v1.0.0.md exists', fs.existsSync(path.join(rootDir, 'RELEASE_NOTES_v1.0.0.md')), 'Release notes verified');

  // 2. README Phase Checklist (All 30 phases completed)
  const readmeContent = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf-8');
  const uncheckedPhases = (readmeContent.match(/- \[ \] \*\*Phase \d+:/g) || []).length;
  addCheck('All 30 phases completed in README.md', uncheckedPhases === 0, `${uncheckedPhases} unchecked phases remaining`);

  // 3. Workspace Packages Verification
  const packages = [
    {
      dir: 'core',
      name: '@universal-editor/core',
      expectedFiles: ['dist/universal-editor.es.js', 'dist/universal-editor.umd.js', 'dist/index.d.ts', 'src/ui/styles.css'],
    },
    {
      dir: 'vue3',
      name: '@universal-editor/vue3',
      expectedFiles: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'dist/style.css'],
    },
    {
      dir: 'vue2',
      name: '@universal-editor/vue2',
      expectedFiles: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts'],
    },
    {
      dir: 'extensions',
      name: '@universal-editor/extensions',
      expectedFiles: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts'],
    },
    {
      dir: 'utils',
      name: '@universal-editor/utils',
      expectedFiles: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts'],
    },
  ];

  for (const pkg of packages) {
    const pkgDir = path.join(rootDir, 'packages', pkg.dir);
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    const pkgExists = fs.existsSync(pkgJsonPath);

    addCheck(`Package ${pkg.name} package.json exists`, pkgExists, pkgJsonPath);

    if (pkgExists) {
      const json = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      addCheck(`${pkg.name} has version 1.0.0`, json.version === '1.0.0', `Found: ${json.version}`);
      addCheck(`${pkg.name} has license MIT`, json.license === 'MIT', `Found: ${json.license}`);
      addCheck(`${pkg.name} has types declaration`, !!json.types, `Found: ${json.types}`);
      addCheck(`${pkg.name} has exports map`, !!json.exports, `Exports configured`);

      for (const relFile of pkg.expectedFiles) {
        const fullPath = path.join(pkgDir, relFile);
        const exists = fs.existsSync(fullPath);
        const size = exists ? fs.statSync(fullPath).size : 0;
        addCheck(`${pkg.name} artifact ${relFile} exists`, exists && size > 0, `Size: ${size} bytes`);
      }
    }
  }

  // 4. Laravel Package Verification
  const composerPath = path.join(rootDir, 'laravel', 'composer.json');
  const composerExists = fs.existsSync(composerPath);
  addCheck('Laravel composer.json exists', composerExists, composerPath);

  if (composerExists) {
    const compJson = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
    addCheck('Composer package name is vendor/laravel-universal-editor', compJson.name === 'vendor/laravel-universal-editor', compJson.name);
    addCheck('Composer package version is 1.0.0', compJson.version === '1.0.0', compJson.version);
    addCheck('Composer defines PSR-4 autoloading', !!compJson.autoload?.['psr-4']?.['UniversalEditor\\Laravel\\'], 'PSR-4 verified');
    addCheck('Composer registers EditorServiceProvider', compJson.extra?.laravel?.providers?.includes('UniversalEditor\\Laravel\\EditorServiceProvider'), 'Provider registered');
  }

  // 5. Demo Showcase Build Verification
  const demoIndexPath = path.join(rootDir, 'demo', 'dist', 'index.html');
  addCheck('Demo production bundle index.html exists', fs.existsSync(demoIndexPath), demoIndexPath);

  const allPassed = checks.every((c) => c.passed);
  return { allPassed, checks };
}

// Direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('verify-release.mjs')) {
  console.log('\n============================================================');
  console.log(' Universal Rich Text Editor — Phase 30 Production Release Audit');
  console.log('============================================================\n');

  const { allPassed, checks } = runReleaseVerification();

  for (const c of checks) {
    const symbol = c.passed ? '✓' : '✗';
    console.log(` ${symbol} ${c.name} (${c.message})`);
  }

  console.log('\n------------------------------------------------------------');
  console.log(` Total Checks: ${checks.length} | Passed: ${checks.filter((c) => c.passed).length} | Failed: ${checks.filter((c) => !c.passed).length}`);
  console.log('------------------------------------------------------------\n');

  process.exit(allPassed ? 0 : 1);
}
