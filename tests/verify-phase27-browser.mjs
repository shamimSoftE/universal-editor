import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser for Phase 27 Demo & Documentation Hub visual verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1480, height: 1100 });

    await page.evaluateOnNewDocument(() => {
      window.addEventListener('error', e => console.error('WINDOW SCRIPT ERROR:', e.message, e.filename, e.lineno, e.colno, e.error));
      window.addEventListener('unhandledrejection', e => console.error('UNHANDLED PROMISE REJECTION:', e.reason));
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('response', resp => {
      if (resp.status() >= 400) {
        console.log(`HTTP ${resp.status()} for ${resp.url()}`);
      }
    });

    console.log('🌐 Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    const debugInfo = await page.evaluate(() => {
      return {
        title: document.title,
        vueAppHtmlLength: document.getElementById('vue-app')?.innerHTML.length || 0,
        vueAppSnippet: document.getElementById('vue-app')?.innerHTML.slice(0, 300) || '',
        navButtonsCount: document.querySelectorAll('.site-nav-btn').length,
        bodySnippet: document.body.innerHTML.slice(0, 200),
      };
    });
    console.log('DEBUG DOM INFO:', debugInfo);

    // 1. Verify Site Navigation & 10 Pages
    console.log('\n⚡ Step 1: Testing 10-Page Site Navigation & Capturing Home Page...');
    const navButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.site-nav-btn'));
      return btns.map(b => b.textContent?.trim());
    });
    console.log(`Found ${navButtons.length} site navigation tabs:`, navButtons);

    // Click Home page
    await page.click('#nav-home');
    await new Promise(r => setTimeout(r, 600));
    const homeScreenshot = path.join(ARTIFACT_DIR, 'phase27_demo_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: false });
    console.log(`📸 Home Page screenshot saved: ${homeScreenshot}`);

    // 2. Editor Demo & Real-Time Output Inspection
    console.log('\n⚡ Step 2: Testing Editor Demo & Real-Time Output Inspector (OUTPUT HTML)...');
    await page.click('#nav-demo');
    await new Promise(r => setTimeout(r, 600));

    // Select Basic Editor preset
    await page.click('#preset-basic');
    await new Promise(r => setTimeout(r, 600));

    const inspectorInfo = await page.evaluate(() => {
      const editorGrid = document.querySelector('.editor-grid');
      const inspector = document.querySelector('.realtime-inspector');
      const htmlBox = document.querySelector('.code-html');
      return {
        hasEditorGrid: !!editorGrid,
        hasInspector: !!inspector,
        htmlLength: htmlBox?.textContent?.length || 0,
        htmlSnippet: htmlBox?.textContent?.slice(0, 100) || '',
      };
    });
    console.log('Inspector Info:', inspectorInfo);

    const demoScreenshot = path.join(ARTIFACT_DIR, 'phase27_demo_editor_realtime_inspector.png');
    await page.screenshot({ path: demoScreenshot, fullPage: false });
    console.log(`📸 Editor Demo with Output Inspector screenshot saved: ${demoScreenshot}`);

    // 3. Table Editor Preset & OUTPUT JSON AST
    console.log('\n⚡ Step 3: Testing Table Editor Preset & OUTPUT JSON ProseMirror AST...');
    await page.click('#preset-table');
    await new Promise(r => setTimeout(r, 600));

    // Click OUTPUT JSON tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.inspector-tab-btn'));
      const jsonBtn = btns.find(b => b.textContent && b.textContent.includes('OUTPUT JSON'));
      if (jsonBtn) jsonBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const jsonSnippet = await page.evaluate(() => {
      const jsonBox = document.querySelector('.code-json');
      return jsonBox?.textContent?.slice(0, 150) || '';
    });
    console.log('JSON Output AST Snippet:', jsonSnippet);

    const tableScreenshot = path.join(ARTIFACT_DIR, 'phase27_demo_table_preset_json.png');
    await page.screenshot({ path: tableScreenshot, fullPage: false });
    console.log(`📸 Table Preset & JSON Output screenshot saved: ${tableScreenshot}`);

    // 4. Code Editor Preset & Live Viewer
    console.log('\n⚡ Step 4: Testing Code Editor Preset & LIVE VIEWER Inspector Tab...');
    await page.click('#preset-code');
    await new Promise(r => setTimeout(r, 600));

    // Click LIVE VIEWER tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.inspector-tab-btn'));
      const viewerBtn = btns.find(b => b.textContent && b.textContent.includes('LIVE VIEWER'));
      if (viewerBtn) viewerBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const codeScreenshot = path.join(ARTIFACT_DIR, 'phase27_demo_code_preset.png');
    await page.screenshot({ path: codeScreenshot, fullPage: false });
    console.log(`📸 Code Preset & Live Viewer screenshot saved: ${codeScreenshot}`);

    // 5. Features Matrix Page
    console.log('\n⚡ Step 5: Testing Features Matrix Page & Filtering...');
    await page.click('#nav-features');
    await new Promise(r => setTimeout(r, 600));

    const featureStats = await page.evaluate(() => {
      const boxes = document.querySelectorAll('.feature-box');
      return { totalDisplayed: boxes.length };
    });
    console.log(`Features Matrix displayed: ${featureStats.totalDisplayed} phase items`);

    const featuresScreenshot = path.join(ARTIFACT_DIR, 'phase27_demo_features_matrix.png');
    await page.screenshot({ path: featuresScreenshot, fullPage: false });
    console.log(`📸 Features Matrix screenshot saved: ${featuresScreenshot}`);

    // 6. Documentation Manual Page
    console.log('\n⚡ Step 6: Testing Documentation Page (27 Sections TOC)...');
    await page.click('#nav-docs');
    await new Promise(r => setTimeout(r, 600));

    const docItemsCount = await page.evaluate(() => {
      return document.querySelectorAll('.docs-toc-item').length;
    });
    console.log(`Documentation TOC contains: ${docItemsCount} sections`);

    const docsScreenshot = path.join(ARTIFACT_DIR, 'phase27_demo_documentation_page.png');
    await page.screenshot({ path: docsScreenshot, fullPage: false });
    console.log(`📸 Documentation Page screenshot saved: ${docsScreenshot}`);

    console.log('\n🎉 Phase 27 Demo & Documentation Hub visual verification completed successfully!');
  } catch (err) {
    console.error('❌ Error during Phase 27 browser verification:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

run();
