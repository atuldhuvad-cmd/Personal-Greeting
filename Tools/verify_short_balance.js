/**
 * verify_short_balance.js
 * Tests Human and Arch with short/normal/long messages.
 * Uses installed Edge via Playwright executablePath.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'.replace(' (x86)', ''),
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const SHOTS = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'App');

const SHORT = 'Be kind. Someone may need it more than you know.';
const NORMAL = 'Gentle words often reach places that advice cannot. Speak today in a way that leaves the other person lighter.';
const LONG = "Gentle words often reach places that advice cannot. Speak today in a way that leaves the other person lighter. Kindness does not need to be dramatic to matter; even a patient response, a thoughtful pause, or a few sincere words can change the direction of someone's entire day.";

const TESTS = [
  { label: 'human_short',  style: 'Hero Focus',  msg: SHORT,  expectShort: true },
  { label: 'human_normal', style: 'Hero Focus',  msg: NORMAL, expectShort: false },
  { label: 'human_long',   style: 'Hero Focus',  msg: LONG,   expectShort: false },
  { label: 'arch_short',   style: 'Sacred Arch', msg: SHORT,  expectShort: true },
  { label: 'arch_normal', style: 'Sacred Arch', msg: NORMAL, expectShort: false },
  { label: 'arch_long',   style: 'Sacred Arch', msg: LONG,   expectShort: false },
];

function detectEdge() {
  for (const p of EDGE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Installed Edge not found');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/App/index.html';
      const filePath = path.join(ROOT, urlPath.replace(/\//g, path.sep));
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403); res.end('forbidden'); return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        const types = {
          '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
          '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json'
        };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, url: `http://127.0.0.1:${server.address().port}/App/index.html` });
    });
  });
}

async function fill(page, msg) {
  for (const [id, val] of [
    ['date', '2026-08-19'], ['occasionEn', 'Kindness Day'],
    ['messageEn', msg], ['signature', 'Dr. Atul']
  ]) {
    await page.evaluate(([i, v]) => {
      const el = document.getElementById(i);
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, val]);
  }
  await page.waitForTimeout(350);
}

async function pick(page, name) {
  await page.evaluate(n => {
    const c = document.querySelector('[data-style="' + n + '"]');
    if (c) c.click();
  }, name);
  await page.waitForTimeout(1800);
}

function judge(t, m, exportInfo) {
  const issues = [];
  if (!m) {
    issues.push('no metrics');
    return issues;
  }
  if (m.isShort !== t.expectShort) issues.push('isShort=' + m.isShort + ' expected ' + t.expectShort);
  if (m.bottom > 1320) issues.push('bottom overflow ' + m.bottom);
  if (t.style === 'Hero Focus') {
    if (t.expectShort) {
      if (m.leadSize > 48) issues.push('Human short lead oversized ' + m.leadSize);
      if (m.restSize > 38) issues.push('Human short rest oversized ' + m.restSize);
      if (m.leadLh > Math.round(48 * 1.24) + 2) issues.push('Human short leading inflated ' + m.leadLh);
    } else {
      if (m.leadSize < 30 || m.leadSize > 52) issues.push('Human non-short lead out of range ' + m.leadSize);
    }
  }
  if (t.style === 'Sacred Arch') {
    if (t.expectShort) {
      if (!(m.drawY > m.quoteStartY + 40)) issues.push('Arch short not rebalanced drawY=' + m.drawY + ' start=' + m.quoteStartY);
      const lowerSlack = (m.quoteStartY + m.quoteMaxH) - m.bottom;
      const upperSlack = m.drawY - m.quoteStartY;
      if (lowerSlack > upperSlack * 2.4) issues.push('Arch short still too much lower space lower=' + lowerSlack + ' upper=' + upperSlack);
    } else {
      if (m.drawY !== m.quoteStartY) issues.push('Arch non-short not top-anchored drawY=' + m.drawY);
    }
  }
  if (!exportInfo || exportInfo.w !== 1080 || exportInfo.h !== 1350) {
    issues.push('export not 1080x1350 ' + JSON.stringify(exportInfo));
  }
  return issues;
}

(async () => {
  const EDGE = detectEdge();
  console.log('Browser:', EDGE);
  console.log('App dir:', APP_DIR);

  const { server, url } = await startServer();
  console.log('Serving', url);

  const browser = await chromium.launch({
    headless: false,
    executablePath: EDGE,
    args: ['--no-first-run']
  });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 960 } });
  const page = await ctx.newPage();

  const errs = [];
  const skip = [/ServiceWorker/i, /null.*origin/i, /Failed to load resource/i];
  page.on('console', m => {
    if (m.type() === 'error' && !skip.some(r => r.test(m.text()))) {
      errs.push(m.text()); console.log('CONSOLE ERR:', m.text());
    }
  });
  page.on('pageerror', e => {
    if (!skip.some(r => r.test(e.message))) {
      errs.push(e.message); console.log('PAGE ERR:', e.message);
    }
  });

  console.log('\nLoading', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const results = [];
  for (const t of TESTS) {
    console.log('\n--- ' + t.label + ' (' + t.msg.length + 'ch) ---');
    const eBefore = errs.length;
    await fill(page, t.msg);
    await pick(page, t.style);

    const info = await page.evaluate(() => {
      const c = document.querySelector('#poster');
      const m = window.__posterQuoteMetrics || null;
      let exportInfo = null;
      if (c) {
        exportInfo = { w: c.width, h: c.height, dataUrlLen: c.toDataURL('image/png').length };
      }
      return { cv: c ? { w: c.width, h: c.height } : null, metrics: m, exportInfo };
    });

    const shot = path.join(SHOTS, t.label + '_canvas.png');
    try { await page.locator('#poster').first().screenshot({ path: shot }); } catch (_) {}
    await page.screenshot({ path: path.join(SHOTS, t.label + '.png') });

    const issues = judge(t, info.metrics, info.exportInfo);
    const jsErrs = errs.length - eBefore;
    if (jsErrs) issues.push('js errors ' + jsErrs);
    if (!(info.cv && info.cv.w === 1080 && info.cv.h === 1350)) issues.push('canvas not 1080x1350');

    const pass = issues.length === 0;
    results.push({ ...t, cv: info.cv, metrics: info.metrics, issues, pass });
    console.log(' Canvas:', info.cv ? info.cv.w + 'x' + info.cv.h : 'NONE');
    console.log(' Metrics:', JSON.stringify(info.metrics));
    console.log(' Export:', JSON.stringify(info.exportInfo));
    console.log(pass ? ' PASS' : ' FAIL  ' + issues.join('; '));
  }

  console.log('\n=== SUMMARY ===');
  let all = true;
  for (const r of results) {
    if (!r.pass) all = false;
    console.log(' ' + (r.pass ? 'PASS' : 'FAIL') + '  ' + r.label.padEnd(14) +
      ' | ' + (r.cv ? r.cv.w + 'x' + r.cv.h : 'NO CANVAS') +
      (r.issues.length ? ' | ' + r.issues.join('; ') : ''));
  }
  console.log('Total JS errors (filtered):', errs.length);
  console.log(all ? 'ALL PASSED' : 'FAILURES DETECTED');
  console.log('\nStaying open 8s for inspection...');
  await page.waitForTimeout(8000);
  await browser.close();
  server.close();
  console.log('Done. Screenshots:', SHOTS);
  process.exit(all && errs.length === 0 ? 0 : 1);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
