import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  console.log('🚀 Launching Edge browser for Phase 20 Collaboration & Comments verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1480, height: 1100 });

    console.log('🌐 Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });

    await new Promise(r => setTimeout(r, 800));

    // 1. Check title & Phase 20 badges
    console.log('\n⚡ Step 1: Checking Page Header & Phase 20 details...');
    const pageInfo = await page.evaluate(() => {
      const heading = document.querySelector('h2')?.textContent || '';
      const badgeText = document.querySelector('.nav-badges')?.textContent || '';
      const subtitle = document.querySelector('.brand-subtitle')?.textContent || '';
      const phase20Task = Array.from(document.querySelectorAll('li[data-type="taskItem"]')).find(li =>
        li.textContent?.includes('Phase 20')
      );
      const collabBar = document.querySelector('.ue-collab-bar');
      const commentSidebar = document.querySelector('.ue-comment-sidebar');

      return {
        heading,
        badgeText: badgeText.replace(/\s+/g, ' ').trim(),
        subtitle: subtitle.replace(/\s+/g, ' ').trim(),
        hasPhase20Task: !!phase20Task,
        hasCollabBar: !!collabBar,
        hasCommentSidebar: !!commentSidebar,
        collabUsersCount: document.querySelectorAll('.ue-collab-avatar').length,
      };
    });

    console.log('Page Inspection Result:');
    console.log(`  - Subtitle: "${pageInfo.subtitle}"`);
    console.log(`  - Nav Badges: "${pageInfo.badgeText}"`);
    console.log(`  - Phase 20 Task Item: ${pageInfo.hasPhase20Task ? '✓ YES' : '✗ NO'}`);
    console.log(`  - CollaborationBar Present: ${pageInfo.hasCollabBar ? '✓ YES' : '✗ NO'}`);
    console.log(`  - CommentSidebar Present: ${pageInfo.hasCommentSidebar ? '✓ YES' : '✗ NO'}`);
    console.log(`  - Initial Active Collaborators: ${pageInfo.collabUsersCount}`);

    // Screenshot 1: Overview
    const screenshot1 = path.join(ARTIFACT_DIR, 'phase20_collab_overview.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`📸 Saved screenshot 1 to: ${screenshot1}`);

    // 2. Simulate Peer Join
    console.log('\n👥 Step 2: Simulating Remote Peer Join (Alex Rivers)...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Peer (Alex)')
      );
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 400));
    const newCount = await page.evaluate(() => document.querySelectorAll('.ue-collab-avatar').length);
    console.log(`  - Collaborators after Alex joined: ${newCount} (Expected: 3)`);

    // 3. Simulate Peer Typing
    console.log('\n✍️ Step 3: Simulating Peer Typing...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Peer Typing')
      );
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 4. Test Adding a Comment
    console.log('\n💬 Step 4: Adding a new comment in CommentSidebar...');
    await page.evaluate(() => {
      const textarea = document.querySelector('.ue-compose-input');
      if (textarea) {
        textarea.value = 'Phase 20 multi-user collaboration verified! @sarah @alex';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const postBtn = document.querySelector('.ue-compose-btn');
      if (postBtn) postBtn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    // 5. Test Acquiring Edit Lock
    console.log('\n🔒 Step 5: Acquiring exclusive document edit lock...');
    await page.evaluate(() => {
      const lockBtn = document.querySelector('.ue-lock-action-btn');
      if (lockBtn) lockBtn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    const lockStatus = await page.evaluate(() => {
      return document.querySelector('.ue-lock-pill')?.textContent?.trim() || 'No pill';
    });
    console.log(`  - Lock Status: "${lockStatus}"`);

    // Screenshot 2: Active Comments & Locked state
    const screenshot2 = path.join(ARTIFACT_DIR, 'phase20_collab_active_comments.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log(`📸 Saved screenshot 2 to: ${screenshot2}`);

    // 6. Test Peer Lock Simulation & Lock Banner
    console.log('\n⚠️ Step 6: Testing Peer Lock simulation & DocumentLockBanner...');
    await page.evaluate(() => {
      const peerLockBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Peer Lock')
      );
      if (peerLockBtn) peerLockBtn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    const bannerText = await page.evaluate(() => {
      return document.querySelector('.ue-lock-banner')?.textContent?.trim() || 'No banner';
    });
    console.log(`  - Lock Banner Text: "${bannerText.replace(/\s+/g, ' ')}"`);

    // Screenshot 3: Lock Banner
    const screenshot3 = path.join(ARTIFACT_DIR, 'phase20_lock_banner.png');
    await page.screenshot({ path: screenshot3, fullPage: false });
    console.log(`📸 Saved screenshot 3 to: ${screenshot3}`);

    console.log('\n✨ Phase 20 Browser Verification Complete!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Fatal error during browser verification:', err);
  process.exit(1);
});
