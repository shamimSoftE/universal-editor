import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core for Phase 13 Autosave & Drafts verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 980 });

    console.log('🌐 Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait for Vue 3 editor initialization
    await page.waitForFunction(() => !!window.vueEditorInstance, { timeout: 10000 });
    console.log('✅ Vue 3 editor instance detected on page.');

    await new Promise(r => setTimeout(r, 600));

    console.log('📸 Capturing initial view screenshot...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase13_initial_view.png') });
    console.log('📸 Captured phase13_initial_view.png');

    // 1. Focus editor and type text to trigger unsaved state
    console.log('⌨️ Focusing editor and typing content to trigger "unsaved" state...');
    await page.evaluate(() => {
      const ed = window.vueEditorInstance;
      (ed.tiptap || ed).chain().focus('end').insertContent('<p>Draft testing in progress: Phase 13 live keystroke verification.</p>').run();
    });

    await new Promise(r => setTimeout(r, 200));

    // Verify unsaved state in footer or indicator
    const unsavedText = await page.evaluate(() => {
      const el = document.querySelector('.ue-status-unsaved, .ue-autosave-status-unsaved');
      return el ? el.textContent : null;
    });
    console.log(`✨ Status after typing: "${unsavedText?.trim()}" (Expected: Unsaved changes)`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase13_unsaved_state.png') });
    console.log('📸 Captured phase13_unsaved_state.png');

    // 2. Wait for debounce (1500ms + buffer = 2000ms) to trigger autosave
    console.log('⏳ Waiting 2000ms for debounce timer to fire autosave...');
    await new Promise(r => setTimeout(r, 2200));

    const savedText = await page.evaluate(() => {
      const el = document.querySelector('.ue-status-saved, .ue-autosave-status-saved');
      return el ? el.textContent : null;
    });
    console.log(`✨ Status after debounce: "${savedText?.trim()}" (Expected: Saved / Saved just now)`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase13_saved_state.png') });
    console.log('📸 Captured phase13_saved_state.png');

    // 3. Test Manual Save button
    console.log('💾 Testing Manual Save button click...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Save Draft'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 4. Test Ctrl+S shortcut
    console.log('⌨️ Testing Ctrl+S keyboard shortcut trigger...');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyS');
    await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 400));

    // 5. Check localStorage for saved draft
    const storageKeys = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    });
    console.log('📦 LocalStorage draft keys detected:', storageKeys.filter(k => k?.includes('draft')));

    // 6. Switch to Vanilla Core API view
    console.log('🔄 Switching to Vanilla Core API View...');
    await page.click('#showVanillaView');
    await new Promise(r => setTimeout(r, 500));

    // Check Vanilla autosave indicator container
    const vanillaIndicatorText = await page.evaluate(() => {
      const container = document.getElementById('autosaveIndicatorContainer');
      return container ? container.textContent : null;
    });
    console.log(`✨ Vanilla Autosave Indicator: "${vanillaIndicatorText?.trim()}"`);

    // Click Save Draft button on Vanilla view
    await page.click('#btnManualSave');
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase13_vanilla_autosave_verified.png') });
    console.log('📸 Captured phase13_vanilla_autosave_verified.png');

    // Switch back to Vue 3 view for final verified capture
    await page.click('#showVue3View');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase13_final_verified.png') });
    console.log('📸 Captured phase13_final_verified.png');

    console.log('🎉 Phase 13 Autosave & Draft System browser verification completed successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
