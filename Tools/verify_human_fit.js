/**
 * verify_human_fit.js
 * Stress-tests Hero Focus / Human measured fitting in installed Edge.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const SHORT = 'Be kind. Someone may need it more than you know.';
const NORMAL = 'Gentle words often reach places that advice cannot. Speak today in a way that leaves the other person lighter.';
const LONG = "Gentle words often reach places that advice cannot. Speak today in a way that leaves the other person lighter. Kindness does not need to be dramatic to matter; even a patient response, a thoughtful pause, or a few sincere words can change the direction of someone's entire day.";
const VERY_LONG = "Gentle words often reach places that advice cannot. Speak today in a way that leaves the other person lighter. Kindness does not need to be dramatic to matter; even a patient response, a thoughtful pause, or a few sincere words can change the direction of someone's entire day. A quiet gesture, offered without expectation, can stay with a person long after the moment has passed and remind them they were seen with care.";

const TESTS = [
  { label: 'human_short', msg: SHORT, signature: 'Dr. Atul' },
  { label: 'human_normal', msg: NORMAL, signature: 'Dr. Atul' },
  { label: 'human_long', msg: LONG, signature: 'Dr. Atul' },
  { label: 'human_verylong', msg: VERY_LONG, signature: 'Dr. Atul' },
  { label: 'human_blank_sig', msg: NORMAL, signature: '' }
];

function detectEdge() {
  for (const p of EDGE_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('Installed Edge not found');
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/App/index.html';
      const filePath = path.join(ROOT, urlPath.replace(/\//g, path.sep));
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, url: 'http://127.0.0.1:' + server.address().port + '/App/index.html' });
    });
  });
}

async function fill(page, msg, signature) {
  for (const [id, val] of [['date', '2026-08-19'], ['occasionEn', 'Kindness Day'], ['messageEn', msg], ['signature', signature]]) {
    await page.evaluate(([i, v]) => {
      const el = document.getElementById(i);
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, val]);
  }
  await page.waitForTimeout(300);
}

(async () => {
  const EDGE = detectEdge();
  console.log('Browser:', EDGE);
  console.log('VERY_LONG chars:', VERY_LONG.length);
  const { server, url } = await startServer();
  console.log('Serving', url);

  const browser = await chromium.launch({ headless: false, executablePath: EDGE, args: ['--no-first-run'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 960 } });
  const page = await ctx.newPage();
  const errs = [];
  const skip = [/ServiceWorker/i, /null.*origin/i, /Failed to load resource/i];
  page.on('console', m => {
    if (m.type() === 'error' && !skip.some(r => r.test(m.text()))) { errs.push(m.text()); console.log('CONSOLE ERR:', m.text()); }
  });
  page.on('pageerror', e => {
    if (!skip.some(r => r.test(e.message))) { errs.push(e.message); console.log('PAGE ERR:', e.message); }
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const results = [];
  for (const t of TESTS) {
    console.log('\n--- ' + t.label + ' (' + t.msg.length + 'ch, sig=' + JSON.stringify(t.signature) + ') ---');
    const eBefore = errs.length;
    await fill(page, t.msg, t.signature);
    await page.evaluate(() => {
      const c = document.querySelector('[data-style="Hero Focus"]');
      if (c) c.click();
    });
    await page.waitForTimeout(1800);

    const info = await page.evaluate(() => {
      const c = document.getElementById('poster');
      const m = window.__posterQuoteMetrics || null;
      let native = null;
      if (c) native = { w: c.width, h: c.height, png: c.toDataURL('image/png') };
      return { m, native: native ? { w: native.w, h: native.h, png: native.png } : null };
    });

    const issues = [];
    const m = info.m;
    if (!info.native || info.native.w !== 1080 || info.native.h !== 1350) issues.push('canvas not 1080x1350');
    if (!m) issues.push('no metrics');
    else {
      if (!m.ok) issues.push('fitter ok=false');
      if (m.bottom > m.quoteEndLimit + 1) issues.push('quote overflow bottom=' + m.bottom + ' limit=' + m.quoteEndLimit);
      if (m.quoteY - m.firstAscent < m.themeBottom + 8) issues.push('theme overlap top=' + (m.quoteY - m.firstAscent) + ' themeBottom=' + m.themeBottom);
      if (m.maxLineW > 900.5) issues.push('horizontal clip width=' + m.maxLineW);
      if (m.hasSig && m.sigY > 1288) issues.push('signature below safe y=' + m.sigY);
      if (m.hasSig && m.sigY < m.bottom) issues.push('signature overlaps quote');
      if (m.bottom > 1320) issues.push('absolute overflow ' + m.bottom);
    }
    const jsErrs = errs.length - eBefore;
    if (jsErrs) issues.push('js errors ' + jsErrs);

    if (info.native && info.native.png) {
      const buf = Buffer.from(info.native.png.split(',')[1], 'base64');
      fs.writeFileSync(path.join(SHOTS, t.label + '_native.png'), buf);
    }
    try { await page.locator('#poster').first().screenshot({ path: path.join(SHOTS, t.label + '_canvas.png') }); } catch (_) {}
    await page.screenshot({ path: path.join(SHOTS, t.label + '.png') });

    const pass = issues.length === 0;
    results.push({ label: t.label, m, issues, pass, chars: t.msg.length });
    console.log(' Metrics:', JSON.stringify(m));
    console.log(pass ? ' PASS' : ' FAIL  ' + issues.join('; '));
  }

  console.log('\n=== SUMMARY ===');
  let all = true;
  for (const r of results) {
    if (!r.pass) all = false;
    console.log(' ' + (r.pass ? 'PASS' : 'FAIL') + '  ' + r.label.padEnd(16) + (r.issues.length ? ' | ' + r.issues.join('; ') : ''));
  }
  console.log('Total JS errors (filtered):', errs.length);
  console.log(all ? 'ALL PASSED' : 'FAILURES DETECTED');
  await page.waitForTimeout(4000);
  await browser.close();
  server.close();
  process.exit(all && errs.length === 0 ? 0 : 1);
})().catch(err => { console.error(err); process.exit(1); });
