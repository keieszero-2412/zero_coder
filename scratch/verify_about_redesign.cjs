const pw = require('C:/Users/zero/AppData/Local/ms-playwright-go/1.57.0/package');
const chromePath = 'C:/Users/zero/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/zero/.gemini/antigravity/brain/d44c83c7-12f9-4157-99e1-e2ede6ead940';

(async () => {
  const browser = await pw.chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  if (page.url().includes('/auth')) {
    console.log('Authenticating...');
    const emailInput = await page.waitForSelector('input[type="email"]');
    await emailInput.fill('student@zerocoder.io');
    const continueBtn = await page.$('button[type="submit"]');
    await continueBtn.click();

    const pwdInput = await page.waitForSelector('input[type="password"]', { timeout: 6000 });
    await pwdInput.fill('password123');
    const loginBtn = await page.$('button[type="submit"]');
    await loginBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.waitForSelector('.zc-command-header', { timeout: 15000 });
  console.log('Header detected. Opening About modal...');

  async function openAboutModal() {
    const aboutBtn = await page.$('button[title="About Project"]') || await page.$('.zc-hdr-utilities button:nth-child(4)');
    if (aboutBtn) {
      await aboutBtn.click();
    } else {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title="About Project"]') || document.querySelector('.zc-hdr-utilities button:nth-child(4)');
        if (btn) btn.click();
      });
    }
    await page.waitForSelector('.zc-about-modal', { timeout: 5000 });
  }

  // Open modal
  await openAboutModal();
  console.log('About modal opened successfully!');

  // 1. Verify content elements
  const contentAudit = await page.evaluate(() => {
    const title = document.querySelector('#zc-about-title')?.innerText || '';
    const pathText = document.querySelector('.zc-about-path')?.innerText || '';
    const desc = document.querySelector('.zc-about-desc')?.innerText || '';
    const sectionHeaders = Array.from(document.querySelectorAll('.zc-about-section-header')).map(el => el.innerText.trim());
    const courseItems = Array.from(document.querySelectorAll('.zc-about-course-item')).map(el => el.innerText.trim());
    const guideItems = Array.from(document.querySelectorAll('.zc-about-guide-item')).map(el => el.innerText.trim());
    const tabsCount = document.querySelectorAll('.zc-about-tab-btn').length;
    const githubBtn = document.querySelector('.zc-about-github-btn');
    const githubData = githubBtn ? {
      text: githubBtn.innerText.trim(),
      href: githubBtn.getAttribute('href'),
      target: githubBtn.getAttribute('target'),
      rel: githubBtn.getAttribute('rel'),
      hasIcon: githubBtn.querySelector('svg') !== null
    } : null;

    return {
      title,
      pathText,
      desc,
      sectionHeaders,
      courseItems,
      guideItems,
      tabsCount,
      githubData
    };
  });

  console.log('Content Audit:', JSON.stringify(contentAudit, null, 2));

  // Screenshot in Midnight desktop
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'about_redesign_desktop_midnight.png'),
    fullPage: false
  });

  // 2. Test themes
  const themes = ['daylight', 'blush', 'oceanic', 'carbon', 'amber'];
  for (const t of themes) {
    await page.evaluate((theme) => {
      document.body.className = `theme-${theme}`;
      localStorage.setItem('zc_theme', theme);
    }, t);
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `about_redesign_theme_${t}.png`),
      fullPage: false
    });
    console.log(`Captured screenshot for theme: ${t}`);
  }

  // Restore midnight
  await page.evaluate(() => {
    document.body.className = 'theme-midnight';
    localStorage.setItem('zc_theme', 'midnight');
  });

  // 3. Test responsive mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(300);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'about_redesign_mobile_375.png'),
    fullPage: false
  });
  console.log('Captured mobile screenshot.');

  // Reset viewport
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);

  // 4. Test keyboard closing with Escape
  console.log('Testing Escape key closing...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const isClosedAfterEsc = (await page.locator('.zc-about-modal').count()) === 0;
  console.log('Closed after Escape:', isClosedAfterEsc);

  // Re-open and test backdrop click
  console.log('Testing Backdrop click closing...');
  await openAboutModal();
  await page.waitForTimeout(200);
  // Click top-left of overlay
  await page.mouse.click(10, 10);
  await page.waitForTimeout(400);
  const isClosedAfterBackdrop = (await page.locator('.zc-about-modal').count()) === 0;
  console.log('Closed after Backdrop click:', isClosedAfterBackdrop);

  // Re-open and test Dismiss button
  console.log('Testing Dismiss button closing...');
  await openAboutModal();
  await page.waitForTimeout(200);
  await page.locator('.zc-about-dismiss-btn').click();
  await page.waitForTimeout(400);
  const isClosedAfterBtn = (await page.locator('.zc-about-modal').count()) === 0;
  console.log('Closed after Dismiss button:', isClosedAfterBtn);

  const report = {
    contentAudit,
    accessibility: {
      isClosedAfterEsc,
      isClosedAfterBackdrop,
      isClosedAfterBtn
    }
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'about_redesign_report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('Verification completed successfully!');
  await browser.close();
})().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

