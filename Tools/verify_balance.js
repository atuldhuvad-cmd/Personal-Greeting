/**
 * verify_balance.js — Final balance review verification
 * Tests Human, Arch, Cinematic with Kindness Day content (long + short).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BROWSER_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
const SHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

function detectBrowser() {
  for (const p of BROWSER_PATHS) { if (fs.existsSync(p)) { console.log('Browser:', p); return p; } }
  throw new Error('No browser found');
}

const FILE_URL = 'file:///D:/India%20Inspiration%20Studio/index.html';
const LONG = "Gentle words often reach places that advice cannot. Speak today in a way that leaves the other person lighter. Kindness does not need to be dramatic to matter; even a patient response, a thoughtful pause, or a few sincere words can change the direction of someone's entire day.";
const SHORT = 'Be kind. Someone may need it more than you know.';

const TESTS = [
  { label: 'human_long',      style: 'Hero Focus',          msg: LONG  },
  { label: 'human_short',     style: 'Hero Focus',          msg: SHORT },
  { label: 'arch_long',       style: 'Sacred Arch',         msg: LONG  },
  { label: 'arch_short',      style: 'Sacred Arch',         msg: SHORT },
  { label: 'cinematic_long',  style: 'Cinematic Editorial', msg: LONG  },
  { label: 'cinematic_short', style: 'Cinematic Editorial', msg: SHORT },
];

async function fill(page, msg) {
  for (const [id, val] of [['date','2026-08-19'],['occasionEn','Kindness Day'],['messageEn',msg],['signature','Dr. Atul']]) {
    await page.evaluate((args) => {
      const el = document.getElementById(args[0]); if (!el) return;
      el.value = args[1]; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
    }, [id, val]);
  }
  await page.waitForTimeout(300);
}

async function pickStyle(page, name) {
  await page.evaluate(n => { const c = document.querySelector('[data-style="'+n+'"]'); if (c) c.click(); }, name);
  await page.waitForTimeout(1800);
}

(async () => {
  const executablePath = detectBrowser();
  const browser = await chromium.launch({ headless: false, executablePath, args: ['--no-first-run','--allow-file-access-from-files'] });
  const ctx2 = await browser.newContext({ viewport: { width: 1400, height: 960 } });
  const page = await ctx2.newPage();
  const errs = [];
  const skip = [/ServiceWorker/i, /null.*origin/i];
  page.on('console', m => { if (m.type()==='error' && !skip.some(r=>r.test(m.text()))) { errs.push(m.text()); console.log('ERR:',m.text()); } });
  page.on('pageerror', e => { if (!skip.some(r=>r.test(e.message))) { errs.push(e.message); console.log('PAGEERR:',e.message); } });

  await page.goto(FILE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const results = [];
  for (const t of TESTS) {
    console.log('\n---', t.label, '('+t.msg.length+'ch)');
    const eBefore = errs.length;
    await fill(page, t.msg);
    await pickStyle(page, t.style);
    const cv = await page.evaluate(() => { const c = document.querySelector('canvas'); return c ? {w:c.width,h:c.height} : null; });
    const ok = cv && cv.w===1080 && cv.h===1350 && errs.length===eBefore;
    results.push({ label: t.label, cv, errors: errs.length - eBefore, pass: ok });
    await page.screenshot({ path: path.join(SHOTS_DIR, t.label+'.png') });
    try { await page.locator('canvas').first().screenshot({ path: path.join(SHOTS_DIR, t.label+'_canvas.png') }); } catch(_){}
    console.log(' Canvas:', cv ? cv.w+'x'+cv.h : 'NONE', ok?'PASS':'FAIL');
  }

  console.log('\n=== SUMMARY ===');
  let all = true;
  for (const r of results) {
    if (!r.pass) all = false;
    console.log(' '+(r.pass?'PASS':'FAIL'), r.label, r.cv?r.cv.w+'x'+r.cv.h:'NO CANVAS', 'errors:'+r.errors);
  }
  console.log('Total filtered errors:', errs.length);
  console.log(all ? 'ALL PASSED' : 'FAILURES DETECTED');
  console.log('Staying open 25s...');
  await page.waitForTimeout(25000);
  await browser.close();
  console.log('Done. Screenshots:', SHOTS_DIR);
})();
