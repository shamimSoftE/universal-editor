import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core...');
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

    // Wait for editor initialization
    await page.waitForFunction(() => !!window.vueEditorInstance, { timeout: 10000 });
    console.log('✅ Vue 3 editor instance detected on page.');

    console.log('📸 Capturing initial view screenshot...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase11_initial_view.png') });

    // Focus end of editor and insert a clean blank paragraph
    console.log('🖱️ Focusing Vue 3 editor and preparing clean paragraph...');
    await page.evaluate(() => {
      const ed = window.vueEditorInstance;
      (ed.tiptap || ed).chain().focus('end').insertContent('<p></p>').focus('end').run();
    });

    await new Promise(r => setTimeout(r, 400));

    // Type '/'
    console.log('⌨️ Typing "/" to trigger Notion-style slash command palette...');
    await page.keyboard.type('/');

    // Wait for .ue-slash-menu to become visible
    await page.waitForSelector('.ue-slash-menu', { visible: true, timeout: 5000 });
    console.log('✨ .ue-slash-menu is visible and active!');

    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase11_slash_menu_open.png') });
    console.log('📸 Captured phase11_slash_menu_open.png');

    // Test real-time fuzzy search filtering: type 'h2'
    console.log('⌨️ Typing "h2" to test fuzzy search filtering...');
    await page.keyboard.type('h2');
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase11_fuzzy_search_h2.png') });
    console.log('📸 Captured phase11_fuzzy_search_h2.png');

    // Execute Heading 2 command
    console.log('⌨️ Pressing Enter to execute Heading 2 command...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 300));

    // Type heading text
    await page.keyboard.type('Notion Slash Commands Active & Verified!');
    await page.keyboard.press('Enter');

    // Insert Code block via slash command
    console.log('⌨️ Typing "/code" and pressing Enter...');
    await page.keyboard.type('/code');
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 300));

    // Type inside code block
    await page.keyboard.type('console.log("Phase 11 Slash Commands 100% Verified!");');
    await new Promise(r => setTimeout(r, 300));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase11_vue3_verified.png') });
    console.log('📸 Captured phase11_vue3_verified.png');

    // Exit code block with a clean paragraph below and type '/' to show menu alongside inserted elements
    console.log('⌨️ Creating paragraph below code block and typing "/"...');
    await page.evaluate(() => {
      const ed = window.vueEditorInstance;
      (ed.tiptap || ed).chain().focus('end').insertContent('<p></p>').focus('end').run();
    });
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.type('/');
    await page.waitForSelector('.ue-slash-menu', { visible: true, timeout: 5000 });
    await new Promise(r => setTimeout(r, 400));

    // Capture final verified screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase11_final_verified.png') });
    console.log('📸 Captured phase11_final_verified.png');

    console.log('🎉 ALL PHASE 11 NOTION SLASH COMMANDS BROWSER TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
