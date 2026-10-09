import puppeteer from 'puppeteer-core';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!window.vueEditorInstance);

  // Click Word Limit: 40 button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Word Limit: 40'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Scroll footer into view
  await page.evaluate(() => {
    document.querySelector('.ue-footer')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));

  const footer = await page.$('.ue-footer');
  if (footer) {
    await footer.screenshot({ path: 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c/phase14_footer_danger_pill.png' });
  }
  await page.screenshot({ path: 'C:/Users/MRCS/.gemini/antigravity-ide/brain/b0f6e40e-e909-4c13-b909-8d801e9e6d6c/phase14_danger_scrolled_view.png' });
  try { await browser.close(); } catch {}
  console.log('Captured footer danger screenshots!');
}

capture();
