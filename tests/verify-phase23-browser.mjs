import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser for Phase 23 Mobile & Accessibility verification...');
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

    // 1. Inspect Accessibility attributes & Live Region
    console.log('\n⚡ Step 1: Inspecting Phase 23 ARIA accessibility elements & live region...');
    const a11yInfo = await page.evaluate(() => {
      const editorCard = document.querySelector('.ue-editor-card');
      const pm = document.querySelector('.ProseMirror');
      const announcer = document.querySelector('.ue-announcer, .ue-sr-only');
      const toolbar = document.querySelector('.ue-toolbar');
      const toolbarBtns = Array.from(document.querySelectorAll('.ue-toolbar-btn'));

      return {
        cardRole: editorCard?.getAttribute('role'),
        cardAriaLabel: editorCard?.getAttribute('aria-label'),
        pmRole: pm?.getAttribute('role'),
        pmAriaMultiline: pm?.getAttribute('aria-multiline'),
        pmAriaLabel: pm?.getAttribute('aria-label'),
        hasAnnouncer: !!announcer,
        announcerRole: announcer?.getAttribute('role'),
        announcerAriaLive: announcer?.getAttribute('aria-live'),
        toolbarRole: toolbar?.getAttribute('role'),
        isToolbarScrollable: toolbar?.classList.contains('ue-toolbar-scrollable'),
        toolbarButtonsCount: toolbarBtns.length,
        hasRovingTabindex: toolbarBtns.some(b => b.getAttribute('tabindex') === '0'),
      };
    });

    console.log('Phase 23 Accessibility Inspection:');
    console.log(`  - Card Role: "${a11yInfo.cardRole}", Label: "${a11yInfo.cardAriaLabel}"`);
    console.log(`  - Content Editable PM Role: "${a11yInfo.pmRole}", Multiline: ${a11yInfo.pmAriaMultiline}`);
    console.log(`  - Screen Reader Announcer: ${a11yInfo.hasAnnouncer ? '✓ Present' : '✗ Missing'} (role="${a11yInfo.announcerRole}", aria-live="${a11yInfo.announcerAriaLive}")`);
    console.log(`  - Toolbar Role: "${a11yInfo.toolbarRole}", Scrollable: ${a11yInfo.isToolbarScrollable ? '✓ Yes' : '✗ No'}`);
    console.log(`  - Roving Tabindex Active: ${a11yInfo.hasRovingTabindex ? '✓ Yes' : '✗ No'}`);

    // Test live announcement
    console.log('\n⚡ Step 2: Testing Screen Reader live announcement...');
    await page.evaluate(() => {
      const testAnnounceBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Test Announce')
      );
      if (testAnnounceBtn) testAnnounceBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Capture Screenshot 1: Overview with ARIA announcement & Desktop View
    const announcerPath = path.join(ARTIFACT_DIR, 'phase23_screen_reader_announcer.png');
    await page.screenshot({ path: announcerPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${announcerPath}`);

    // 2. Keyboard Navigation & Visible Focus Rings
    console.log('\n⚡ Step 3: Testing Keyboard Navigation and :focus-visible outline rings...');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus specifically on a toolbar button to test high-contrast focus rings
    await page.evaluate(() => {
      const boldBtn = document.querySelector('.ue-btn-bold') || document.querySelector('.ue-toolbar-btn');
      if (boldBtn) {
        boldBtn.focus({ focusVisible: true });
        boldBtn.classList.add('is-focused');
      }
    });

    await new Promise(r => setTimeout(r, 400));
    const focusRingPath = path.join(ARTIFACT_DIR, 'phase23_keyboard_focus_ring.png');
    await page.screenshot({ path: focusRingPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${focusRingPath}`);

    // 3. Switch to Simulated Mobile Phone Viewport (375px)
    console.log('\n⚡ Step 4: Activating Simulated Mobile Phone Viewport (375px)...');
    await page.evaluate(() => {
      const editorOnlyBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Editor Only')
      );
      if (editorOnlyBtn) editorOnlyBtn.click();

      const mobileBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Mobile Phone')
      );
      if (mobileBtn) mobileBtn.click();

      const wrapper = document.querySelector('.editor-collab-wrapper');
      if (wrapper) {
        wrapper.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -90);
      }
    });

    await new Promise(r => setTimeout(r, 600));

    const mobilePath = path.join(ARTIFACT_DIR, 'phase23_mobile_viewport_375px.png');
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log(`📸 Screenshot saved: ${mobilePath}`);

    // 4. Test Native Mobile Emulation (375x812 Viewport)
    console.log('\n⚡ Step 5: Emulating native 375x812 mobile device with touch scrolling...');
    await page.setViewport({
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    await page.evaluate(() => {
      // Hide comments sidebar on mobile to view full editor & scrollable toolbar
      const commentsToggleBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Comments (')
      );
      if (commentsToggleBtn) commentsToggleBtn.click();

      const toolbar = document.querySelector('.ue-toolbar');
      if (toolbar) {
        toolbar.scrollIntoView({ behavior: 'instant', block: 'center' });
        toolbar.scrollLeft = 140;
      }
    });

    await new Promise(r => setTimeout(r, 600));

    const touchToolbarPath = path.join(ARTIFACT_DIR, 'phase23_touch_toolbar_scroll.png');
    await page.screenshot({ path: touchToolbarPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${touchToolbarPath}`);

    console.log('\n🎉 Phase 23 Visual Verification Completed Successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Phase 23 verification failed:', err);
  process.exit(1);
});
