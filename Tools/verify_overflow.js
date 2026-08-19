/**
 * verify_overflow.js
 * Playwright test using installed Edge or Chrome (no Playwright CDN download).
 * Tests Human (Hero Focus) and Arch (Sacred Arch) for overflow with long/short messages.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BROWSER_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function detectBrowser() {
  for (const p of BROWSER_PATHS) {
    if (fs.existsSync(p)) { console.log('✓ Browser found:', p); return p; }
  }
  throw new Error('No supported browser found. Checked: ' + BROWSER_PATHS.join(', '));
}

const FILE_URL = 'file:///D:/India%20Inspiration%20Studio/index.html';

const LONG_MSG  = "Gentle words often reach places that advice cannot. Speak today in a way that leaves the other person lighter. Kindness does not need to be dramatic to matter; even a patient response, a thoughtful pause, or a few sincere words can change the direction of someone's entire day.";
const NORMAL_MSG = 'Let your words today be a gift—not to impress, but to uplift. Kindness is always the right language.';
const SHORT_MSG  = 'Be kind. Someone may need it more than you know.';

const TEST_CASES = [
  { label: 'human_long',   style: 'Hero Focus',   msg: LONG_MSG,   date: '2026-08-19', theme: 'Kindness Day', sig: 'Dr. Atul' },
  { label: 'human_normal', style: 'Hero Focus',   msg: NORMAL_MSG, date: '2026-08-19', theme: 'Kindness Day', sig: 'Dr. Atul' },
  { label: 'human_short',  style: 'Hero Focus',   msg: SHORT_MSG,  date: '2026-08-19', theme: 'Kindness Day', sig: 'Dr. Atul' },
  { label: 'arch_long',    style: 'Sacred Arch',  msg: LONG_MSG,   date: '2026-08-19', theme: 'Kindness Day', sig: 'Dr. Atul' },
  { label: 'arch_normal',  style: 'Sacred Arch',  msg: NORMAL_MSG, date: '2026-08-19', theme: 'Kindness Day', sig: 'Dr. Atul' },
  { label: 'arch_short',   style: 'Sacred Arch',  msg: SHORT_MSG,  date: '2026-08-19', theme: 'Kindness Day', sig: 'Dr. Atul' },
];

async function fillFields(page, tc) {
  await page.evaluate((v) => {
    const el = document.getElementById('date');
    if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, tc.date);
  await page.evaluate((v) => {
    const el = document.getElementById('occasionEn');
    if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, tc.theme);
  await page.evaluate((v) => {
    const el = document.getElementById('messageEn');
    if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, tc.msg);
  await page.evaluate((v) => {
    const el = document.getElementById('signature');
    if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  }, tc.sig);
  await page.waitForTimeout(400);
}

async function selectStyle(page, styleName) {
  const clicked = await page.evaluate((name) => {
    const chip = document.querySelector('[data-style="' + name + '"]');
    if (chip) { chip.click(); return true; }
    return false;
  }, styleName);
  if (!clicked) throw new Error('Could not find chip for style: ' + styleName);
  await page.waitForTimeout(1800);
}

async function getCanvasInfo(page) {
  return await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { found: false, width: 0, height: 0 };
    return { found: true, width: canvas.width, height: canvas.height,
             displayWidth: canvas.offsetWidth, displayHeight: canvas.offsetHeight };
  });
}

(async () => {
  const executablePath = detectBrowser();
  console.log('\n=== India Inspiration Studio — Overflow Verification ===\n');

  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      executablePath,
      args: ['--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files'],
    });
  } catch (e) {
    console.error('Failed to launch browser:', e.message);
    process.exit(1);
  }

  const context = await browser.newContext({ viewport: { width: 1400, height: 960 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const ignoredPatterns = [/ServiceWorker/i, /null.*origin/i, /protocol.*null/i];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!ignoredPatterns.some(r => r.test(txt))) {
        consoleErrors.push('[console.error] ' + txt);
        console.log('  CONSOLE ERR:', txt);
      }
    }
  });
  page.on('pageerror', err => {
    const txt = err.message;
    if (!ignoredPatterns.some(r => r.test(txt))) {
      consoleErrors.push('[pageerror] ' + txt);
      console.log('  PAGE ERROR:', txt);
    }
  });

  console.log('Loading:', FILE_URL);
  await page.goto(FILE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const results = [];

  for (const tc of TEST_CASES) {
    console.log('\n--- Testing: ' + tc.label + ' (msg length: ' + tc.msg.length + ' chars) ---');
    const errorsBefore = consoleErrors.length;

    await fillFields(page, tc);
    await selectStyle(page, tc.style);

    const canvas = await getCanvasInfo(page);
    const errorsForTest = consoleErrors.slice(errorsBefore);

    const screenshotPath = path.join(SCREENSHOTS_DIR, tc.label + '.png');
    await page.screenshot({ path: screenshotPath });

    try {
      const canvasEl = page.locator('canvas').first();
      await canvasEl.screenshot({ path: path.join(SCREENSHOTS_DIR, tc.label + '_canvas.png') });
    } catch(_) {}

    const pass = canvas.found && canvas.width === 1080 && canvas.height === 1350 && errorsForTest.length === 0;
    results.push({ label: tc.label, style: tc.style, msgLen: tc.msg.length, canvas, errors: errorsForTest, pass });

    console.log('  Canvas: ' + canvas.width + 'x' + canvas.height + ' -> ' + (canvas.width === 1080 && canvas.height === 1350 ? 'OK 1080x1350' : 'WRONG SIZE'));
    console.log('  JS errors: ' + (errorsForTest.length === 0 ? 'None' : errorsForTest.join('; ')));
    console.log('  Screenshot: ' + screenshotPath);
  }

  console.log('\n=== FINAL SUMMARY ===');
  let allPass = true;
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) allPass = false;
    console.log('  ' + status + '  ' + r.label + ' | canvas ' + r.canvas.width + 'x' + r.canvas.height + ' | errors: ' + r.errors.length);
  }
  console.log('\nTotal JS errors (filtered): ' + consoleErrors.length);
  console.log(allPass ? '\nALL TESTS PASSED' : '\nSOME TESTS FAILED');
  console.log('\nBrowser stays open 25s for manual inspection...');
  await page.waitForTimeout(25000);
  await browser.close();
  console.log('Done. Screenshots in: ' + SCREENSHOTS_DIR);
})();
