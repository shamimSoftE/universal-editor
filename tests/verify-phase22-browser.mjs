import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser for Phase 22 Theming Engine & Customization verification...');
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

    await new Promise(r => setTimeout(r, 1000));

    // 1. Check title & Phase 22 Theming Toolbar elements
    console.log('\n⚡ Step 1: Inspecting Phase 22 Theming controls on demo page...');
    const themingInfo = await page.evaluate(() => {
      const themeSwitcher = document.querySelector('.ue-theme-switcher');
      const themeButtons = Array.from(document.querySelectorAll('button')).filter(b =>
        b.textContent?.includes('Dark') ||
        b.textContent?.includes('Light') ||
        b.textContent?.includes('Sepia') ||
        b.textContent?.includes('Cyberpunk') ||
        b.textContent?.includes('Minimal') ||
        b.textContent?.includes('High Contrast')
      );
      const editorCard = document.querySelector('.ue-editor-card');
      const editorBg = editorCard ? getComputedStyle(editorCard).backgroundColor : '';
      const editorThemeAttr = editorCard ? editorCard.getAttribute('data-editor-theme') : '';

      return {
        hasThemeSwitcher: !!themeSwitcher,
        themeButtonsCount: themeButtons.length,
        hasEditorCard: !!editorCard,
        editorBg,
        editorThemeAttr,
      };
    });

    console.log('Phase 22 Inspection Result:');
    console.log(`  - ThemeSwitcher Component: ${themingInfo.hasThemeSwitcher ? '✓ Present' : '✗ Missing'}`);
    console.log(`  - Preset Quick Buttons: ${themingInfo.themeButtonsCount} buttons found`);
    console.log(`  - Initial Editor Theme: "${themingInfo.editorThemeAttr}" (bg: ${themingInfo.editorBg})`);

    // Screenshot 1: Overview with Dark Theme active
    const overviewPath = path.join(ARTIFACT_DIR, 'phase22_theme_presets_overview.png');
    await page.screenshot({ path: overviewPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${overviewPath}`);

    // 2. Switch to Sepia Theme
    console.log('\n⚡ Step 2: Switching to Sepia Theme...');
    await page.evaluate(() => {
      const sepiaBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Sepia')
      );
      sepiaBtn?.click();
    });

    await new Promise(r => setTimeout(r, 600));

    const sepiaInfo = await page.evaluate(() => {
      const card = document.querySelector('.ue-editor-card');
      return {
        themeAttr: card?.getAttribute('data-editor-theme'),
        modeAttr: card?.getAttribute('data-editor-mode'),
        bgColor: card ? getComputedStyle(card).backgroundColor : '',
        textColor: card ? getComputedStyle(card).color : '',
        statusMsg: document.querySelector('.status-indicator')?.textContent || '',
      };
    });

    console.log(`  - Active Theme: "${sepiaInfo.themeAttr}" (mode: ${sepiaInfo.modeAttr})`);
    console.log(`  - Card Background: ${sepiaInfo.bgColor}`);
    console.log(`  - Card Text: ${sepiaInfo.textColor}`);
    console.log(`  - Status Message: "${sepiaInfo.statusMsg}"`);

    // Screenshot 2: Sepia theme active
    const sepiaPath = path.join(ARTIFACT_DIR, 'phase22_theme_sepia_preview.png');
    await page.screenshot({ path: sepiaPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${sepiaPath}`);

    // 3. Switch to Cyberpunk Theme
    console.log('\n⚡ Step 3: Switching to Cyberpunk Neon Theme...');
    await page.evaluate(() => {
      const cyberpunkBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Cyberpunk')
      );
      cyberpunkBtn?.click();
    });

    await new Promise(r => setTimeout(r, 600));

    const cyberpunkInfo = await page.evaluate(() => {
      const card = document.querySelector('.ue-editor-card');
      return {
        themeAttr: card?.getAttribute('data-editor-theme'),
        modeAttr: card?.getAttribute('data-editor-mode'),
        bgColor: card ? getComputedStyle(card).backgroundColor : '',
        textColor: card ? getComputedStyle(card).color : '',
        activeColor: card ? getComputedStyle(card).getPropertyValue('--editor-active-color') : '',
        statusMsg: document.querySelector('.status-indicator')?.textContent || '',
      };
    });

    console.log(`  - Active Theme: "${cyberpunkInfo.themeAttr}" (mode: ${cyberpunkInfo.modeAttr})`);
    console.log(`  - Card Background: ${cyberpunkInfo.bgColor}`);
    console.log(`  - Card Text (Cyan): ${cyberpunkInfo.textColor}`);
    console.log(`  - Active Color (Neon Pink): ${cyberpunkInfo.activeColor}`);
    console.log(`  - Status Message: "${cyberpunkInfo.statusMsg}"`);

    // Screenshot 3: Cyberpunk theme active
    const cyberpunkPath = path.join(ARTIFACT_DIR, 'phase22_theme_cyberpunk_preview.png');
    await page.screenshot({ path: cyberpunkPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${cyberpunkPath}`);

    // 4. Open ThemeSwitcher Dropdown Menu
    console.log('\n⚡ Step 4: Opening ThemeSwitcher Dropdown Menu...');
    await page.evaluate(() => {
      const trigger = document.querySelector('.ue-theme-trigger');
      trigger?.click();
    });

    await new Promise(r => setTimeout(r, 400));

    const menuInfo = await page.evaluate(() => {
      const menu = document.querySelector('.ue-theme-menu');
      const items = Array.from(document.querySelectorAll('.ue-theme-item')).map(el => el.textContent?.trim());
      return {
        menuVisible: !!menu,
        itemsCount: items.length,
        items,
      };
    });

    console.log(`  - Theme Menu Visible: ${menuInfo.menuVisible ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Menu Items Count: ${menuInfo.itemsCount}`);

    // Screenshot 4: Dropdown menu open
    const menuPath = path.join(ARTIFACT_DIR, 'phase22_theme_dropdown_menu.png');
    await page.screenshot({ path: menuPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${menuPath}`);

    console.log('\n🎉 Phase 22 Browser Verification completed successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
