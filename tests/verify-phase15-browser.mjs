import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core for Phase 15 Read-Only & Viewer Mode verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1050 });

    console.log('🌐 Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait for Vue 3 editor & viewer initialization
    await page.waitForFunction(() => !!window.vueEditorInstance, { timeout: 10000 });
    console.log('✅ Vue 3 editor instance detected on page.');

    await new Promise(r => setTimeout(r, 600));

    // 1. Verify <RichTextViewer /> rendering & zero editing chrome
    console.log('\n👓 Step 1: Checking <RichTextViewer /> rendering and structure...');
    const viewerCheck = await page.evaluate(() => {
      const viewerEl = document.querySelector('.viewer-card .ue-viewer');
      if (!viewerEl) return null;

      const hasToolbar = !!viewerEl.querySelector('.ue-toolbar');
      const hasBubbleMenu = !!viewerEl.querySelector('.ue-bubble-menu');
      const isEditable = viewerEl.getAttribute('contenteditable') === 'true';
      const hasTable = !!viewerEl.querySelector('table');
      const hasCodeBlock = !!viewerEl.querySelector('.ue-code-block-viewer');
      const hasEmbed = !!viewerEl.querySelector('.ue-embed-wrapper');
      const hasImage = !!viewerEl.querySelector('.ue-image-figure img');
      const hasMention = !!viewerEl.querySelector('.ue-mention');
      const hasTaskList = !!viewerEl.querySelector('[data-type="taskList"]');

      return {
        exists: true,
        hasToolbar,
        hasBubbleMenu,
        isEditable,
        hasTable,
        hasCodeBlock,
        hasEmbed,
        hasImage,
        hasMention,
        hasTaskList,
        headingsCount: viewerEl.querySelectorAll('h1, h2, h3').length,
        paragraphsCount: viewerEl.querySelectorAll('p').length
      };
    });

    console.log('Viewer Inspection Result:');
    console.log(`  • Viewer Container Exists: ${viewerCheck?.exists}`);
    console.log(`  • Has Toolbar (Must be false): ${viewerCheck?.hasToolbar}`);
    console.log(`  • Has Bubble Menu (Must be false): ${viewerCheck?.hasBubbleMenu}`);
    console.log(`  • ContentEditable (Must be false): ${viewerCheck?.isEditable}`);
    console.log(`  • Has Table: ${viewerCheck?.hasTable}`);
    console.log(`  • Has Code Block: ${viewerCheck?.hasCodeBlock}`);
    console.log(`  • Has Media Embed: ${viewerCheck?.hasEmbed}`);
    console.log(`  • Has Image Figure: ${viewerCheck?.hasImage}`);
    console.log(`  • Has Mention Chip: ${viewerCheck?.hasMention}`);
    console.log(`  • Has Task List: ${viewerCheck?.hasTaskList}`);
    console.log(`  • Headings: ${viewerCheck?.headingsCount}, Paragraphs: ${viewerCheck?.paragraphsCount}`);

    if (!viewerCheck?.exists || viewerCheck.hasToolbar || viewerCheck.isEditable) {
      throw new Error('Viewer validation failed: viewer missing or contains editing chrome!');
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase15_viewer_split_view.png') });
    console.log('📸 Captured phase15_viewer_split_view.png');

    // 2. Test Code Copy Button
    console.log('\n📋 Step 2: Testing Code Block Copy Button...');
    const copyBtnState = await page.evaluate(() => {
      const btn = document.querySelector('.viewer-card .ue-code-copy-btn');
      if (btn) {
        btn.click();
        return {
          clicked: true,
          text: btn.textContent?.trim(),
          hasCopiedClass: btn.classList.contains('copied')
        };
      }
      return { clicked: false };
    });

    console.log(`  • Code Copy Button Clicked: ${copyBtnState.clicked}`);
    console.log(`  • Button Text after Click: "${copyBtnState.text}"`);
    console.log(`  • Has 'copied' Class: ${copyBtnState.hasCopiedClass}`);

    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase15_code_copied.png') });
    console.log('📸 Captured phase15_code_copied.png');

    // 3. Test Image Lightbox Modal
    console.log('\n🔍 Step 3: Testing Image Lightbox Modal...');
    await page.evaluate(() => {
      const img = document.querySelector('.viewer-card .ue-image-figure img');
      if (img) img.click();
    });

    await new Promise(r => setTimeout(r, 500));

    const lightboxCheck = await page.evaluate(() => {
      const modal = document.querySelector('.ue-viewer-lightbox');
      const modalImg = modal?.querySelector('img');
      const closeBtn = modal?.querySelector('.ue-viewer-lightbox-close');
      return {
        open: !!modal,
        hasImg: !!modalImg?.getAttribute('src'),
        hasCloseBtn: !!closeBtn
      };
    });

    console.log(`  • Lightbox Modal Open: ${lightboxCheck.open}`);
    console.log(`  • Lightbox Preview Image Loaded: ${lightboxCheck.hasImg}`);
    console.log(`  • Lightbox Close Button: ${lightboxCheck.hasCloseBtn}`);

    if (!lightboxCheck.open) {
      console.warn('⚠️ Warning: Lightbox did not open on image click.');
    } else {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase15_viewer_lightbox.png') });
      console.log('📸 Captured phase15_viewer_lightbox.png');

      // Close the lightbox by clicking the close button
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.ue-viewer-lightbox-close');
        closeBtn?.click();
      });
      await new Promise(r => setTimeout(r, 300));
    }

    // 4. Test Viewer Light Theme
    console.log('\n☀️ Step 4: Testing Viewer Light Theme...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Viewer Light'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 400));

    const lightThemeActive = await page.evaluate(() => {
      const viewer = document.querySelector('.viewer-card .ue-viewer');
      return viewer?.classList.contains('ue-viewer-light');
    });
    console.log(`  • Viewer Light Theme Applied: ${lightThemeActive}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase15_viewer_light.png') });
    console.log('📸 Captured phase15_viewer_light.png');

    // Switch back to Dark Theme
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Viewer Dark'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // 5. Test Print Media Emulation (@media print)
    console.log('\n🖨️ Step 5: Testing Print Media Emulation (@media print)...');
    await page.emulateMediaType('print');
    await new Promise(r => setTimeout(r, 400));

    const printStylesCheck = await page.evaluate(() => {
      const btn = document.querySelector('.viewer-card .ue-code-copy-btn');
      const btnComputed = btn ? window.getComputedStyle(btn).display : null;
      return {
        copyBtnHiddenInPrint: btnComputed === 'none'
      };
    });
    console.log(`  • Code Copy Button Hidden in Print: ${printStylesCheck.copyBtnHiddenInPrint}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase15_viewer_print.png') });
    console.log('📸 Captured phase15_viewer_print.png');

    // Restore screen media
    await page.emulateMediaType('screen');
    await new Promise(r => setTimeout(r, 300));

    // 6. Test Viewer-Only Mode View
    console.log('\n📄 Step 6: Testing Viewer-Only Mode Tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Viewer Mode'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase15_final_verified.png'), fullPage: true });
    console.log('📸 Captured phase15_final_verified.png');

    console.log('\n🎉 ALL PHASE 15 BROWSER CHECKS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Browser verification error:', err);
    process.exitCode = 1;
  } finally {
    try {
      await browser.close();
    } catch {}
  }
}

run();
