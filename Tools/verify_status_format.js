/**
 * verify_status_format.js
 * 1080×1920 status-format conversion checks.
 * Uses installed Edge via Playwright executablePath.
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

const STYLES = [
  { key: 'minimal', style: 'Modern Glassmorphic' },
  { key: 'human', style: 'Hero Focus' },
  { key: 'arch', style: 'Sacred Arch' },
  { key: 'cinematic', style: 'Cinematic Editorial' },
  { key: 'neon', style: 'Neon' }
];

const TESTS = [];
for (const s of STYLES) {
  TESTS.push({ label: s.key + '_short', style: s.style, msg: SHORT, signature: 'Dr. Atul' });
  TESTS.push({ label: s.key + '_normal', style: s.style, msg: NORMAL, signature: 'Dr. Atul' });
  TESTS.push({ label: s.key + '_long', style: s.style, msg: LONG, signature: 'Dr. Atul' });
}
TESTS.push({ label: 'human_blank_sig', style: 'Hero Focus', msg: NORMAL, signature: '' });
TESTS.push({ label: 'minimal_blank_sig', style: 'Modern Glassmorphic', msg: SHORT, signature: '' });
TESTS.push({ label: 'auto_kindness', style: 'Auto Theme', msg: NORMAL, signature: 'Dr. Atul' });

function pngSize(buf) {
  if (!buf || buf.length < 24) return { w: 0, h: 0 };
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function detectEdge() {
  for (const p of EDGE_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('Installed Edge not found');
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
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
      resolve({ server, url: 'http://127.0.0.1:' + server.address().port + '/index.html' });
    });
  });
}

(async () => {
  const EDGE = detectEdge();
  console.log('Browser:', EDGE);
  const { server, url } = await startServer();
  console.log('Serving', url);

  const browser = await chromium.launch({ headless: false, executablePath: EDGE, args: ['--no-first-run'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 } });
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
  await page.waitForTimeout(2800);
  await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());
  await page.waitForTimeout(400);

  const results = [];

  async function applyAndRender(msg, sig, style) {
    await page.evaluate(([m, s, st]) => {
      const dateEl = document.getElementById('date');
      if (dateEl) {
        dateEl.value = '2026-08-19';
        dateEl.dispatchEvent(new Event('input', { bubbles: true }));
        dateEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      for (const [id, val] of [['occasionEn', 'Kindness Day'], ['messageEn', m], ['signature', s]]) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const sel = document.getElementById('style');
      if (sel) sel.value = st;
      document.querySelectorAll('#posterQuickChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.style === st);
      });
      if (typeof render === 'function') render();
    }, [msg, sig, style]);
    await page.waitForTimeout(1700);
  }

  for (const t of TESTS) {
    console.log('\n--- ' + t.label + ' ---');
    const eBefore = errs.length;
    await applyAndRender(t.msg, t.signature, t.style);
    const status = await page.evaluate(() => (document.getElementById('status') || {}).textContent || '');
    console.log(' status:', status);

    const info = await page.evaluate(() => {
      const c = document.getElementById('poster');
      return {
        w: c ? c.width : 0,
        h: c ? c.height : 0,
        png: c ? c.toDataURL('image/png') : '',
        m: window.__posterQuoteMetrics || null
      };
    });

    const issues = [];
    if (info.w !== 1080 || info.h !== 1920) issues.push('canvas ' + info.w + 'x' + info.h);
    if (status.indexOf('1080') === -1 || status.indexOf('1920') === -1) issues.push('status size ' + status);
    if (t.style !== 'Auto Theme') {
      const token = t.style;
      if (status.indexOf(token) === -1) issues.push('wrong style status=' + status);
    }
    const jsErrs = errs.length - eBefore;
    if (jsErrs) issues.push('js errors ' + jsErrs);

    let pngW = 0, pngH = 0;
    if (info.png) {
      const buf = Buffer.from(info.png.split(',')[1], 'base64');
      const sz = pngSize(buf);
      pngW = sz.w; pngH = sz.h;
      if (sz.w !== 1080 || sz.h !== 1920) issues.push('export ' + sz.w + 'x' + sz.h);
      fs.writeFileSync(path.join(SHOTS, t.label + '_native.png'), buf);
    } else {
      issues.push('no png');
    }

    const m = info.m || {};
    if (t.style === 'Hero Focus') {
      if (m.ok === false) issues.push('human fitter ok=false');
      if (m.bottom > (m.quoteEndLimit || 1854) + 1) issues.push('human overflow');
      if (m.hasSig && m.sigY > 1848) issues.push('sig overflow');
    }
    if (t.style === 'Sacred Arch' && m.bottom > 1848) issues.push('arch overflow');
    if (t.style === 'Cinematic Editorial' && m.bottom > (m.quoteEnd || 1856) + 2) issues.push('cinematic overflow');
    if (t.style === 'Neon' && m.bottom > 1848) issues.push('neon overflow');
    if (t.style === 'Modern Glassmorphic' && m.bottom > 1848) issues.push('minimal overflow');

    try { await page.locator('#poster').first().screenshot({ path: path.join(SHOTS, t.label + '_canvas.png') }); } catch (_) {}

    const pass = issues.length === 0;
    results.push({ label: t.label, pass, issues, m: info.m, png: pngW + 'x' + pngH });
    console.log(pass ? ' PASS' : ' FAIL ' + issues.join('; '));
    if (info.m) console.log(' metrics', JSON.stringify(info.m));
    console.log(' export', pngW + 'x' + pngH);
  }

  console.log('\n--- chips ---');
  const chipNames = ['Auto Theme', 'Modern Glassmorphic', 'Hero Focus', 'Sacred Arch', 'Cinematic Editorial', 'Neon'];
  const chipIssues = [];
  for (const name of chipNames) {
    await page.evaluate(st => {
      const btn = document.querySelector('#posterQuickChips .chip[data-style="' + st + '"]');
      if (btn) btn.click();
    }, name);
    await page.waitForTimeout(900);
    const chipInfo = await page.evaluate(() => {
      const c = document.getElementById('poster');
      const status = (document.getElementById('status') || {}).textContent || '';
      const active = (document.querySelector('#posterQuickChips .chip.active') || {}).dataset || {};
      return { w: c.width, h: c.height, status, active: active.style };
    });
    if (chipInfo.w !== 1080 || chipInfo.h !== 1920) chipIssues.push(name + ' canvas ' + chipInfo.w + 'x' + chipInfo.h);
    if (chipInfo.active !== name) chipIssues.push(name + ' chip not active');
    console.log(' chip', name, chipInfo.status, chipInfo.w + 'x' + chipInfo.h);
  }
  results.push({ label: 'chips', pass: chipIssues.length === 0, issues: chipIssues });

  console.log('\n=== SUMMARY ===');
  let all = true;
  for (const r of results) {
    if (!r.pass) all = false;
    console.log(' ' + (r.pass ? 'PASS' : 'FAIL') + '  ' + r.label + (r.issues && r.issues.length ? '  ' + r.issues.join('; ') : ''));
  }
  console.log('Total JS errors (filtered):', errs.length);
  console.log(all && errs.length === 0 ? 'ALL PASSED' : 'FAILURES DETECTED');
  await page.waitForTimeout(1500);
  await browser.close();
  server.close();
  process.exit(all && errs.length === 0 ? 0 : 1);
})().catch(err => { console.error(err); process.exit(1); });
