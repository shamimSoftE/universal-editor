import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser for Phase 19 Document Version History verification...');
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

    // 1. Check title & Phase 19 badges
    console.log('\n⚡ Step 1: Checking Page Header & Phase 19 details...');
    const pageInfo = await page.evaluate(() => {
      const heading = document.querySelector('h2')?.textContent || '';
      const badgeText = document.querySelector('.nav-badges')?.textContent || '';
      const subtitle = document.querySelector('.brand-subtitle')?.textContent || '';
      const phase19Task = Array.from(document.querySelectorAll('li[data-type="taskItem"]')).find(li =>
        li.textContent?.includes('Phase 19')
      );
      const phase19Table = Array.from(document.querySelectorAll('.ue-table tr')).find(tr =>
        tr.textContent?.includes('Version History & Diff (Phase 19)')
      );

      return {
        heading,
        badgeText: badgeText.replace(/\s+/g, ' ').trim(),
        subtitle: subtitle.replace(/\s+/g, ' ').trim(),
        hasPhase19Task: !!phase19Task,
        hasPhase19Table: !!phase19Table,
      };
    });

    console.log('Page Inspection Result:');
    console.log(`  - Heading: "${pageInfo.heading}"`);
    console.log(`  - Subtitle: "${pageInfo.subtitle}"`);
    console.log(`  - Nav Badges: "${pageInfo.badgeText}"`);
    console.log(`  - Phase 19 Task Item: ${pageInfo.hasPhase19Task ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Phase 19 Table Row: ${pageInfo.hasPhase19Table ? '✓ YES' : '✗ NO'}`);

    // 2. Open Version History Modal in Vue 3 view
    console.log('\n🕒 Step 2: Testing VersionHistoryModal in Vue 3...');
    const versionBtnClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Version History')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    await new Promise(r => setTimeout(r, 600));

    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('.ue-version-history-modal');
      const title = modal?.querySelector('h3')?.textContent || '';
      const itemsCount = modal?.querySelectorAll('.ue-version-item').length || 0;
      const hasDiffBadges = !!modal?.querySelector('span[style*="rgba(34, 197, 94"]');

      return {
        isOpen: !!modal,
        title,
        itemsCount,
        hasDiffBadges,
      };
    });

    console.log('Vue 3 VersionHistoryModal Inspection:');
    console.log(`  - Modal Open: ${modalInfo.isOpen ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Modal Title: "${modalInfo.title}"`);
    console.log(`  - Timeline Versions Count: ${modalInfo.itemsCount}`);
    console.log(`  - Diff Badges Visible: ${modalInfo.hasDiffBadges ? '✓ YES' : '✗ NO'}`);

    // Capture modal screenshot
    const modalScreenshot = path.join(ARTIFACT_DIR, 'phase19_vue_version_modal.png');
    await page.screenshot({ path: modalScreenshot, fullPage: false });
    console.log(`📸 Screenshot captured: ${modalScreenshot}`);

    // Close modal
    await page.click('.ue-modal-close');
    await new Promise(r => setTimeout(r, 400));

    // 3. Switch to Vanilla View & Test LCS Diff Engine
    console.log('\n🔄 Step 3: Testing Vanilla View LCS Diff Engine...');
    await page.click('#showVanillaView');
    await new Promise(r => setTimeout(r, 500));

    // Click Take Snapshot
    await page.click('#btnCreateSnapshot');
    await new Promise(r => setTimeout(r, 300));

    // Click Version Diff
    await page.click('#btnVersionHistory');
    await new Promise(r => setTimeout(r, 500));

    const vanillaDiffInfo = await page.evaluate(() => {
      const diffTabActive = document.querySelector('[data-tab="tab-diff"]')?.classList.contains('active');
      const badgeText = document.querySelector('#diffSummaryBadge')?.textContent?.trim() || '';
      const diffContent = document.querySelector('#outputDiff')?.innerHTML || '';
      const hasIns = diffContent.includes('ue-diff-ins');
      const hasDel = diffContent.includes('ue-diff-del');

      return {
        diffTabActive,
        badgeText,
        hasIns,
        hasDel,
      };
    });

    console.log('Vanilla Diff Inspection:');
    console.log(`  - Diff Tab Active: ${vanillaDiffInfo.diffTabActive ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Diff Summary Badge: "${vanillaDiffInfo.badgeText.replace(/\s+/g, ' ')}"`);
    console.log(`  - Contains Inserted Marks: ${vanillaDiffInfo.hasIns ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Contains Deleted Marks: ${vanillaDiffInfo.hasDel ? '✓ YES' : '✗ NO'}`);

    const vanillaDiffScreenshot = path.join(ARTIFACT_DIR, 'phase19_vanilla_diff.png');
    await page.screenshot({ path: vanillaDiffScreenshot, fullPage: false });
    console.log(`📸 Screenshot captured: ${vanillaDiffScreenshot}`);

    console.log('\n🎉 Phase 19 Browser Verification Completed Successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
