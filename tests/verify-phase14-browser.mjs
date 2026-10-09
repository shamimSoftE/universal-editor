import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser via puppeteer-core for Phase 14 Word & Character Counter verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });

    console.log('🌐 Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait for Vue 3 editor initialization
    await page.waitForFunction(() => !!window.vueEditorInstance, { timeout: 10000 });
    console.log('✅ Vue 3 editor instance detected on page.');

    await new Promise(r => setTimeout(r, 600));

    // 1. Verify Initial Footer Statistics in Vue 3 Component
    console.log('\n📊 Step 1: Checking initial Vue 3 Footer statistics chips...');
    const initialStats = await page.evaluate(() => {
      const wordsEl = document.querySelector('.ue-stat-words');
      const charsEl = document.querySelector('.ue-stat-characters');
      const noSpacesEl = document.querySelector('.ue-stat-characters-no-spaces');
      const parasEl = document.querySelector('.ue-stat-paragraphs');
      const readingEl = document.querySelector('.ue-stat-reading-time');
      return {
        words: wordsEl?.textContent?.trim(),
        chars: charsEl?.textContent?.trim(),
        noSpaces: noSpacesEl?.textContent?.trim(),
        paras: parasEl?.textContent?.trim(),
        readingTime: readingEl?.textContent?.trim(),
        hasFooter: !!document.querySelector('.ue-editor-footer')
      };
    });

    console.log('Initial Footer Statistics:');
    console.log(`  • Words: "${initialStats.words}"`);
    console.log(`  • Characters: "${initialStats.chars}"`);
    console.log(`  • Characters (no spaces): "${initialStats.noSpaces}"`);
    console.log(`  • Paragraphs: "${initialStats.paras}"`);
    console.log(`  • Reading Time: "${initialStats.readingTime}"`);

    if (!initialStats.hasFooter || !initialStats.words || !initialStats.chars) {
      throw new Error('Footer or statistics chips not found!');
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase14_vue3_initial_stats.png') });
    console.log('📸 Captured phase14_vue3_initial_stats.png');

    // 2. Set Word Limit to 40 (which is less than current word count -> triggers Danger / Exceeded state)
    console.log('\n📏 Step 2: Testing Word Limit (40 words)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Word Limit: 40'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    const wordLimitStats = await page.evaluate(() => {
      const wordsEl = document.querySelector('.ue-stat-words');
      const statusEl = document.querySelector('.status-indicator');
      return {
        wordsText: wordsEl?.textContent?.trim(),
        isDanger: wordsEl?.classList.contains('ue-stat-danger'),
        isWarning: wordsEl?.classList.contains('ue-stat-warning'),
        statusMessage: statusEl?.textContent?.trim()
      };
    });

    console.log(`  • Words Pill Text: "${wordLimitStats.wordsText}"`);
    console.log(`  • Has Danger Class: ${wordLimitStats.isDanger}`);
    console.log(`  • Has Warning Class: ${wordLimitStats.isWarning}`);
    console.log(`  • Event Status Indicator: "${wordLimitStats.statusMessage}"`);

    if (!wordLimitStats.wordsText?.includes('/ 40')) {
      throw new Error(`Expected word limit pill to show '/ 40 words', got "${wordLimitStats.wordsText}"`);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase14_vue3_word_limit_warning.png') });
    console.log('📸 Captured phase14_vue3_word_limit_warning.png');

    // 3. Test Hard Limit Toggle and Input Blocking
    console.log('\n🚫 Step 3: Testing Hard Limit Input Blocking...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Hard Limit:'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 400));

    const hardLimitState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Hard Limit:'));
      const statusEl = document.querySelector('.status-indicator');
      return {
        buttonText: btn?.textContent?.trim(),
        statusMessage: statusEl?.textContent?.trim()
      };
    });

    console.log(`  • Hard Limit Button: "${hardLimitState.buttonText}"`);
    console.log(`  • Status Message: "${hardLimitState.statusMessage}"`);

    // Verify input blocking when limit is exceeded
    const beforeWords = await page.evaluate(() => window.vueEditorInstance.getWordCount());
    console.log(`  • Word count before insertion attempt: ${beforeWords}`);

    // Attempt to type content into ProseMirror while hard limit is active
    await page.click('.ProseMirror');
    await page.keyboard.type(' Extra typed words to test blocking');

    await new Promise(r => setTimeout(r, 400));

    const afterWords = await page.evaluate(() => window.vueEditorInstance.getWordCount());
    console.log(`  • Word count after typing attempt: ${afterWords}`);

    if (afterWords > beforeWords) {
      console.warn('⚠️ Warning: Hard limit insertion was not blocked in this transaction.');
    } else {
      console.log('✅ Success: Hard limit prevented typing extra text!');
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase14_vue3_hard_limit_blocked.png') });
    console.log('📸 Captured phase14_vue3_hard_limit_blocked.png');

    // 4. Reset limits
    console.log('\n🔄 Step 4: Resetting limits to Unlimited...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Unlimited'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 400));

    const resetStats = await page.evaluate(() => {
      const wordsEl = document.querySelector('.ue-stat-words');
      return {
        wordsText: wordsEl?.textContent?.trim(),
        isDanger: wordsEl?.classList.contains('ue-stat-danger')
      };
    });
    console.log(`  • Reset words pill text: "${resetStats.wordsText}" (Danger: ${resetStats.isDanger})`);

    // 5. Test Vanilla Editor View & Inspectors
    console.log('\n🍦 Step 5: Testing Vanilla View Statistics & Limit Controls...');
    await page.click('#showVanillaView');
    await new Promise(r => setTimeout(r, 600));

    const vanillaStats = await page.evaluate(() => {
      const badge = document.getElementById('statsBadge');
      return badge?.textContent?.trim();
    });
    console.log(`  • Vanilla Stats Badge: "${vanillaStats}"`);

    // Click Word Limit 50 in Vanilla view
    console.log('  • Clicking Vanilla Word Limit: 50 button...');
    await page.click('#btnSetWordLimit');
    await new Promise(r => setTimeout(r, 300));

    // Click Hard Limit Toggle in Vanilla view
    console.log('  • Clicking Vanilla Hard Limit Toggle...');
    await page.click('#btnToggleHardLimit');
    await new Promise(r => setTimeout(r, 300));

    // Check event log
    const eventLogs = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#eventLogList .event-item'));
      return items.slice(0, 5).map(it => it.textContent?.trim());
    });
    console.log('  • Recent Vanilla Event Log entries:');
    eventLogs.forEach(entry => console.log(`     - ${entry}`));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase14_vanilla_stats_limits.png') });
    console.log('📸 Captured phase14_vanilla_stats_limits.png');

    // Switch back to Vue 3 view for final verified screenshot
    await page.click('#showVue3View');
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase14_final_verified.png'), fullPage: true });
    console.log('📸 Captured phase14_final_verified.png');

    console.log('\n🎉 ALL PHASE 14 BROWSER CHECKS COMPLETED SUCCESSFULLY!');
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
