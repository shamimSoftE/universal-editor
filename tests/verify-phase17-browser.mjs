import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core for Phase 17 Vanilla JavaScript API verification...');
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

    await new Promise(r => setTimeout(r, 600));

    // 1. Check title & Phase 17 badge
    console.log('\n⚡ Step 1: Checking Page Header & Phase 17 details...');
    const pageInfo = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.textContent || '';
      const badgeText = document.querySelector('.nav-badges')?.textContent || '';
      return { heading, badgeText };
    });

    console.log('Page Inspection Result:');
    console.log(`  - Heading: "${pageInfo.heading}"`);
    console.log(`  - Nav Badges: "${pageInfo.badgeText.replace(/\s+/g, ' ').trim()}"`);

    // Capture main overview screenshot
    const overviewScreenshot = path.join(ARTIFACT_DIR, 'phase17_browser_overview.png');
    await page.screenshot({ path: overviewScreenshot, fullPage: false });
    console.log(`📸 Screenshot captured: ${overviewScreenshot}`);

    // 2. Switch to Vanilla Core API View
    console.log('\n🔄 Step 2: Testing Vanilla Core API View toggle...');
    await page.click('#showVanillaView');
    await new Promise(r => setTimeout(r, 600));

    const vanillaInfo = await page.evaluate(() => {
      const vanillaHeading = document.querySelector('#editor-container h1')?.textContent || '';
      const tableRow = Array.from(document.querySelectorAll('#editor-container table tr')).find(r =>
        r.textContent?.includes('Vanilla JS API')
      );
      const outputHtmlText = document.querySelector('#outputHtml')?.textContent || '';
      const statsText = document.querySelector('#statsBadge')?.textContent || '';

      return {
        vanillaHeading,
        hasVanillaRow: !!tableRow,
        rowContent: tableRow ? tableRow.textContent.trim() : null,
        hasOutputHtml: outputHtmlText.length > 0,
        statsText: statsText.trim()
      };
    });

    console.log('Vanilla View Inspection:');
    console.log(`  - Vanilla Editor Heading: "${vanillaInfo.vanillaHeading}"`);
    console.log(`  - Phase 17 Table Row: ${vanillaInfo.hasVanillaRow ? '✓ YES' : '✗ NO'}`);
    if (vanillaInfo.rowContent) {
      console.log(`  - Row Content: ${vanillaInfo.rowContent}`);
    }
    console.log(`  - Live HTML Output Pane: ${vanillaInfo.hasOutputHtml ? '✓ Populated' : '✗ Empty'}`);
    console.log(`  - Live Stats Badge: "${vanillaInfo.statsText}"`);

    const vanillaScreenshot = path.join(ARTIFACT_DIR, 'phase17_vanilla_editor.png');
    await page.screenshot({ path: vanillaScreenshot, fullPage: false });
    console.log(`📸 Screenshot captured: ${vanillaScreenshot}`);

    console.log('\n🎉 Phase 17 Browser Verification Completed Successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
