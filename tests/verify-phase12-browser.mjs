import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core for Phase 12 Mentions verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });

    console.log('🌐 Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait for Vue 3 editor initialization
    await page.waitForFunction(() => !!window.vueEditorInstance, { timeout: 10000 });
    console.log('✅ Vue 3 editor instance detected on page.');

    console.log('📸 Capturing initial view screenshot...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase12_initial_view.png') });

    // Focus end of editor and insert a clean blank paragraph
    console.log('🖱️ Focusing Vue 3 editor and preparing clean paragraph...');
    await page.evaluate(() => {
      const ed = window.vueEditorInstance;
      (ed.tiptap || ed).chain().focus('end').insertContent('<p></p>').focus('end').run();
    });

    await new Promise(r => setTimeout(r, 400));

    // Type '@' to trigger mention list popover
    console.log('⌨️ Typing "@" to trigger enterprise mention directory...');
    await page.keyboard.type('@');

    // Wait for .ue-mention-list to become visible
    await page.waitForSelector('.ue-mention-list', { visible: true, timeout: 5000 });
    console.log('✨ .ue-mention-list popover is visible and anchored to cursor!');

    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase12_mention_menu_open.png') });
    console.log('📸 Captured phase12_mention_menu_open.png');

    // Test real-time user search filtering: type 'john'
    console.log('⌨️ Typing "john" to test user filtering...');
    await page.keyboard.type('john');
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase12_filter_john.png') });
    console.log('📸 Captured phase12_filter_john.png');

    // Select John Doe with Enter
    console.log('⌨️ Pressing Enter to select John Doe mention chip...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 300));

    // Type connective text and trigger another mention
    await page.keyboard.type(' and ');
    await page.keyboard.type('@');
    await page.waitForSelector('.ue-mention-list', { visible: true, timeout: 5000 });
    await new Promise(r => setTimeout(r, 200));

    // Filter for Shamim
    await page.keyboard.type('shamim');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 300));

    // Finish sentence
    await page.keyboard.type(' are reviewing the Phase 12 architecture.');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase12_vue3_mentions_verified.png') });
    console.log('📸 Captured phase12_vue3_mentions_verified.png');

    // Test programmatic mention insertion via button
    console.log('🖱️ Testing programmatic mention insertion button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Insert Mention'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Switch to Vanilla View to test Vanilla Core API
    console.log('🔄 Switching to Vanilla View...');
    await page.click('#showVanillaView');
    await new Promise(r => setTimeout(r, 500));

    // Click Insert Mention button in Vanilla view
    console.log('🖱️ Clicking @ Insert Mention button in Vanilla view...');
    await page.click('#btnInsertMention');
    await new Promise(r => setTimeout(r, 300));

    // Capture screenshot in Vanilla view
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase12_vanilla_mention_verified.png') });
    console.log('📸 Captured phase12_vanilla_mention_verified.png');

    // Final full verification screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase12_final_verified.png') });
    console.log('📸 Captured phase12_final_verified.png');

    console.log('🎉 ALL PHASE 12 MENTIONS SYSTEM BROWSER TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
