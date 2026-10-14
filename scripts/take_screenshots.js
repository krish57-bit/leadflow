const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function run() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('🚀 Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: {
      width: 1440,
      height: 960,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();

  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for leads to render
    await page.waitForSelector('h3', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Capture Main Dashboard
    console.log('📸 Capturing 01_main_dashboard.png...');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01_main_dashboard.png'),
      fullPage: false,
    });

    // 2. Capture Search & Filter
    console.log('🔍 Testing live search...');
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('pricing', { delay: 50 });
      await new Promise((r) => setTimeout(r, 800));

      console.log('📸 Capturing 02_search_and_filters.png...');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02_search_and_filters.png'),
        fullPage: false,
      });

      // Clear search
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await new Promise((r) => setTimeout(r, 800));
    }

    // 3. Open Sarah Connor Timeline & AI Reasoning
    console.log('💬 Opening Sarah Connor timeline modal...');
    const sarahCard = await page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const sarah = headings.find((h) => h.textContent.includes('Sarah Connor'));
      return sarah ? sarah.closest('[role="button"]') : null;
    });

    if (sarahCard) {
      await sarahCard.click();
      await page.waitForSelector('textarea', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 800));

      // Enter discussion note
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.type(
          'Reviewed wealth proposal. Client wants to allocate $5M to municipal bond tax shields next Tuesday at 3pm.',
          { delay: 20 }
        );
        await new Promise((r) => setTimeout(r, 500));

        // Click AI Reason & Extract
        console.log('✨ Triggering AI Reason & Extract...');
        const aiButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find((b) => b.textContent.includes('AI Reason & Extract'));
        });

        if (aiButton) {
          await aiButton.click();
          await new Promise((r) => setTimeout(r, 1500));

          // Click View Fiduciary Reasoning Trace
          const traceButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find((b) => b.textContent.includes('Reasoning Trace'));
          });
          if (traceButton) {
            await traceButton.click();
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }

      console.log('📸 Capturing 03_timeline_ai_reasoning.png...');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '03_timeline_ai_reasoning.png'),
        fullPage: false,
      });

      // Close modal
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 800));
    }

    // 4. Open Add New Lead Modal
    console.log('➕ Opening Add New Lead modal...');
    const addLeadButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent.includes('Add New Lead'));
    });

    if (addLeadButton) {
      await addLeadButton.click();
      await page.waitForSelector('input[required]', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 600));

      console.log('📸 Capturing 04_add_new_lead_modal.png...');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04_add_new_lead_modal.png'),
        fullPage: false,
      });

      await page.keyboard.press('Escape');
    }

    console.log('🎉 All 4 screenshots captured successfully in:', SCREENSHOTS_DIR);
  } catch (err) {
    console.error('❌ Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
