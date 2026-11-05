const pw = require('C:/Users/zero/AppData/Local/ms-playwright-go/1.57.0/package');
const chromePath = 'C:/Users/zero/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/zero/.gemini/antigravity/brain/d44c83c7-12f9-4157-99e1-e2ede6ead940';

// Helper to compute relative luminance and contrast ratio according to WCAG 2.1
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(str) {
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
}

async function run() {
  const browser = await pw.chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = {
    buttonRename: null,
    modalOpens: false,
    themeButtonTests: {},
    contrastAudit: {}
  };

  console.log('Navigating to ZeroCoder...');
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
  console.log('Dashboard loaded.');

  // Navigate to cheatsheet tool view
  await page.goto('http://localhost:5173/?course=programming&term=mid&tool=cheatsheet');
  await page.waitForSelector('.zc-cs-modal-btn', { timeout: 10000 });
  console.log('Cheatsheet workspace rendered.');

  // 1. Verify "Open Cheatsheet" button
  const cheatsheetBtn = page.locator('.zc-cs-modal-btn');
  const btnCount = await cheatsheetBtn.count();
  const oldBtnCount = await page.locator('button:has-text("Open Full Cheatsheet Modal")').count();
  const btnText = btnCount > 0 ? await cheatsheetBtn.first().innerText() : '';

  results.buttonRename = {
    foundNew: btnCount > 0,
    foundOld: oldBtnCount > 0,
    text: btnText.trim()
  };
  console.log('Cheatsheet button check:', results.buttonRename);

  // Capture screenshot of Cheatsheet workspace
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'button_polish_cheatsheet_workspace.png'),
    fullPage: false
  });

  // 2. Test clicking "Open Cheatsheet"
  if (btnCount > 0) {
    await cheatsheetBtn.first().click();
    await page.waitForTimeout(600);
    const modalVisible = (await page.locator('.modal-backdrop, .modal-content, [role="dialog"]').count() > 0) ||
                         (await page.getByText('Python Cheatsheet').count() > 0);
    results.modalOpens = modalVisible;
    console.log('Modal opened on click:', modalVisible);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'button_polish_cheatsheet_modal.png'),
      fullPage: false
    });

    // Close modal by clicking close button or pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 3. Test button typography and colors across all 6 themes
  const themes = ['midnight', 'daylight', 'blush', 'oceanic', 'carbon', 'amber'];

  for (const theme of themes) {
    // Switch theme via localStorage or body class
    await page.evaluate((t) => {
      document.body.className = `theme-${t}`;
      localStorage.setItem('zc_theme', t);
    }, theme);

    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    // Evaluate primary button styles
    const buttonStyles = await page.evaluate(() => {
      // Find a button-primary
      const btn = document.querySelector('.button-primary');
      if (!btn) return null;

      const comp = window.getComputedStyle(btn);
      const icon = btn.querySelector('svg');
      const iconComp = icon ? window.getComputedStyle(icon) : null;

      return {
        bg: comp.backgroundColor,
        color: comp.color,
        fontSize: comp.fontSize,
        fontWeight: comp.fontWeight,
        boxShadow: comp.boxShadow,
        textShadow: comp.textShadow,
        iconStroke: iconComp ? iconComp.stroke : null,
        iconColor: iconComp ? iconComp.color : null
      };
    });

    // Also get CSS variables
    const cssVars = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      return {
        accentPrimary: body.getPropertyValue('--accent-primary').trim() || root.getPropertyValue('--accent-primary').trim(),
        btnPrimaryBg: body.getPropertyValue('--btn-primary-bg').trim() || root.getPropertyValue('--btn-primary-bg').trim(),
        textOnAccent: body.getPropertyValue('--text-on-accent').trim() || root.getPropertyValue('--text-on-accent').trim()
      };
    });

    if (buttonStyles) {
      const bgRgb = parseRgb(buttonStyles.bg);
      const textRgb = parseRgb(buttonStyles.color);
      const contrast = getContrastRatio(bgRgb, textRgb);

      results.themeButtonTests[theme] = {
        buttonStyles,
        cssVars,
        contrastRatio: contrast.toFixed(2),
        wcagAAMeet: contrast >= 4.5
      };

      console.log(`[Theme: ${theme}]`);
      console.log(`  Button BG: ${buttonStyles.bg} | Text: ${buttonStyles.color}`);
      console.log(`  Contrast Ratio: ${contrast.toFixed(2)}:1 (Pass AA: ${contrast >= 4.5})`);
    }

    // Capture theme screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `button_polish_theme_${theme}.png`),
      fullPage: false
    });
  }

  // 4. Also inspect Workspace (/workspace/ftds_1) button typography
  await page.goto('http://localhost:5173/workspace/ftds_1');
  await page.waitForSelector('.workspace-header, .cm-editor, .button-primary', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Switch to Midnight theme
  await page.evaluate(() => {
    document.body.className = 'theme-midnight';
  });
  await page.waitForTimeout(300);

  const wsButtons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.button-primary, .button-ai, .segmented-pill-btn.active'));
    return btns.map(b => {
      const comp = window.getComputedStyle(b);
      return {
        tag: b.tagName,
        className: b.className,
        text: b.innerText.trim().slice(0, 30),
        bg: comp.backgroundColor,
        color: comp.color
      };
    });
  });

  results.workspaceButtons = wsButtons;
  console.log('Workspace primary buttons:', wsButtons);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'button_polish_workspace_p1.png'),
    fullPage: false
  });

  // Write verification report
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'button_polish_verification_report.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('Verification completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
