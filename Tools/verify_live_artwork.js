/**
 * verify_live_artwork.js
 * Tests the LIVE GitHub Pages PWA in installed Edge.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const LIVE = 'https://atuldhuvad-cmd.github.io/Personal-Greeting/index.html?v=status-artwork-v1';
const ASSETS = [
  'https://atuldhuvad-cmd.github.io/Personal-Greeting/artwork/BuiltIn/theme-kindness.jpg',
  'https://atuldhuvad-cmd.github.io/Personal-Greeting/artwork/BuiltIn/theme-wisdom.jpg',
  'https://atuldhuvad-cmd.github.io/Personal-Greeting/artwork/BuiltIn/theme-courage.jpg',
  'https://atuldhuvad-cmd.github.io/Personal-Greeting/artwork/BuiltIn/theme-festival.jpg'
];
const SHOTS = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const SHORT = 'Be kind. Someone may need it more than you know.';

function detectEdge() {
  for (const p of EDGE_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('Installed Edge not found');
}

function httpHead(url) {
  return new Promise(resolve => {
    https.get(url, { method: 'HEAD' }, res => {
      resolve({ url, status: res.statusCode, type: res.headers['content-type'] || '', length: Number(res.headers['content-length'] || 0) });
    }).on('error', err => resolve({ url, status: 0, error: err.message }));
  });
}

(async () => {
  console.log('=== LIVE ASSET HTTP ===');
  const httpResults = [];
  for (const u of ASSETS) {
    const r = await httpHead(u);
    httpResults.push(r);
    console.log(r.status, r.type, r.length, u);
  }

  const EDGE = detectEdge();
  console.log('\nBrowser:', EDGE);
  const browser = await chromium.launch({ headless: false, executablePath: EDGE, args: ['--no-first-run'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 } });
  const page = await ctx.newPage();
  const errs = [];
  const skip = [/ServiceWorker/i, /null.*origin/i];
  const failedRes = [];
  page.on('console', m => {
    if (m.type() === 'error' && !skip.some(r => r.test(m.text()))) { errs.push(m.text()); console.log('CONSOLE ERR:', m.text()); }
  });
  page.on('pageerror', e => {
    if (!skip.some(r => r.test(e.message))) { errs.push(e.message); console.log('PAGE ERR:', e.message); }
  });
  page.on('response', res => {
    const u = res.url();
    if (u.includes('/artwork/') && res.status() >= 400) failedRes.push(res.status() + ' ' + u);
  });

  await page.goto(LIVE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3500);

  async function apply(style) {
    await page.evaluate(([msg, st]) => {
      const dateEl = document.getElementById('date');
      if (dateEl) {
        dateEl.value = '2026-08-19';
        dateEl.dispatchEvent(new Event('input', { bubbles: true }));
        dateEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      for (const [id, val] of [['occasionEn', 'Kindness Day'], ['messageEn', msg], ['signature', 'Dr. Atul']]) {
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
    }, [SHORT, style]);
    await page.waitForTimeout(2200);
    await page.evaluate(() => { if (typeof render === 'function') render(); });
    await page.waitForTimeout(800);
  }

  const styles = [
    { key: 'human', style: 'Hero Focus' },
    { key: 'arch', style: 'Sacred Arch' },
    { key: 'cinematic', style: 'Cinematic Editorial' }
  ];
  const results = [];
  for (const t of styles) {
    console.log('\n--- live ' + t.key + ' ---');
    const eBefore = errs.length;
    await apply(t.style);
    const info = await page.evaluate(() => {
      const c = document.getElementById('poster');
      const cache = window.THEME_PHOTO_CACHE || {};
      let src = '';
      try { src = typeof pickThemePhotoSrc === 'function' ? pickThemePhotoSrc() : ''; } catch (_) {}
      const img = (typeof getThemePhotoImage === 'function') ? getThemePhotoImage() : null;
      const hero = (typeof resolveHeroImage === 'function') ? resolveHeroImage() : { img: null };
      let sample = null;
      if (c) {
        const x = 540, y = (tStyle => tStyle === 'Hero Focus' ? 220 : (tStyle === 'Sacred Arch' ? 220 : 1400))(document.getElementById('style').value);
        const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
        sample = [d[0], d[1], d[2]];
      }
      const cacheKeys = Object.keys(typeof THEME_PHOTO_CACHE !== 'undefined' ? THEME_PHOTO_CACHE : {});
      const cacheState = cacheKeys.map(k => {
        const im = THEME_PHOTO_CACHE[k];
        return { k, w: im && im.naturalWidth, h: im && im.naturalHeight, complete: !!(im && im.complete), failed: !!(im && im._failed) };
      });
      return {
        w: c ? c.width : 0,
        h: c ? c.height : 0,
        status: (document.getElementById('status') || {}).textContent || '',
        src,
        heroHasImg: !!(hero && hero.img),
        imgW: img ? img.naturalWidth : 0,
        imgH: img ? img.naturalHeight : 0,
        failed: !!(img && img._failed),
        complete: !!(img && img.complete),
        cacheState,
        sample
      };
    });
    const issues = [];
    if (info.w !== 1080 || info.h !== 1920) issues.push('canvas ' + info.w + 'x' + info.h);
    if (info.failed) issues.push('image _failed');
    if (!info.heroHasImg) issues.push('resolveHeroImage has no img (generated fallback)');
    if (!info.imgW) issues.push('naturalWidth 0');
    if (!info.src || info.src.indexOf('artwork/BuiltIn/') === -1) issues.push('unexpected src ' + info.src);
    const jsErrs = errs.length - eBefore;
    if (jsErrs) issues.push('js errors ' + jsErrs);
    try { await page.locator('#poster').first().screenshot({ path: path.join(SHOTS, 'live_' + t.key + '_canvas.png') }); } catch (_) {}
    const png = await page.evaluate(() => document.getElementById('poster').toDataURL('image/png'));
    fs.writeFileSync(path.join(SHOTS, 'live_' + t.key + '_native.png'), Buffer.from(png.split(',')[1], 'base64'));
    console.log(JSON.stringify(info, null, 2));
    console.log(issues.length ? 'FAIL ' + issues.join('; ') : 'PASS');
    results.push({ key: t.key, pass: issues.length === 0, issues, info });
  }

  console.log('\n=== SUMMARY ===');
  console.log('HTTP assets:', httpResults.map(r => r.status + ' ' + r.length).join(', '));
  console.log('Failed artwork responses:', failedRes.length ? failedRes.join(' | ') : 'none');
  console.log('JS errors:', errs.length, errs);
  let all = true;
  for (const r of results) {
    if (!r.pass) all = false;
    console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.key + (r.issues.length ? '  ' + r.issues.join('; ') : ''));
  }
  await page.waitForTimeout(1200);
  await browser.close();
  process.exit(all && errs.length === 0 && httpResults.every(r => r.status === 200) ? 0 : 1);
})().catch(err => { console.error(err); process.exit(1); });
