import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createEditor,
  ContentSanitizer,
  DefaultUploader,
  VersionHistoryManager,
  generateCSSVariables,
  tokenToCssVariable,
  Announcer,
  FocusTrap,
  ToolbarKeyboardNav,
  MobileManager,
} from '@universal-editor/core';
import { RichTextEditor } from '@universal-editor/vue3';

describe('Phase 25: Documentation Verification Suite', () => {
  const docsPath = path.resolve(__dirname, '../docs/README.md');
  const apiRefPath = path.resolve(__dirname, '../docs/api-reference.md');

  it('Verifies docs/README.md exists and contains sufficient content', () => {
    expect(fs.existsSync(docsPath)).toBe(true);
    const content = fs.readFileSync(docsPath, 'utf-8');
    expect(content.length).toBeGreaterThan(5000);
  });

  it('Verifies all 27 required documentation sections are present in docs/README.md', () => {
    const content = fs.readFileSync(docsPath, 'utf-8');

    const requiredSections = [
      '1. Introduction',
      '2. Installation',
      '3. Vue 3 Installation',
      '4. Vue 2 Installation',
      '5. Vanilla JS Installation',
      '6. Laravel Installation',
      '7. Basic Usage',
      '8. Configuration',
      '9. Toolbar Customization',
      '10. Image Upload',
      '11. File Upload',
      '12. Tables',
      '13. Code Blocks',
      '14. Embeds',
      '15. Slash Commands',
      '16. Mentions',
      '17. Autosave',
      '18. Sanitization',
      '19. Custom Extensions',
      '20. Custom Upload Provider',
      '21. Custom AI Provider',
      '22. Events',
      '23. Theming',
      '24. Security',
      '25. API Reference',
      '26. Troubleshooting',
      '27. Migration Guide',
    ];

    for (const section of requiredSections) {
      // Check for section header match (case-insensitive substring)
      const cleanSectionName = section.toLowerCase();
      expect(content.toLowerCase()).toContain(cleanSectionName);
    }
  });

  it('Verifies code snippets for all four environments (Vue 3, Vue 2, Vanilla JS, Laravel)', () => {
    const content = fs.readFileSync(docsPath, 'utf-8');

    // Code blocks presence
    expect(content).toContain('```typescript');
    expect(content).toContain('```vue');
    expect(content).toContain('```html');
    expect(content).toContain('```php');
    expect(content).toContain('```bash');

    // Key symbols in snippets
    expect(content).toContain('createEditor');
    expect(content).toContain('RichTextEditor');
    expect(content).toContain('v-model');
    expect(content).toContain('getHTML()');
    expect(content).toContain('getJSON()');
    expect(content).toContain('ContentSanitizer');
    expect(content).toContain('EditorServiceProvider');
  });

  it('Verifies docs/api-reference.md exists with all core methods documented', () => {
    expect(fs.existsSync(apiRefPath)).toBe(true);
    const apiContent = fs.readFileSync(apiRefPath, 'utf-8');

    const expectedMethods = [
      'getHTML()',
      'getJSON()',
      'getText()',
      'getSanitizedHTML()',
      'setContent',
      'clearContent',
      'focus',
      'blur',
      'undo',
      'redo',
      'canUndo',
      'canRedo',
      'destroy',
      'on',
      'off',
    ];

    for (const method of expectedMethods) {
      expect(apiContent).toContain(method);
    }
  });

  it('Verifies documented symbols resolve directly to real package exports', () => {
    expect(typeof createEditor).toBe('function');
    expect(typeof ContentSanitizer).toBe('function');
    expect(typeof DefaultUploader).toBe('function');
    expect(typeof VersionHistoryManager).toBe('function');
    expect(typeof generateCSSVariables).toBe('function');
    expect(typeof tokenToCssVariable).toBe('function');
    expect(typeof Announcer).toBe('function');
    expect(typeof FocusTrap).toBe('function');
    expect(typeof ToolbarKeyboardNav).toBe('function');
    expect(typeof MobileManager).toBe('function');
    expect(RichTextEditor).toBeDefined();
  });
});
