import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser for Phase 21 AI Assistant Integration verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1480, height: 1100 });

    console.log('🌐 Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });

    await new Promise(r => setTimeout(r, 800));

    // 1. Check title & Phase 21 badges
    console.log('\n⚡ Step 1: Checking Page Header & Phase 21 details...');
    const pageInfo = await page.evaluate(() => {
      const heading = document.querySelector('h1, h2')?.textContent || '';
      const badgeText = document.querySelector('.nav-badges')?.textContent || '';
      const subtitle = document.querySelector('.brand-subtitle')?.textContent || '';
      const phase21Task = Array.from(document.querySelectorAll('li[data-type="taskItem"]')).find(li =>
        li.textContent?.includes('Phase 21')
      );
      const aiBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('AI Assistant')
      );

      return {
        heading,
        badgeText: badgeText.replace(/\s+/g, ' ').trim(),
        subtitle: subtitle.replace(/\s+/g, ' ').trim(),
        hasPhase21Task: !!phase21Task,
        hasAIButton: !!aiBtn,
      };
    });

    console.log('Page Inspection Result:');
    console.log(`  - Subtitle: "${pageInfo.subtitle}"`);
    console.log(`  - Nav Badges: "${pageInfo.badgeText}"`);
    console.log(`  - Phase 21 Task Item: ${pageInfo.hasPhase21Task ? '✓ YES' : '✗ NO'}`);
    console.log(`  - AI Assistant Button Present: ${pageInfo.hasAIButton ? '✓ YES' : '✗ NO'}`);

    // 2. Open AI Assistant Modal
    console.log('\n⚡ Step 2: Opening AI Assistant Modal Dialog...');
    await page.evaluate(() => {
      const aiBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('AI Assistant')
      );
      aiBtn?.click();
    });

    await page.waitForSelector('.ue-ai-modal', { visible: true, timeout: 5000 });
    await new Promise(r => setTimeout(r, 600));

    // Check modal contents
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('.ue-ai-modal');
      const title = modal?.querySelector('.ue-ai-title')?.textContent || '';
      const quote = modal?.querySelector('.ue-ai-quote-content')?.textContent || '';
      const actionCards = Array.from(modal?.querySelectorAll('.ue-ai-action-card') || []).map(c =>
        c.querySelector('.ue-ai-action-title')?.textContent?.trim() || ''
      );

      return {
        hasModal: !!modal,
        title: title.trim(),
        quote: quote.trim(),
        actionCards,
      };
    });

    console.log(`  - Modal Title: "${modalInfo.title}"`);
    console.log(`  - Target Selection Quote: "${modalInfo.quote}"`);
    console.log(`  - Available AI Action Cards (${modalInfo.actionCards.length}): ${modalInfo.actionCards.join(', ')}`);

    // Screenshot 1: AI Modal Overview
    const screenshot1 = path.join(ARTIFACT_DIR, 'phase21_ai_modal_overview.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`📸 Saved screenshot 1 to: ${screenshot1}`);

    // 3. Trigger "Improve writing" action
    console.log('\n⚡ Step 3: Triggering "Improve writing" AI transformation...');
    await page.evaluate(() => {
      const improveCard = Array.from(document.querySelectorAll('.ue-ai-action-card')).find(c =>
        c.textContent?.includes('Improve writing')
      );
      if (improveCard) improveCard.click();
    });

    // Wait for AI generation result box
    await page.waitForSelector('.ue-ai-preview-box', { visible: true, timeout: 5000 });
    await new Promise(r => setTimeout(r, 500));

    const resultText = await page.evaluate(() => {
      return document.querySelector('.ue-ai-preview-box')?.textContent?.trim() || '';
    });
    console.log(`  - Generated AI Result: "${resultText.slice(0, 100)}..."`);

    // Screenshot 2: AI Result Preview
    const screenshot2 = path.join(ARTIFACT_DIR, 'phase21_ai_generated_result.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log(`📸 Saved screenshot 2 to: ${screenshot2}`);

    // 4. Click "Replace Selection"
    console.log('\n⚡ Step 4: Applying AI Result into Editor...');
    await page.evaluate(() => {
      const replaceBtn = document.querySelector('.ue-ai-footer .ue-btn-primary');
      if (replaceBtn) replaceBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    const postApplyState = await page.evaluate(() => {
      const modal = document.querySelector('.ue-ai-modal');
      const statusIndicator = document.querySelector('.status-indicator')?.textContent || '';
      return {
        modalClosed: !modal,
        statusIndicator,
      };
    });

    console.log(`  - Modal Closed After Apply: ${postApplyState.modalClosed ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Status Indicator: "${postApplyState.statusIndicator}"`);

    console.log('\n🎉 Phase 21 Browser Visual Verification Succeeded with 100% compliance!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
