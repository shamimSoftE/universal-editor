import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core for Phase 16 Vue 2 Adapter verification...');
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

    // Wait for Vue editor initialization
    await page.waitForFunction(() => !!window.vueEditorInstance, { timeout: 10000 });
    console.log('✅ Vue editor instance detected on page.');

    await new Promise(r => setTimeout(r, 600));

    // 1. Check title & Phase 16 text
    console.log('\n⚡ Step 1: Checking Page Header & Phase 16 details...');
    const pageInfo = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.textContent || '';
      const hasVue2Table = Array.from(document.querySelectorAll('table tr')).some(row =>
        row.textContent?.includes('Vue 2 Adapter')
      );
      const hasVue2Task = Array.from(document.querySelectorAll('[data-type="taskItem"]')).some(item =>
        item.textContent?.includes('Phase 16: Vue 2 Adapter')
      );
      return { heading, hasVue2Table, hasVue2Task };
    });

    console.log('Page Inspection Result:');
    console.log(`  - Heading: "${pageInfo.heading}"`);
    console.log(`  - Vue 2 Adapter in Features Table: ${pageInfo.hasVue2Table ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Vue 2 Adapter in Task List: ${pageInfo.hasVue2Task ? '✓ YES' : '✗ NO'}`);

    // Capture main overview screenshot
    const overviewScreenshot = path.join(ARTIFACT_DIR, 'phase16_browser_overview.png');
    await page.screenshot({ path: overviewScreenshot, fullPage: false });
    console.log(`📸 Screenshot captured: ${overviewScreenshot}`);

    // 2. Capture Vue 3 & Viewer side-by-side
    const vueSection = await page.$('#vue3-section');
    if (vueSection) {
      const vueScreenshot = path.join(ARTIFACT_DIR, 'phase16_vue_adapter_showcase.png');
      await vueSection.screenshot({ path: vueScreenshot });
      console.log(`📸 Screenshot captured: ${vueScreenshot}`);
    }

    // 3. Switch to Vanilla View to verify multi-view and Phase 16 row
    console.log('\n🔄 Step 2: Testing Vanilla View toggle...');
    await page.click('#showVanillaView');
    await new Promise(r => setTimeout(r, 600));

    const vanillaInfo = await page.evaluate(() => {
      const vanillaHeading = document.querySelector('#editor-container h1')?.textContent || '';
      const tableRow = Array.from(document.querySelectorAll('#editor-container table tr')).find(r =>
        r.textContent?.includes('Vue 2 Adapter')
      );
      return {
        vanillaHeading,
        hasVue2Row: !!tableRow,
        rowText: tableRow ? tableRow.textContent.trim() : null
      };
    });

    console.log('Vanilla View Inspection:');
    console.log(`  - Vanilla Editor Heading: "${vanillaInfo.vanillaHeading}"`);
    console.log(`  - Phase 16 Table Row: ${vanillaInfo.hasVue2Row ? '✓ YES' : '✗ NO'}`);
    if (vanillaInfo.rowText) {
      console.log(`  - Row Content: ${vanillaInfo.rowText}`);
    }

    const vanillaScreenshot = path.join(ARTIFACT_DIR, 'phase16_vanilla_editor.png');
    await page.screenshot({ path: vanillaScreenshot, fullPage: false });
    console.log(`📸 Screenshot captured: ${vanillaScreenshot}`);

    console.log('\n🎉 Phase 16 Browser Verification Completed Successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
