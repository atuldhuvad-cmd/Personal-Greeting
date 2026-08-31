const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], KEYS = { settings: 'wishcraft_settings_v2', cards: 'wishcraft_cards_v2', draft: 'wishcraft_working_v2' };
// Message/tagline/signature text is always drawn in a readable sans-serif on
// canvas exports, matching the DOM's forced font-family in fixes.css --
// never the card's decorative font (e.g. font:'display' = Impact/Arial
// Black), which is only appropriate for a short bold title. Used for both
// measuring (so wrapping matches what's actually drawn) and drawing.
const BODY_FONT = 'Inter, Arial, sans-serif';

// Whether a hex color reads as "light" (needs a dark backdrop to stay
// readable). Used to pick a dark vs pale text-panel background for
// panel:true templates -- driven by the template's own textColor (the
// actual signal for what backdrop it needs), not by pattern-matching the
// background gradient string, which produces false positives (e.g.
// bestuvaras-royal's background contains '#78...' so a background-substring
// heuristic flags it as "dark", but its text is dark-on-purpose for a pale
// panel -- switching that panel dark too would make the text unreadable).
function isLightColor(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return false;
  const r = parseInt(full.slice(0, 2), 16), g = parseInt(full.slice(2, 4), 16), b = parseInt(full.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
}
const state = {
  occasion: 'birthday',
  tone: 'joyful',
  messageIndex: 0,
  fields: {},
  template: 'festive',
  festivalFilter: 'General',
  photo: null,
  photoCfg: { zoom: 100, panX: 0, panY: 0, frameSize: 32, frameY: 8, shape: 'soft', borderStyle: 'solid', borderWidth: 4, borderColor: '#ffffff', opacity: 100, shadow: true },
  layout: { titleSize: 28, bodySize: 17, copyShift: 0, lineHeight: 125 },
  cardDate: '',
  showCardDate: false,
  custom: { aspect: 'portrait', color1: '#3b0764', color2: '#ec4899', backgroundType: 'linear', pattern: 'none', backgroundImage: null, font: 'sans', textColor: '#ffffff', fontSize: 36, alignment: 'center', lineHeight: 1.4, textGlow: false, stickers: [] },
  usingCustom: false,
  selectedSticker: null,
  cards: [],
  settings: { sender: '', theme: 'dark', developerCredit: 'Developed by Dr.Atul Dhuvad', showDeveloperCredit: true },
  installPrompt: null
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  setupCreatePhotoPanel();
  setupDeveloperSettings();
  setupCardDate();
  load();

  renderOccasions();
  renderTones();
  renderFields();
  renderFestivalFilter();
  renderTemplates();
  renderStickers();
  bind();
  applyTheme();

  $('#sender').value = state.settings.sender;
  $('#defaultSender').value = state.settings.sender;
  $('#theme').value = state.settings.theme;
  $('#developerCredit').value = state.settings.developerCredit;
  $('#showDeveloperCredit').checked = state.settings.showDeveloperCredit;
  $('#cardDate').value = state.cardDate;
  $('#showCardDate').checked = state.showCardDate;

  generate();
  renderCards();
  renderStudio();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
}

function setupCreatePhotoPanel() {
  const tools = $('.photo-tools'), panel = document.createElement('article');
  panel.className = 'panel';
  panel.innerHTML = '<div class="step"><span>4</span><div><h3>Choose a photo</h3><p>Adjust the photo here and the same placement is used in the card.</p></div></div>';
  if (!$('#photoLivePreview')) {
    $('#photoControls').insertAdjacentHTML('beforebegin', '<div id="photoLivePreview" class="photo-live-preview"><div class="photo-live-title">Live card photo placement</div><div class="photo-stage"><div id="photoStageFrame" class="photo-stage-frame empty-photo"><span>Photo preview appears here</span></div></div></div>');
  }
  if (!$('#frameSize')) {
    $('#panX').closest('label').insertAdjacentHTML('afterend', '<label>Photo size <output id="frameSizeOut">32%</output><input id="frameSize" type="range" min="20" max="50" value="32"></label><label>Photo vertical place <output id="frameYOut">8%</output><input id="frameY" type="range" min="4" max="38" value="8"></label>');
  }
  if (!$('#borderColorHint')) {
    $('#borderColor').closest('label').insertAdjacentHTML('beforeend', '<small id="borderColorHint" class="field-hint">Applies to Solid and Dashed. Gold metallic keeps a gold border.</small>');
  }
  if (!$('#removePhotoBtn')) {
    $('#photoControls').insertAdjacentHTML('afterbegin', '<div class="two-col"><button id="resetPhotoPositionBtn" type="button" class="secondary compact-btn">Reset position/zoom</button><button id="removePhotoBtn" type="button" class="secondary compact-btn">Remove photo</button></div>');
  }
  const vertical = $('#panY').closest('label'), horizontal = $('#panX').closest('label'), zoom = $('#zoom').closest('label');
  zoom.after(vertical);
  vertical.after(horizontal);
  panel.append(tools);
  $('#quickCreate').before(panel);
  setupPreviewTune();
  if (!$('#backBtn')) {
    document.body.insertAdjacentHTML('beforeend', '<button id="backBtn" class="nav-fab nav-back" type="button">Back</button><button id="topBtn" class="nav-fab nav-top" type="button">Top</button>');
  }
}

function setupPreviewTune() {
  if ($('#previewTune')) return;
  $('#cardPreview').insertAdjacentHTML('afterend', '<details id="previewTune" class="preview-tune" open><summary>Fine tune preview</summary><button id="previewBack" class="secondary compact-btn" type="button">Back to edit</button><div class="compact-grid"><label>Title size <output id="titleSizeOut">28</output><input id="titleSize" type="range" min="18" max="36" value="28"></label><label>Message size <output id="bodySizeOut">17</output><input id="bodySize" type="range" min="12" max="24" value="17"></label><label>Text position <output id="copyShiftOut">0</output><input id="copyShift" type="range" min="-20" max="20" value="0"></label><label>Line spacing <output id="lineHeightOut">125%</output><input id="lineHeightCtl" type="range" min="105" max="150" value="125"></label></div><div class="compact-grid photo-quick"><label>Photo size <output id="quickFrameSizeOut">32%</output><input id="quickFrameSize" type="range" min="20" max="50" value="32"></label><label>Photo place <output id="quickFrameYOut">8%</output><input id="quickFrameY" type="range" min="4" max="38" value="8"></label></div></details>');
}

function setupDeveloperSettings() {
  if ($('#developerCredit')) return;
  $('#theme').closest('label').insertAdjacentHTML('afterend', '<label>Footer credit<input id="developerCredit" type="text" placeholder="Developed by Dr.Atul Dhuvad"></label><label class="check"><input id="showDeveloperCredit" type="checkbox" checked> Show footer credit on cards</label>');
}

function setupCardDate() {
  if ($('#cardDate')) return;
  $('#dynamicFields').insertAdjacentHTML('afterend', '<div class="date-row"><label>Card date<input id="cardDate" type="date"></label><label class="check compact-check"><input id="showCardDate" type="checkbox"> Show date</label></div>');
}

function load() {
  try {
    Object.assign(state.settings, JSON.parse(localStorage.getItem(KEYS.settings) || '{}'));
    state.cards = JSON.parse(localStorage.getItem(KEYS.cards) || '[]');
    const d = JSON.parse(localStorage.getItem(KEYS.draft) || 'null');
    if (d) {
      Object.assign(state, d);
      state.cards = JSON.parse(localStorage.getItem(KEYS.cards) || '[]');
    }
    normalizeState();
  } catch (e) {
    console.warn('Local data could not be loaded', e);
    normalizeState();
  }
}

function normalizeState() {
  state.photo = null;
  state.photoCfg = { zoom: 100, panX: 0, panY: 0, frameSize: 32, frameY: 8, shape: 'soft', borderStyle: 'solid', borderWidth: 4, borderColor: '#ffffff', opacity: 100, shadow: true, ...state.photoCfg };
  state.layout = { titleSize: 28, bodySize: 17, copyShift: 0, lineHeight: 125, ...state.layout };
  state.settings = { sender: '', theme: 'dark', developerCredit: 'Developed by Dr.Atul Dhuvad', showDeveloperCredit: true, ...state.settings };
  state.cardDate = validDateValue(state.cardDate);
  state.showCardDate = state.showCardDate === true;
  if (!state.fields) state.fields = {};
  if (state.occasion === 'festival' && !state.fields.festival) {
    state.fields.festival = 'Diwali';
  }
  state.festivalFilter = state.occasion === 'festival' ? (state.fields.festival || 'Diwali') : 'General';
  const currentTemplate = PRESET_TEMPLATES.find(t => t.id === state.template);
  if (!currentTemplate || !templateEligibleForOccasion(currentTemplate, state.occasion)) {
    state.template = state.occasion === 'festival' ? 'diwali-poster' : 'festive';
  }
}

function bind() {
  $$('.bottom-nav button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
  $('#quickCreate').onclick = () => {
    if (state.occasion === 'festival' && state.fields.festival) {
      state.festivalFilter = state.fields.festival;
      const select = $('#templateCategoryFilter');
      if (select) select.value = state.festivalFilter;
      renderFestivalFilter();
    }
    showTab('templates');
  };
  $('#generateMessage').onclick = () => { state.messageIndex++; generate(); };
  $('#message').oninput = saveWorking;
  $('#sender').oninput = saveWorking;
  $('#cardDate').oninput = e => { state.cardDate = validDateValue(e.target.value); renderCard(); saveWorking(); };
  $('#showCardDate').onchange = e => { state.showCardDate = e.target.checked; renderCard(); saveWorking(); };
  $('#previewTemplate').onclick = openPreview;
  $('#openStudio').onclick = () => openModal('studioModal');
  $$('[data-close]').forEach(b => b.onclick = () => closeModal(b.dataset.close));
  $('.modal').addEventListener('click', e => { if (e.target.classList.contains('modal')) closeModal(e.target.id); });
  $('#applyStudio').onclick = () => { state.usingCustom = true; closeModal('studioModal'); toast('Custom design selected'); openPreview(); };
  $('#backBtn').onclick = goBack;
  $('#topBtn').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

  const filterSelect = $('#templateCategoryFilter');
  if (filterSelect) {
    filterSelect.onchange = e => {
      if (!syncFestivalField(e.target.value)) {
        state.festivalFilter = e.target.value;
        renderFestivalFilter();
      }
      renderTemplates();
      saveWorking();
    };
  }

  bindStudio();
  bindPhoto();
  bindPreviewTune();
  bindActions();
  bindSettings();
  $$('.segmented button').forEach(b => b.onclick = () => {
    $$('.segmented button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    renderCards(b.dataset.filter);
  });
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.installPrompt = e;
    $$('#headerInstall,#settingsInstall').forEach(b => b.classList.remove('hidden'));
  });
  $('#headerInstall').onclick = install;
  $('#settingsInstall').onclick = install;
}

function showTab(tab) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `tab-${tab}`));
  $$('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'saved') renderCards();
  if (tab === 'templates') {
    renderFestivalFilter();
    renderTemplates();
  }
  scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  const active = $('.modal.active');
  if (active) { closeModal(active.id); return; }
  const current = $('.view.active')?.id.replace('tab-', '');
  if (current && current !== 'home') { showTab('home'); return; }
  scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== FESTIVAL STATE SYNCHRONIZATION ====================
// One shared entry point for every control that names a specific festival
// (occasion dropdown, festival <select> field, filter dropdown, quick chips).
// Keeps state.fields.festival, state.occasion, state.festivalFilter and the
// selected template all agreeing on the same festival, and only wipes the
// message (regenerates) when the festival actually changed -- so switching
// between design variants of the SAME festival never discards a message the
// user already generated or hand-edited.
function syncFestivalField(name, { keepTemplate = false } = {}) {
  if (!name || name === 'all' || name === 'General') return false;
  const changed = state.occasion !== 'festival' || state.fields.festival !== name;
  state.occasion = 'festival';
  if (!state.fields) state.fields = {};
  state.fields.festival = name;
  state.festivalFilter = name;
  if (!keepTemplate) selectFestivalTemplate(name);
  renderOccasions();
  renderFields();
  renderFestivalFilter();
  if (changed) {
    // Only regenerate -- and so only overwrite a hand-edited message -- when
    // the festival actually changed. Re-selecting the same festival (e.g. a
    // different design variant) leaves whatever message is already there.
    state.messageIndex = 0;
    generate();
  }
  return changed;
}

// Called when the user picks a template CARD directly (Templates screen).
// The template already tells us its festival -- don't call selectFestivalTemplate
// (that would override the exact card the user just chose with a default pick).
function syncFestivalFromTemplate(t) {
  if (!t.festivals?.length) return false;
  // A template can be shared across more than one festival (e.g. the
  // Independence Day poster is also used for Republic Day). The filter is
  // what the user is actively browsing right now, so it's the most reliable
  // signal for which of the template's festivals they mean -- prefer it over
  // state.fields.festival, which can be a stale value left over from before
  // they changed the filter. Fall back to the already-selected field, then
  // the template's own primary festival.
  const name = (t.festivals.includes(state.festivalFilter) && state.festivalFilter)
    || (t.festivals.includes(state.fields.festival) && state.fields.festival)
    || t.festival || t.festivals[0];
  return syncFestivalField(name, { keepTemplate: true });
}

function renderOccasions() {
  const selected = OCCASIONS.find(o => o.id === state.occasion) || OCCASIONS[0];
  $('#occasionGrid').innerHTML = `<label class="occasion-select">Choose an occasion<select id="occasionSelect">${OCCASIONS.map(o => `<option value="${o.id}" ${o.id === state.occasion ? 'selected' : ''}>${o.icon} ${o.name}</option>`).join('')}</select><small>${selected.hint}</small></label>`;
  $('#occasionSelect').onchange = e => {
    const nextOccasion = e.target.value;
    // Switching occasion is the closest thing this app has to "start a new
    // card" -- it already clears the typed fields (recipient name, etc.), so
    // a photo uploaded for the previous occasion must not silently carry
    // into this one either (item 13).
    clearPhoto();
    if (nextOccasion === 'festival') {
      state.fields = {};
      syncFestivalField('Diwali');
    } else {
      state.occasion = nextOccasion;
      state.messageIndex = 0;
      state.fields = {};
      state.festivalFilter = 'General';
      const current = PRESET_TEMPLATES.find(t => t.id === state.template);
      if (!current || current.festivals || !templateEligibleForOccasion(current, nextOccasion)) {
        state.template = 'festive';
      }
      renderOccasions();
      renderFields();
      generate();
      renderFestivalFilter();
    }
    renderTemplates();
    renderCard();
    saveWorking();
  };
}

function renderFields() {
  const occ = OCCASIONS.find(o => o.id === state.occasion) || OCCASIONS[0];
  $('#dynamicFields').innerHTML = occ.fields.map(([id, label, type = 'text', options]) =>
    `<label>${label}${type === 'select' ? `<select data-field="${id}">${options.map(v => `<option value="${v}" ${state.fields[id] === v ? 'selected' : ''}>${v}</option>`).join('')}</select>` : `<input data-field="${id}" type="${type}" value="${escapeAttr(state.fields[id] || '')}" placeholder="${label}">`}</label>`
  ).join('');

  $$('[data-field]').forEach(el => {
    if (el.tagName === 'SELECT') {
      if (state.fields[el.dataset.field]) el.value = state.fields[el.dataset.field];
      else state.fields[el.dataset.field] = el.value;
    }
    el.oninput = () => {
      if (el.dataset.field === 'festival') {
        syncFestivalField(el.value);
      } else {
        state.fields[el.dataset.field] = el.value;
        state.messageIndex = 0;
        generate();
      }
      renderTemplates();
      saveWorking();
    };
  });
}

function renderTones() {
  $('#toneGrid').innerHTML = TONES.map(t => `<button class="${t[0] === state.tone ? 'active' : ''}" data-tone="${t[0]}">${t[1]} ${t[2]}</button>`).join('');
  $$('#toneGrid button').forEach(b => b.onclick = () => {
    state.tone = b.dataset.tone;
    state.messageIndex = 0;
    renderTones();
    generate();
    saveWorking();
  });
}

function data() {
  return { ...state.fields, sender: $('#sender')?.value || state.settings.sender };
}

function generate() {
  const d = data();
  $('#message').value = generatedMessage(state.occasion, state.tone, d, state.messageIndex);
  saveWorking();
}

function renderFestivalFilter() {
  const bar = $('.template-filter-bar');
  if (bar) bar.classList.toggle('hidden', state.occasion !== 'festival');

  const select = $('#templateCategoryFilter');
  if (select) {
    select.value = state.festivalFilter || 'all';
  }

  const popular = [
    { id: 'all', label: '🌟 All' },
    { id: 'Diwali', label: '🪔 Diwali' },
    { id: 'Holi', label: '🎨 Holi' },
    { id: 'Navratri', label: '💃 Navratri' },
    { id: 'Uttarayan / Makar Sankranti', label: '🪁 Uttarayan' },
    { id: 'Raksha Bandhan', label: '🌸 Rakhi' },
    { id: 'Janmashtami', label: '🦚 Janmashtami' },
    { id: 'Ganesh Chaturthi', label: '🐘 Ganesh' },
    { id: 'Bestu Varas (Gujarati New Year)', label: '🌿 New Year' },
    { id: 'General', label: '✨ General' }
  ];

  const chipsEl = $('#templateQuickChips');
  if (chipsEl) {
    chipsEl.innerHTML = popular.map(p =>
      `<button type="button" class="filter-chip ${state.festivalFilter === p.id ? 'active' : ''}" data-filter="${p.id}">${p.label}</button>`
    ).join('');

    $$('#templateQuickChips button').forEach(btn => {
      btn.onclick = () => {
        if (!syncFestivalField(btn.dataset.filter)) {
          state.festivalFilter = btn.dataset.filter;
          if (select) select.value = state.festivalFilter;
          renderFestivalFilter();
        }
        renderTemplates();
        saveWorking();
      };
    });
  }
}

// A template with an explicit `occasions` allowlist (e.g. the Birthday hero
// templates) is only eligible when the current occasion is in that list.
// Templates without the field are occasion-agnostic, same as before this
// field existed, so no other template's availability changes.
function templateEligibleForOccasion(t, occasion) {
  return !t.occasions || t.occasions.includes(occasion);
}

function templatesForCurrentFilter() {
  const f = state.festivalFilter;
  const byFilter = !f || f === 'all' ? PRESET_TEMPLATES
    : f === 'General' ? PRESET_TEMPLATES.filter(t => !t.festivals)
    : PRESET_TEMPLATES.filter(t => t.festivals?.includes(f));
  return byFilter.filter(t => templateEligibleForOccasion(t, state.occasion));
}

function renderTemplates() {
  const templates = templatesForCurrentFilter();
  const grid = $('#templateGrid');
  if (!templates.length) {
    grid.innerHTML = `<div class="empty"><span>🎨</span><h3>No templates found</h3><p>Try selecting another festival or all designs.</p></div>`;
    return;
  }

  grid.innerHTML = templates.map(t => {
    const isPoster = t.styleType === 'poster';
    const isActive = !state.usingCustom && state.template === t.id;
    const badgeText = t.badge || (isPoster ? 'POSTER' : 'THEME');

    return `
      <button class="template-card ${isActive ? 'active' : ''}" data-id="${t.id}">
        <div class="template-thumb" style="background:${t.background}; color:${t.textColor};">
          <div class="thumb-badge" style="background:${t.accentColor || '#f59e0b'};">${badgeText}</div>
          <div class="thumb-center">
            ${t.image ? `<img src="${t.image}" alt="" class="thumb-art-img" style="object-position:50% ${t.imageFocusY ?? 50}%">` : `<span class="thumb-icon">${templateDecor(t)[0]}</span>`}
            <span class="thumb-title">${escapeHtml(t.name.replace(/^(Diwali|Holi|Navratri|Uttarayan|Raksha Bandhan|Janmashtami|Ganesh Chaturthi|Dussehra|Bestu Varas|Independence Day|Valentine's Day|Christmas|Eid|New Year)\s*/i, ''))}</span>
          </div>
        </div>
        <div class="template-card-info">
          <strong>${escapeHtml(t.name)}</strong>
          <small>${escapeHtml(t.category)}</small>
        </div>
      </button>
    `;
  }).join('');

  $$('.template-card').forEach(b => b.onclick = () => {
    const t = PRESET_TEMPLATES.find(x => x.id === b.dataset.id);
    state.template = b.dataset.id;
    state.usingCustom = false;
    if (t) syncFestivalFromTemplate(t);
    if (t && t.photoFrameDefaults) {
      Object.assign(state.photoCfg, t.photoFrameDefaults);
      updatePhotoPreview();
    }
    renderTemplates();
    saveWorking();
  });
}

function design() {
  if (state.usingCustom) {
    const c = state.custom,
      bg = c.backgroundImage ? `linear-gradient(#0004,#0004),url(${c.backgroundImage}) center/cover` :
        c.backgroundType === 'solid' ? c.color1 :
          c.backgroundType === 'radial' ? `radial-gradient(circle,${c.color2},${c.color1})` :
            `linear-gradient(135deg,${c.color1},${c.color2})`;
    return { background: bg, textColor: c.textColor, font: c.font, stickers: c.stickers.map(s => s.emoji), shape: 'soft', border: c.color2 };
  }
  const t = PRESET_TEMPLATES.find(t => t.id === state.template) || PRESET_TEMPLATES[0];
  // Defensive: never render a template outside its declared occasions (e.g. a Birthday
  // hero template) even if state.template and state.occasion somehow disagree — a stale
  // save, direct state mutation, or a future code path that forgets to reset one of them.
  if (!templateEligibleForOccasion(t, state.occasion)) {
    return PRESET_TEMPLATES.find(x => x.id === 'festive') || PRESET_TEMPLATES[0];
  }
  return t;
}

function renderCard() {
  const d = design(), preview = $('#cardPreview'), decor = decorationsForDesign(d), sender = data().sender, l = state.layout, credit = footerCredit(), date = cardDateText();
  const isPoster = !state.usingCustom && d.styleType === 'poster';
  const isHero = !state.usingCustom && !!d.heroLayout;
  const isFit = !state.usingCustom && !!d.fitCopy && !isPoster && !isHero;

  preview.className = `card-preview ${isPoster ? 'is-poster' : ''} ${isHero ? 'is-hero' : ''} ${isFit ? 'fit-copy-card' : ''}`;
  preview.classList.toggle('has-photo', !!state.photo);
  preview.classList.toggle('has-panel', !!d.panel && !isPoster);
  preview.style.cssText = isHero
    ? `background:#12100f center/cover no-repeat url(${d.backgroundImage}); color:${d.textColor}; font-family:${FONT_MAP[d.font] || 'Georgia, serif'}; text-align:center; aspect-ratio:4/5`
    : `background:${d.background}; color:${d.textColor}; font-family:${FONT_MAP[d.font] || 'sans-serif'}; text-align:${state.usingCustom ? state.custom.alignment : 'center'}; aspect-ratio:${state.usingCustom ? aspectValue(state.custom.aspect) : '4/5'}`;

  const pattern = state.usingCustom ? patternLayer(state.custom.pattern) : '';
  const stickers = state.usingCustom ? state.custom.stickers.map(s => `<span class="placed-sticker" style="left:${s.x}%;top:${s.y}%;font-size:${s.size}px;transform:rotate(${s.rotation}deg)">${s.emoji}</span>`).join('') :
    (!isPoster && !isHero ? decor.map((s, i) => `<span class="placed-sticker" style="${stickerStyle(s, i)}">${escapeHtml(s.emoji || s)}</span>`).join('') : '');

  if (isHero) {
    const area = d.titleArea || { top: 4, left: 4, width: 92, height: 30 };
    const fit = fitHeroTitle(d, data().recipient);
    const titleLinesHtml = fit.lines.map(line =>
      `<div class="hero-title-line" style="font-size:${(line.fontSize / 1080 * 100).toFixed(3)}cqw;line-height:${fit.lineHeight / line.fontSize}">${escapeHtml(line.text)}</div>`
    ).join('');
    const scrim = d.scrimColor || '0,0,0';
    // The title and sender sit directly on a photographic background, so each
    // gets its own scrim -- flat/solid through where the text actually falls,
    // fading out only past it -- instead of relying on the text-shadow alone,
    // which isn't reliable contrast against a busy photo (item 1: title must
    // read as a separate area, and the sender must never land on the cake).
    const titleScrimHeight = Math.min(60, area.top + area.height + 8);
    preview.innerHTML = `
      ${date ? `<div class="hero-date" style="color:${d.textColor}">${escapeHtml(date)}</div>` : ''}
      <div class="hero-title-scrim" style="height:${titleScrimHeight}%;background:linear-gradient(to bottom, rgba(${scrim},.6) 0%, rgba(${scrim},.6) 55%, rgba(${scrim},0) 100%)"></div>
      <div class="hero-title-box" style="top:${area.top}%;left:${area.left}%;width:${area.width}%;height:${area.height}%;color:${d.textColor}">${titleLinesHtml}</div>
      ${state.photo ? photoMarkup('card') : ''}
      <div class="hero-footer-scrim" style="background:linear-gradient(to top, rgba(${scrim},.92) 0%, rgba(${scrim},.92) 65%, rgba(${scrim},0) 100%)">
        <div class="hero-footer-inner">
          ${sender ? `<div class="hero-sender" style="color:${d.accentColor || d.textColor}">— ${escapeHtml(sender)}</div>` : ''}
        </div>
      </div>
      ${credit ? `<div class="developer-credit">${escapeHtml(credit)}</div>` : ''}
      <div class="card-watermark">MADE WITH WISHCRAFT</div>
    `;
  } else if (isPoster) {
    // Use the synced, user-selected festival (cardTitleText() reads state.fields.festival)
  // rather than the template's own fixed `festival` field, so a template shared across
  // more than one festival (e.g. the Independence Day poster also used for Republic Day)
  // shows the festival the user actually selected, not whichever the template defaults to.
  const festivalName = cardTitleText().toUpperCase();
    const subtitle = d.subtitle || 'Celebrate Safe, Healthy & Happy';
    const tagline = d.tagline || 'Light up happiness, not pollution. Choose safety. Choose health.';

    // The photo's own frame only needs to reserve clearance below it (via
    // margin-top) when it's absolutely positioned at the top of poster-body
    // (no festival art). When art is also showing, the photo renders as a
    // small static "dual" frame right after the art -- already in normal
    // flow, so it needs no extra clearance (item 15: art must stay visible,
    // photo gets a separate frame alongside it, not replacing it).
    const posterPhotoClear = (state.photo && !d.image) ? Math.max(12, Math.min(72, state.photoCfg.frameY + state.photoCfg.frameSize + 5)) : 0;
    preview.innerHTML = `
      ${pattern}
      <div class="poster-container">
        <header class="poster-header" style="background:${d.headerBg || d.accentColor || '#180928'}; color:${d.headerTextColor || '#ffffff'}">
          <div class="poster-main-title">${escapeHtml(festivalName)}</div>
          <div class="poster-subtitle" style="color:${d.accentColor || '#fbbf24'}">${escapeHtml(subtitle)}</div>
        </header>

        <div class="poster-body" style="background:${d.bodyBg || '#ffffff'}; position:relative">
          ${state.photo && !d.image ? photoMarkup('card') : ''}
          ${date ? `<div class="poster-date">${escapeHtml(date)}</div>` : ''}

          ${d.image ? `
            <div class="poster-art-section" style="border-color:${d.accentColor || '#ea580c'}44">
              <img src="${d.image}" alt="${escapeHtml(festivalName)}" class="poster-art-img" style="object-position:50% ${d.imageFocusY ?? 50}%">
            </div>
            ${state.photo ? photoMarkup('card', 'flow') : ''}
          ` : ''}

          <div class="poster-message-wrap" style="transform:translateY(${l.copyShift || 0}px); margin-top:${posterPhotoClear}%">
            <h3 class="poster-greeting" style="font-size:${l.titleSize}px; color:${d.textColor}">${escapeHtml(cardTitle())}</h3>
            <p class="poster-message" style="font-size:${l.bodySize}px; line-height:${l.lineHeight / 100}; color:${d.textColor}">${escapeHtml($('#message').value)}</p>
            ${sender ? `<div class="poster-sender" style="font-size:${Math.max(l.bodySize, 16)}px; color:${d.accentColor || '#d97706'}">— ${escapeHtml(sender)}</div>` : ''}
          </div>

          <div class="poster-tagline" style="color:${d.textColor}">
            <em>${escapeHtml(tagline)}</em>
          </div>
        </div>

        <footer class="poster-footer">
          ${credit ? `<div class="poster-credit">${escapeHtml(credit)}</div>` : ''}
          <div class="card-watermark">MADE WITH WISHCRAFT</div>
        </footer>
      </div>
    `;
  } else if (isFit) {
    // fitCopy templates: badge/art live in their own fixed absolute zones
    // (matching the canvas's h*0.11/h*0.23 art geometry exactly), and
    // .card-copy is a fixed 38%-88% zone whose type sizes come from the same
    // fitCardCopy() the canvas export calls -- converted to cqw so the
    // relative proportions match the canvas's px sizing on a 1080-wide space.
    const fit = fitCardCopy(d, cardTitle(), $('#message').value, { hasSender: !!sender, tagline: d.tagline || '' });
    if (!fit.fits) toast('Message is long for this template — showing it at minimum readable size.');
    const cq = px => (px / 1080 * 100).toFixed(3) + 'cqw';
    preview.innerHTML = `
      ${pattern}
      ${stickers}
      ${date ? `<div class="card-date">${escapeHtml(date)}</div>` : ''}
      ${d.image ? `
        <div class="fit-art-section" style="border-color:${d.border || '#fbbf24'}">
          <img src="${d.image}" alt="" class="card-art-img" style="object-position:50% ${d.imageFocusY ?? 50}%">
        </div>
      ` : ''}
      ${state.photo ? photoMarkup('card', d.image ? 'fit' : null) : ''}

      <section class="card-copy fit-copy ${d.panel ? 'text-panel' : ''}" style="padding-top:${cq(20 * fit.gapScale)};${panelStyleOverride(d)}">
        <h3 style="font-size:${cq(fit.titleSize)};line-height:1.15;margin-bottom:${cq(14 * fit.gapScale)}">${escapeHtml(cardTitle())}</h3>
        <p style="font-size:${cq(fit.msgSize)};line-height:1.25">${escapeHtml($('#message').value)}</p>
        ${d.tagline ? `<div class="card-tagline-text" style="margin-top:${cq(20 * fit.gapScale)};font-size:${cq(FIT_TAGLINE_SIZE)}"><em>${escapeHtml(d.tagline)}</em></div>` : ''}
        ${sender ? `<div class="card-signature" style="margin-top:${cq(20 * fit.gapScale)};font-size:${cq(FIT_SIG_SIZE)}">— ${escapeHtml(sender)}</div>` : ''}
      </section>
      ${credit ? `<div class="developer-credit">${escapeHtml(credit)}</div>` : ''}
      <div class="card-watermark">MADE WITH WISHCRAFT</div>
    `;
  } else {
    const copyTop = copyTopPct();
    // .card-copy centers its content (title+message+signature) within its
    // top/bottom box via justify-content:center -- for titleAbovePhoto
    // templates the photo sits BELOW that box (not pushing it down like the
    // normal photo-on-top layout does), so the box's bottom edge must stop
    // above the photo, or a long enough message centers low enough to run
    // into it. Otherwise keep the normal bottom-of-card margin.
    const copyBottom = (state.photo && d.titleAbovePhoto)
      ? Math.max(28, 100 - state.photoCfg.frameY + 3) + '%'
      : (credit ? '12%' : '9%');
    // Also switch off center-alignment for that same case: if content is
    // ever still taller than the box, flex-start means the TITLE (first
    // child, at the top) is guaranteed visible -- centering would clip
    // whichever end overflows, which is worse when that end is the heading.
    const titleAbove = state.photo && d.titleAbovePhoto;
    const copyJustify = titleAbove ? 'justify-content:flex-start;' : '';
    // The titleAbovePhoto box is necessarily shorter than the normal
    // photo-pushes-title-down layout (it has to leave room for the photo
    // below it, not just above), so text sized for that larger box can
    // overflow here -- trim it down a bit for this case specifically. Sized
    // in cqw (proportional to the card's own rendered width, which is a
    // fixed 4:5 aspect ratio) rather than px: a fixed px size is tuned for
    // one card size, but the same text takes up relatively MORE of a
    // *smaller* card (the card shrinks, the px text doesn't), so a size
    // that fits at 375px-wide can still overflow at 320px-wide. cqw scales
    // with the card itself, so the fit stays the same at every viewport.
    const cq = px => (px / 375 * 100).toFixed(2) + 'cqw';
    const titleUnit = titleAbove ? cq(Math.min(l.titleSize, 24)) : `${l.titleSize}px`;
    const bodyUnit = titleAbove ? cq(Math.min(l.bodySize, 15)) : `${l.bodySize}px`;
    const sigUnit = titleAbove ? cq(Math.min(l.bodySize + 2, 16)) : `${Math.max(l.bodySize + 2, 18)}px`;
    preview.innerHTML = `
      ${pattern}
      ${stickers}
      ${date ? `<div class="card-date">${escapeHtml(date)}</div>` : ''}
      ${state.photo && !d.image ? photoMarkup('card') : ''}

      <section class="card-copy ${d.panel ? 'text-panel' : ''}" style="top:${d.image ? '6%' : copyTop + '%'}; bottom:${copyBottom};${copyJustify}${panelStyleOverride(d)}">

        ${d.image ? `
          <div class="card-art-section${d.compactArt ? ' compact-art' : ''}" style="border-color:${d.border || '#fbbf24'}${d.compactArt ? ';height:40px' : ''}">
            <img src="${d.image}" alt="" class="card-art-img" style="object-position:50% ${d.imageFocusY ?? 50}%">
          </div>
          ${state.photo ? photoMarkup('card', 'flow') : ''}
        ` : ''}

        <h3 style="font-size:${titleUnit}${titleAbove ? ';margin-bottom:8px' : ''}">${escapeHtml(cardTitle())}</h3>
        <p style="font-size:${bodyUnit};line-height:${titleAbove ? 1.2 : l.lineHeight / 100}">${escapeHtml($('#message').value)}</p>
        ${d.tagline ? `<div class="card-tagline-text"><em>${escapeHtml(d.tagline)}</em></div>` : ''}
        ${sender ? `<div class="card-signature" style="font-size:${sigUnit}${titleAbove ? ';margin-top:8px' : ''}">— ${escapeHtml(sender)}</div>` : ''}
      </section>
      ${credit ? `<div class="developer-credit">${escapeHtml(credit)}</div>` : ''}
      <div class="card-watermark">MADE WITH WISHCRAFT</div>
    `;
  }

  bindPhotoDrag($('#cardPreview .card-photo-frame'));
  syncPreviewTune();
}

function openPreview() {
  renderCard();
  openModal('previewModal');
}

// dual: when the design also has festival artwork (d.image) showing, the
// user's photo must be a SEPARATE frame alongside it, not replace it (item
// 15) -- 'flow' places a small normal-flow frame (poster/default branches,
// where the art sits in the page flow and a static element after it just
// stacks below with no overlap risk); 'fit' places a small frame in a fixed
// corner position over the isFit layout's fixed-zone artwork, since that
// layout has no flow container to place a second block into.
function photoMarkup(mode, dual) {
  if (!state.photo) return '';
  const p = state.photoCfg,
    posX = focusPct(p.panX),
    posY = focusPct(p.panY),
    borderColor = p.borderStyle === 'gold' ? '#d4af37' : p.borderColor,
    frameStyle = `border-radius:${radius(p.shape)};border:${p.borderWidth}px ${p.borderStyle === 'dashed' ? 'dashed' : 'solid'} ${borderColor};opacity:${p.opacity / 100};box-shadow:${p.shadow ? '0 10px 28px #0007' : 'none'}`,
    img = `<img src="${state.photo}" alt="" style="object-position:${posX}% ${posY}%;transform-origin:${posX}% ${posY}%;transform:scale(${p.zoom / 100})">`,
    posStyle = dual ? '' : `width:${p.frameSize}%;top:${p.frameY}%`,
    dualClass = dual === 'flow' ? ' dual-frame-flow' : dual === 'fit' ? ' dual-frame-fit' : '';
  return mode === 'card' ?
    `<div class="card-photo-frame${dualClass}" style="${frameStyle};${posStyle}">${img}</div>` :
    `<div class="photo-stage-frame${dualClass}" style="${frameStyle};${posStyle}">${img}</div>`;
}

// Patches every photo frame currently in the DOM (the upload-step stage
// preview and the live card preview both render their own copy of the
// photo) without rebuilding either subtree, so a frame mid-drag never gets
// destroyed by its own reposition.
function livePhotoPositionUpdate() {
  const pos = `${focusPct(state.photoCfg.panX)}% ${focusPct(state.photoCfg.panY)}%`;
  $$('.photo-stage-frame img, .card-photo-frame img').forEach(img => {
    img.style.objectPosition = pos;
    img.style.transformOrigin = pos;
  });
}

function bindPhotoDrag(frame) {
  if (!frame || !state.photo) return;
  frame.style.touchAction = 'none';
  frame.style.cursor = 'grab';
  frame.onpointerdown = e => {
    e.preventDefault();
    frame.setPointerCapture(e.pointerId);
    frame.style.cursor = 'grabbing';
    const rect = frame.getBoundingClientRect(), startX = e.clientX, startY = e.clientY,
      startPanX = state.photoCfg.panX, startPanY = state.photoCfg.panY;
    frame.onpointermove = ev => {
      const dx = (ev.clientX - startX) / rect.width * 200, dy = (ev.clientY - startY) / rect.height * 200;
      state.photoCfg.panX = Math.max(-100, Math.min(100, startPanX - dx));
      state.photoCfg.panY = Math.max(-100, Math.min(100, startPanY - dy));
      livePhotoPositionUpdate();
    };
    frame.onpointerup = () => {
      frame.onpointermove = null;
      updatePhotoPreview();
      renderCard();
      saveWorking();
    };
  };
}

function updatePhotoPreview() {
  const live = $('#photoLivePreview'), stage = $('#photoLivePreview .photo-stage-frame');
  if (!live || !stage) return;
  if (!state.photo) {
    stage.className = 'photo-stage-frame empty-photo';
    stage.removeAttribute('style');
    stage.innerHTML = '<span>Photo preview appears here</span>';
  } else {
    stage.outerHTML = photoMarkup('stage');
    bindPhotoDrag($('#photoLivePreview .photo-stage-frame'));
  }
  $('#zoomOut').value = state.photoCfg.zoom + '%';
  $('#frameSizeOut').value = state.photoCfg.frameSize + '%';
  $('#frameYOut').value = state.photoCfg.frameY + '%';
  ['zoom', 'panX', 'panY', 'frameSize', 'frameY', 'borderWidth', 'photoOpacity'].forEach(id => {
    const el = $('#' + id);
    if (el) el.value = id === 'photoOpacity' ? state.photoCfg.opacity : state.photoCfg[id];
  });
  ['photoShape', 'borderStyle', 'borderColor'].forEach(id => {
    const el = $('#' + id), key = { photoShape: 'shape', borderStyle: 'borderStyle', borderColor: 'borderColor' }[id];
    if (el) el.value = state.photoCfg[key];
  });
}

// Resets photo + photoCfg to their defaults and hides the controls panel --
// used both when the user explicitly removes the photo and when starting a
// new card (occasion switch) so a photo never silently carries over (item 13).
function clearPhoto() {
  state.photo = null;
  state.photoCfg = { zoom: 100, panX: 0, panY: 0, frameSize: 32, frameY: 8, shape: 'soft', borderStyle: 'solid', borderWidth: 4, borderColor: '#ffffff', opacity: 100, shadow: true };
  const input = $('#photoInput');
  if (input) input.value = '';
  const controls = $('#photoControls');
  if (controls) controls.classList.add('hidden');
  updatePhotoPreview();
}

function bindPhoto() {
  $('#photoInput').onchange = e => readImage(e.target.files[0], url => {
    state.photo = url;
    $('#photoControls').classList.remove('hidden');
    updatePhotoPreview();
    renderCard();
    saveWorking();
  });
  $('#removePhotoBtn').onclick = () => {
    clearPhoto();
    renderCard();
    saveWorking();
    toast('Photo removed');
  };
  $('#resetPhotoPositionBtn').onclick = () => {
    Object.assign(state.photoCfg, { zoom: 100, panX: 0, panY: 0, frameSize: 32, frameY: 8 });
    updatePhotoPreview();
    renderCard();
    saveWorking();
    toast('Photo position and zoom reset');
  };
  ['zoom', 'panX', 'panY', 'frameSize', 'frameY', 'borderWidth', 'photoOpacity'].forEach(id => $('#' + id).oninput = e => {
    const key = id === 'photoOpacity' ? 'opacity' : id;
    state.photoCfg[key] = Number(e.target.value);
    updatePhotoPreview();
    renderCard();
    saveWorking();
  });
  ['photoShape', 'borderStyle', 'borderColor'].forEach(id => $('#' + id).oninput = e => {
    const key = { photoShape: 'shape', borderStyle: 'borderStyle', borderColor: 'borderColor' }[id];
    state.photoCfg[key] = e.target.value;
    updatePhotoPreview();
    renderCard();
    saveWorking();
  });
  $('#photoShadow').onchange = e => {
    state.photoCfg.shadow = e.target.checked;
    updatePhotoPreview();
    renderCard();
    saveWorking();
  };
  if (state.photo) $('#photoControls').classList.remove('hidden');
  updatePhotoPreview();
}

function bindPreviewTune() {
  $('#previewBack').onclick = () => closeModal('previewModal');
  ['titleSize', 'bodySize', 'copyShift', 'lineHeightCtl'].forEach(id => $('#' + id).oninput = e => {
    const key = id === 'lineHeightCtl' ? 'lineHeight' : id;
    state.layout[key] = Number(e.target.value);
    renderCard();
    saveWorking();
  });
  ['quickFrameSize', 'quickFrameY'].forEach(id => $('#' + id).oninput = e => {
    const key = id === 'quickFrameSize' ? 'frameSize' : 'frameY';
    state.photoCfg[key] = Number(e.target.value);
    updatePhotoPreview();
    renderCard();
    saveWorking();
  });
}

function syncPreviewTune() {
  if (!$('#previewTune')) return;
  $('#titleSize').value = state.layout.titleSize;
  $('#titleSizeOut').value = state.layout.titleSize;
  $('#bodySize').value = state.layout.bodySize;
  $('#bodySizeOut').value = state.layout.bodySize;
  $('#copyShift').value = state.layout.copyShift;
  $('#copyShiftOut').value = state.layout.copyShift;
  $('#lineHeightCtl').value = state.layout.lineHeight;
  $('#lineHeightOut').value = state.layout.lineHeight + '%';
  $('#quickFrameSize').value = state.photoCfg.frameSize;
  $('#quickFrameSizeOut').value = state.photoCfg.frameSize + '%';
  $('#quickFrameY').value = state.photoCfg.frameY;
  $('#quickFrameYOut').value = state.photoCfg.frameY + '%';
  $('.photo-quick').classList.toggle('hidden', !state.photo);
}

function bindStudio() {
  ['aspect', 'color1', 'color2', 'backgroundType', 'pattern', 'font', 'textColor', 'fontSize', 'alignment', 'lineHeight'].forEach(id => $('#' + id).oninput = e => {
    state.custom[id] = ['fontSize', 'lineHeight'].includes(id) ? Number(e.target.value) : e.target.value;
    if (id === 'lineHeight') state.custom.lineHeight = Number(e.target.value) / 10;
    renderStudio();
  });
  $('#textGlow').onchange = e => {
    state.custom.textGlow = e.target.checked;
    renderStudio();
  };
  $('#backgroundImage').onchange = e => readImage(e.target.files[0], u => {
    state.custom.backgroundImage = u;
    renderStudio();
  });
  $('#stickerTools').onclick = e => {
    const s = state.custom.stickers.find(x => x.id === state.selectedSticker);
    if (!s) return;
    if (e.target.dataset.action === 'larger') s.size += 5;
    if (e.target.dataset.action === 'smaller') s.size = Math.max(18, s.size - 5);
    if (e.target.dataset.action === 'rotate') s.rotation += 15;
    if (e.target.dataset.action === 'delete') {
      state.custom.stickers = state.custom.stickers.filter(x => x.id !== s.id);
      state.selectedSticker = null;
    }
    renderStudio();
  };
}

function renderStickers() {
  $('#stickerLibrary').innerHTML = STICKERS.map(x => `<button>${x}</button>`).join('');
  $$('#stickerLibrary button').forEach(b => b.onclick = () => {
    const id = Date.now();
    state.custom.stickers.push({ id, emoji: b.textContent, x: 45, y: 20, size: 34, rotation: 0 });
    state.selectedSticker = id;
    renderStudio();
  });
}

function renderStudio() {
  const c = state.custom,
    d = { ...design(), background: c.backgroundImage ? `linear-gradient(#0003,#0003),url(${c.backgroundImage}) center/cover` : c.backgroundType === 'solid' ? c.color1 : c.backgroundType === 'radial' ? `radial-gradient(circle,${c.color2},${c.color1})` : `linear-gradient(135deg,${c.color1},${c.color2})` },
    el = $('#studioPreview');
  el.style.cssText = `background:${d.background};color:${c.textColor};font-family:${FONT_MAP[c.font]};text-align:${c.alignment};aspect-ratio:${aspectValue(c.aspect)}`;
  el.innerHTML = `${patternLayer(c.pattern)}<div class="card-message" style="font-size:${Math.max(18, c.fontSize * .6)}px;line-height:${c.lineHeight};text-shadow:${c.textGlow ? '0 2px 8px #000,0 0 18px currentColor' : 'none'}">${escapeHtml($('#message')?.value || 'Your message appears here')}</div>${c.stickers.map(s => `<span class="placed-sticker ${s.id === state.selectedSticker ? 'selected' : ''}" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%;font-size:${s.size}px;transform:rotate(${s.rotation}deg)">${s.emoji}</span>`).join('')}`;
  $('#stickerTools').classList.toggle('hidden', !state.selectedSticker);
  $$('#studioPreview .placed-sticker').forEach(node => dragSticker(node));
}

function dragSticker(node) {
  node.onpointerdown = e => {
    e.preventDefault();
    state.selectedSticker = Number(node.dataset.id);
    node.setPointerCapture(e.pointerId);
    renderStudio();
    const move = ev => {
      const r = $('#studioPreview').getBoundingClientRect(), s = state.custom.stickers.find(x => x.id === state.selectedSticker);
      if (!s) return;
      s.x = Math.max(0, Math.min(90, (ev.clientX - r.left) / r.width * 100));
      s.y = Math.max(0, Math.min(90, (ev.clientY - r.top) / r.height * 100));
      node.style.left = s.x + '%';
      node.style.top = s.y + '%';
    };
    node.onpointermove = move;
    node.onpointerup = () => {
      node.onpointermove = null;
      saveWorking();
    };
  };
}

function bindActions() {
  $('#saveCard').onclick = () => saveCard('saved');
  $('#saveDraft').onclick = () => saveCard('draft');
  $('#downloadCard').onclick = async () => {
    try {
      const blob = await makeImage();
      if (blob) {
        downloadBlob(blob, `wishcraft-${Date.now()}.png`);
        toast('High-resolution card downloaded');
      } else {
        throw new Error('Image creation failed');
      }
    } catch (err) {
      console.warn('Download error fallback:', err);
      try {
        const c = $('#exportCanvas');
        const a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = `wishcraft-${Date.now()}.png`;
        a.click();
        toast('Card downloaded');
      } catch (e) {
        toast('Error downloading card: ' + (err.message || e.message));
      }
    }
  };
  $('#shareCard').onclick = shareCardImage;
  $('#whatsApp').onclick = shareWhatsAppCard;
}

async function shareCardImage() {
  const blob = await makeImage(), file = new File([blob], 'wishcraft-card.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: 'A WishCraft card', files: [file] });
  else if (navigator.share) await navigator.share({ title: 'WishCraft', text: $('#message').value });
  else {
    await navigator.clipboard.writeText($('#message').value);
    toast('Message copied');
  }
}

async function shareWhatsAppCard() {
  const blob = await makeImage(), file = new File([blob], 'wishcraft-card.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'WishCraft card', files: [file] });
    return;
  }
  downloadBlob(blob, `wishcraft-whatsapp-${Date.now()}.png`);
  toast('Card image downloaded. Open WhatsApp and attach it.');
}

function saveCard(status) {
  const item = {
    id: Date.now(),
    status,
    occasion: state.occasion,
    message: $('#message').value,
    template: state.template,
    usingCustom: state.usingCustom,
    custom: structuredClone(state.custom),
    photo: state.photo,
    photoCfg: { ...state.photoCfg },
    layout: { ...state.layout },
    cardDate: state.cardDate,
    showCardDate: state.showCardDate,
    developerCredit: footerCredit(),
    created: new Date().toISOString()
  };
  state.cards.unshift(item);
  persistCards();
  toast(status === 'draft' ? 'Draft saved' : 'Card saved to My Cards');
  renderCards();
}

function renderCards(filter = 'all') {
  const list = filter === 'all' ? state.cards : state.cards.filter(x => x.status === filter);
  $('#cardsList').innerHTML = list.length ? list.map(c => {
    const o = OCCASIONS.find(x => x.id === c.occasion), t = PRESET_TEMPLATES.find(x => x.id === c.template) || PRESET_TEMPLATES[0];
    return `
      <article class="saved-card">
        <div class="saved-thumb" style="background:${t.background}">${o?.icon || '✨'}</div>
        <div>
          <h3>${o?.name || 'Custom'} <small>· ${c.status}</small></h3>
          <p>${escapeHtml(c.message.slice(0, 90))}</p>
          <p>${new Date(c.created).toLocaleDateString()}</p>
        </div>
        <button data-delete="${c.id}" aria-label="Delete">×</button>
      </article>
    `;
  }).join('') : `
    <div class="empty">
      <span>💌</span>
      <h3>No ${filter === 'all' ? 'cards' : filter + ' cards'} yet</h3>
      <p>Create something personal and save it here.</p>
    </div>
  `;

  $$('[data-delete]').forEach(b => b.onclick = () => {
    state.cards = state.cards.filter(c => c.id !== Number(b.dataset.delete));
    persistCards();
    renderCards(filter);
  });
}

function bindSettings() {
  $('#saveSettings').onclick = () => {
    state.settings.sender = $('#defaultSender').value.trim();
    state.settings.theme = $('#theme').value;
    state.settings.developerCredit = $('#developerCredit').value.trim();
    state.settings.showDeveloperCredit = $('#showDeveloperCredit').checked;
    localStorage.setItem(KEYS.settings, JSON.stringify(state.settings));
    $('#sender').value = state.settings.sender;
    applyTheme();
    renderCard();
    toast('Settings saved');
  };
  $('#clearData').onclick = () => {
    if (confirm('Delete all saved cards and drafts from this browser?')) {
      state.cards = [];
      localStorage.removeItem(KEYS.cards);
      localStorage.removeItem(KEYS.draft);
      renderCards();
      toast('Local cards cleared');
    }
  };
  if (/iphone|ipad/i.test(navigator.userAgent)) $('#installHelp').textContent = 'On iPhone or iPad, use Share → Add to Home Screen.';
}

function applyTheme() {
  let t = state.settings.theme;
  if (t === 'system') t = matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
}

async function install() {
  if (state.installPrompt) {
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    $('#headerInstall').classList.add('hidden');
  } else toast('Use your browser menu to add WishCraft to your home screen');
}

async function makeImage() {
  const c = $('#exportCanvas'), d = design(),
    isPoster = !state.usingCustom && d.styleType === 'poster',
    isFit = !state.usingCustom && !!d.fitCopy && !isPoster && !d.heroLayout,
    ratio = state.usingCustom ? state.custom.aspect : 'portrait',
    dims = ratio === 'square' ? [1080, 1080] : ratio === 'landscape' ? [1200, 900] : [1080, 1350];
  c.width = dims[0];
  c.height = dims[1];
  const x = c.getContext('2d');

  if (!state.usingCustom && d.heroLayout) {
    await paintHeroCard(x, d, c.width, c.height);
  } else if (isPoster) {
    await paintPosterCanvas(x, d, c.width, c.height);
  } else {
    await paintBackground(x, d, c.width, c.height);
    paintPattern(x, state.usingCustom ? state.custom.pattern : 'none', c.width, c.height);
    const date = cardDateText();
    if (date) {
      x.fillStyle = d.textColor;
      x.globalAlpha = .75;
      x.textAlign = 'center';
      x.font = '700 24px Arial';
      x.fillText(date, c.width / 2, c.height * .06);
      x.globalAlpha = 1;
    }
    // Festival artwork always draws when present; the user's photo (if any)
    // gets its own separate frame instead of replacing it (item 15) --
    // corner-inset over the art for isFit's fixed-zone layout (matching
    // .dual-frame-fit), or a small frame right below the art for the
    // default/flow layout (matching .dual-frame-flow). With no artwork, the
    // photo keeps its normal full-size, user-positioned frame.
    if (d.image) {
      const img = await loadImg(d.image);
      if (img) {
        const artW = c.width * 0.78;
        const artH = c.height * (d.compactArt ? 0.08 : 0.23);
        const px = (c.width - artW) / 2;
        const py = c.height * 0.11;
        x.save();
        roundedPath(x, px, py, artW, artH, 24);
        x.clip();
        drawCoverImage(x, img, px, py, artW, artH, (d.imageFocusY ?? 50) / 100);
        x.restore();
        x.strokeStyle = d.border || '#fbbf24';
        x.lineWidth = 6;
        roundedPath(x, px, py, artW, artH, 24);
        x.stroke();

        if (state.photo) {
          const pimg = await loadImg(state.photo);
          if (pimg) {
            if (isFit) {
              const size = c.width * 0.20, ppx = c.width * 0.91 - size, ppy = c.height * 0.24;
              paintPhoto(x, pimg, ppx, ppy, size);
            } else {
              const size = c.width * 0.26, ppx = (c.width - size) / 2, ppy = py + artH + c.height * 0.02;
              paintPhoto(x, pimg, ppx, ppy, size);
            }
          }
        }
      }
    } else if (state.photo) {
      const img = await loadImg(state.photo);
      if (img) {
        const size = Math.min(c.width, c.height) * state.photoCfg.frameSize / 100,
          px = (c.width - size) / 2,
          py = c.height * state.photoCfg.frameY / 100;
        paintPhoto(x, img, px, py, size);
      }
    }
    paintDecor(x, d, c.width, c.height);
    if (isFit) paintFitCopy(x, d, c.width, c.height); else paintCopy(x, d, c.width, c.height);
    const credit = footerCredit();
    if (credit) {
      x.font = '700 20px Arial';
      x.globalAlpha = .72;
      x.textAlign = 'center';
      x.fillText(credit, c.width / 2, c.height * .92);
    }
    x.font = '700 18px Arial';
    x.globalAlpha = .65;
    x.textAlign = 'center';
    x.fillText('MADE WITH WISHCRAFT', c.width / 2, c.height * .95);
    x.globalAlpha = 1;
  }

  return new Promise((res) => {
    try {
      c.toBlob((blob) => {
        if (blob) res(blob);
        else {
          const dataUrl = c.toDataURL('image/png');
          fetch(dataUrl).then(r => r.blob()).then(res).catch(() => res(null));
        }
      }, 'image/png', 1);
    } catch (e) {
      try {
        const dataUrl = c.toDataURL('image/png');
        fetch(dataUrl).then(r => r.blob()).then(res).catch(() => res(null));
      } catch (err) {
        res(null);
      }
    }
  });
}

async function paintPosterCanvas(x, d, w, h) {
  // Use the synced, user-selected festival (cardTitleText() reads state.fields.festival)
  // rather than the template's own fixed `festival` field, so a template shared across
  // more than one festival (e.g. the Independence Day poster also used for Republic Day)
  // shows the festival the user actually selected, not whichever the template defaults to.
  const festivalName = cardTitleText().toUpperCase();
  const subtitle = d.subtitle || 'Celebrate Safe, Healthy & Happy';
  const tagline = d.tagline || 'Light up happiness, not pollution. Choose safety. Choose health.';
  const l = state.layout, date = cardDateText(), sender = data().sender, credit = footerCredit();

  // Background body
  x.fillStyle = d.bodyBg || '#ffffff';
  x.fillRect(0, 0, w, h);

  // Header Banner
  const headerHeight = h * 0.16;
  const headerGrad = x.createLinearGradient(0, 0, w, headerHeight);
  headerGrad.addColorStop(0, d.colors ? d.colors[0] : '#180928');
  headerGrad.addColorStop(1, d.colors && d.colors[1] ? d.colors[1] : '#35104a');
  x.fillStyle = headerGrad;
  x.fillRect(0, 0, w, headerHeight);

  // Header text
  x.fillStyle = d.headerTextColor || '#ffffff';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = '900 58px Arial, sans-serif';
  x.fillText(festivalName, w / 2, headerHeight * 0.42);

  x.font = '700 28px Arial, sans-serif';
  x.fillStyle = d.accentColor || '#fbbf24';
  x.fillText(subtitle, w / 2, headerHeight * 0.78);

  let currentY = headerHeight + 35;

  // Date
  if (date) {
    x.font = '700 20px Arial';
    x.fillStyle = '#64748b';
    x.textAlign = 'center';
    x.fillText(date, w / 2, currentY);
    currentY += 30;
  }

  // Traditional artwork always draws when present; the user's photo (if
  // any) gets its own separate, smaller frame right after it instead of
  // replacing it (item 15).
  if (d.image) {
    try {
      const img = await loadImg(d.image);
      const artW = w * 0.88;
      const artH = h * 0.24;
      const px = (w - artW) / 2;
      x.save();
      roundedPath(x, px, currentY, artW, artH, 20);
      x.clip();
      drawCoverImage(x, img, px, currentY, artW, artH, (d.imageFocusY ?? 50) / 100);
      x.restore();
      x.strokeStyle = (d.accentColor || '#ea580c') + '55';
      x.lineWidth = 4;
      roundedPath(x, px, currentY, artW, artH, 20);
      x.stroke();
      currentY += artH + 25;
      if (state.photo) {
        const pimg = await loadImg(state.photo);
        if (pimg) {
          const photoSize = w * 0.26, ppx = (w - photoSize) / 2;
          paintPhoto(x, pimg, ppx, currentY, photoSize);
          currentY += photoSize + 25;
        }
      }
    } catch(e) {
      currentY += 15;
    }
  } else if (state.photo) {
    const img = await loadImg(state.photo);
    const photoSize = Math.min(w, h) * (state.photoCfg.frameSize / 100) * 1.1;
    const px = (w - photoSize) / 2;
    paintPhoto(x, img, px, currentY, photoSize);
    currentY += photoSize + 25;
  } else {
    currentY += 15;
  }

  // Message area
  currentY += (l.copyShift || 0) * 2;
  x.fillStyle = d.textColor || '#1e293b';
  x.textAlign = 'center';
  x.textBaseline = 'top';

  const greeting = cardTitle();
  x.font = `800 ${l.titleSize * 1.4}px ${FONT_MAP[d.font] || 'sans-serif'}`;
  const titleLines = measureLines(x, greeting, w * 0.85);
  currentY = drawLines(x, titleLines, w / 2, currentY, l.titleSize * 1.6);
  currentY += 15;

  x.font = `600 ${l.bodySize * 1.3}px ${BODY_FONT}`;
  const bodyLines = measureLines(x, $('#message').value, w * 0.85);
  currentY = drawLines(x, bodyLines, w / 2, currentY, l.bodySize * 1.6);

  if (sender) {
    currentY += 20;
    x.font = `700 ${l.bodySize * 1.3}px Arial`;
    x.fillStyle = d.accentColor || '#d97706';
    x.fillText(`— ${sender}`, w / 2, currentY);
    currentY += 35;
  }

  // Tagline banner -- positioned relative to the flowing content (not a fixed
  // h*0.88 offset) so there's no leftover blank gap now that the four
  // health/safety pillar boxes have been removed.
  const taglineY = Math.min(Math.max(currentY + 40, h * 0.74), h * 0.86);
  x.font = 'italic 700 22px Arial, sans-serif';
  x.fillStyle = d.textColor || '#1e293b';
  x.textAlign = 'center';
  x.fillText(tagline, w / 2, taglineY);

  // Footer & credits
  x.fillStyle = '#64748b';
  x.font = '700 19px Arial';
  if (credit) {
    x.fillText(credit, w / 2, h * 0.93);
  }
  x.font = '700 16px Arial';
  x.fillText('MADE WITH WISHCRAFT', w / 2, h * 0.96);
}

// ---- fitCopy templates: shrink-to-fit typography inside a FIXED 1080x1350
// canvas / 4:5 card, instead of growing the card or squeezing the artwork.
// Badge and artwork sit in their own fixed-size/position zones (see
// .fit-badge/.fit-art-section in fixes.css and the matching h*0.11/h*0.23
// canvas geometry below); .card-copy occupies a third fixed zone, h*0.38 to
// h*0.88, exactly like the pre-existing (non-fitCopy) card layout already
// reserves for text. fitCardCopy() is the ONE function both the DOM preview
// (via cqw, since .card-preview is a cqw container) and paintFitCopy() (via
// px on the 1080-wide canvas) call for that zone's sizing -- same word-wrap,
// same shrink order (gaps before font), same enforced minimums, so both
// surfaces measure and decide identically, just expressed in different units.
const FIT_TITLE_MAX = 84, FIT_TITLE_MIN = 34;
const FIT_MSG_MAX = 46, FIT_MSG_MIN = 24;
const FIT_TAGLINE_SIZE = 26, FIT_SIG_SIZE = 36;
const FIT_GAP_MIN = 0.45;
// Canvas measureText() and real browser CSS text layout don't wrap at exactly
// the same point for the same nominal font -- small font-metric/kerning
// differences can push the DOM to one more line than the offscreen canvas
// measurement predicted. Measuring against a narrower width than the real
// 84%-wide box, and budgeting less than the real 50%-tall zone, is a one-sided
// safety margin: it only ever makes the canvas measurement UNDER-estimate how
// much fits, so the real (wider, taller) DOM box always has at least as much
// room as what was measured -- never less, so it can never actually overflow.
const FIT_BUDGET_H = (1350 * 0.88 - 1350 * 0.38) * 0.88; // 594, was 675
const FIT_MAX_WIDTH = 1080 * 0.78; // narrower than .card-copy's real 84% width

function fitCardCopy(d, title, message, opts) {
  const { hasSender = false, tagline = '' } = opts || {};
  const family = FONT_MAP[d.font] || 'sans-serif';
  const ctx = getFitContext();

  function measure(titleSize, msgSize, gapScale) {
    ctx.font = `800 ${titleSize}px ${family}`;
    const titleLines = measureLines(ctx, title, FIT_MAX_WIDTH);
    ctx.font = `600 ${msgSize}px ${BODY_FONT}`;
    const msgLines = measureLines(ctx, message, FIT_MAX_WIDTH);
    let tagLines = [];
    if (tagline) {
      ctx.font = `700 ${FIT_TAGLINE_SIZE}px ${BODY_FONT}`;
      tagLines = measureLines(ctx, tagline, FIT_MAX_WIDTH);
    }
    const topPad = 20 * gapScale;
    const titleH = titleLines.length * titleSize * 1.15;
    const titleGap = 14 * gapScale;
    const msgH = msgLines.length * msgSize * 1.25;
    const tagGap = tagline ? 20 * gapScale : 0;
    const tagH = tagLines.length * FIT_TAGLINE_SIZE * 1.3;
    const sigGap = hasSender ? 20 * gapScale : 0;
    const sigH = hasSender ? FIT_SIG_SIZE * 1.2 : 0;
    const total = topPad + titleH + titleGap + msgH + tagGap + tagH + sigGap + sigH;
    return { total, titleLines, msgLines, tagLines };
  }

  // Phase 1: full (preferred) font size, shrink inter-element gaps first.
  for (let g = 1; g >= FIT_GAP_MIN; g -= 0.05) {
    const r = measure(FIT_TITLE_MAX, FIT_MSG_MAX, g);
    if (r.total <= FIT_BUDGET_H) return { titleSize: FIT_TITLE_MAX, msgSize: FIT_MSG_MAX, gapScale: g, fits: true, ...r };
  }
  // Phase 2: gaps at floor, shrink title+message together down to enforced minimums.
  for (let s = 1; s >= 0; s -= 0.02) {
    const ts = FIT_TITLE_MIN + (FIT_TITLE_MAX - FIT_TITLE_MIN) * s;
    const ms = FIT_MSG_MIN + (FIT_MSG_MAX - FIT_MSG_MIN) * s;
    const r = measure(ts, ms, FIT_GAP_MIN);
    if (r.total <= FIT_BUDGET_H) return { titleSize: ts, msgSize: ms, gapScale: FIT_GAP_MIN, fits: true, ...r };
  }
  // Truly infeasible even at floor sizes (only possible with pathological
  // user-typed text, not any generated message) -- caller must warn rather
  // than clip/truncate; render at floor sizes with overflow left visible.
  return { titleSize: FIT_TITLE_MIN, msgSize: FIT_MSG_MIN, gapScale: FIT_GAP_MIN, fits: false, ...measure(FIT_TITLE_MIN, FIT_MSG_MIN, FIT_GAP_MIN) };
}

function paintFitCopy(x, d, w, h) {
  const sender = data().sender, family = FONT_MAP[d.font] || 'sans-serif';
  const top = h * 0.38;
  const fit = fitCardCopy(d, cardTitle(), $('#message').value, { hasSender: !!sender, tagline: d.tagline || '' });
  if (!fit.fits) toast('Message is long for this template — showing it at minimum readable size.');

  x.textAlign = 'center';
  x.textBaseline = 'top';
  let y = top + 20 * fit.gapScale;

  if (d.panel) {
    x.save();
    const isDark = isLightColor(d.textColor);
    x.fillStyle = isDark ? 'rgba(15, 6, 6, 0.75)' : 'rgba(255, 253, 250, 0.92)';
    x.strokeStyle = d.border || (isDark ? '#fbbf24' : '#e2e8f0');
    x.lineWidth = 3;
    roundedPath(x, w * .07, top - 12, w * .86, fit.total + 24, 24);
    x.fill();
    x.stroke();
    x.restore();
    x.fillStyle = isDark ? '#fffdfa' : '#1e112a';
  } else {
    x.fillStyle = d.textColor || '#ffffff';
  }

  x.font = `800 ${fit.titleSize}px ${family}`;
  y = drawLines(x, fit.titleLines, w / 2, y, fit.titleSize * 1.15);
  y += 14 * fit.gapScale;

  x.font = `600 ${fit.msgSize}px ${BODY_FONT}`;
  y = drawLines(x, fit.msgLines, w / 2, y, fit.msgSize * 1.25);

  if (d.tagline && fit.tagLines.length) {
    y += 20 * fit.gapScale;
    x.font = `italic 700 ${FIT_TAGLINE_SIZE}px ${BODY_FONT}`;
    x.fillStyle = d.textColor || '#ffffff';
    y = drawLines(x, fit.tagLines, w / 2, y, FIT_TAGLINE_SIZE * 1.3);
  }

  if (sender) {
    y += 20 * fit.gapScale;
    x.font = `700 ${FIT_SIG_SIZE}px ${BODY_FONT}`;
    x.fillStyle = d.accentColor || '#f59e0b';
    x.fillText(`— ${sender}`, w / 2, y);
  }
}

function paintCopy(x, d, w, h) {
  const sender = data().sender,
    align = state.usingCustom ? state.custom.alignment : 'center',
    alignX = align === 'left' ? w * .1 : align === 'right' ? w * .9 : w / 2,
    max = w * .8,
    hasArt = ((d.image && !state.photo) || state.photo) && !d.titleAbovePhoto,
    top = hasArt ? h * 0.38 : h * copyTopPct() / 100,
    // Matches the DOM's copyBottom in renderCard(): titleAbovePhoto's photo
    // sits below the text block rather than pushing it down, so the block's
    // bottom edge must stop above the photo instead of using the normal
    // near-bottom-of-card margin (see renderCard()'s copyBottom comment).
    bottom = (state.photo && d.titleAbovePhoto) ? h * Math.min(0.72, (state.photoCfg.frameY - 3) / 100) : h * .88,
    family = FONT_MAP[d.font] || 'sans-serif',
    scale = w / 360,
    l = state.layout;

  x.textAlign = align;
  x.textBaseline = 'top';
  let titleSize = l.titleSize * scale * 0.92, bodySize = l.bodySize * scale * 0.92, sigSize = Math.max(16, l.bodySize * .9) * scale, layout;

  for (let i = 0; i < 24; i++) {
    x.font = `800 ${titleSize}px ${family}`;
    const titleLines = measureLines(x, cardTitle(), max * 0.9);
    x.font = `600 ${bodySize}px ${BODY_FONT}`;
    const bodyLines = measureLines(x, $('#message').value, max * 0.9);
    const total = titleLines.length * titleSize * 1.15 + bodyLines.length * bodySize * (l.lineHeight / 100) + (sender ? sigSize * 1.2 + 30 * scale : 0) + 20 * scale;
    if (total <= bottom - top || bodySize <= 18) {
      layout = { titleLines, bodyLines, total };
      break;
    }
    titleSize *= .94;
    bodySize *= .94;
    sigSize *= .94;
  }

  let y = top + 20 * scale;
  if (d.panel) {
    x.save();
    const isDark = isLightColor(d.textColor);
    x.fillStyle = isDark ? 'rgba(15, 6, 6, 0.75)' : 'rgba(255, 253, 250, 0.92)';
    x.strokeStyle = d.border || (isDark ? '#fbbf24' : '#e2e8f0');
    x.lineWidth = 3 * scale;
    roundedPath(x, w * .07, top - 12 * scale, w * .86, (layout?.total || 0) + 48 * scale, 24 * scale);
    x.fill();
    x.stroke();
    x.restore();

    // High contrast text
    x.fillStyle = isDark ? '#fffdfa' : '#1e112a';
  } else {
    x.fillStyle = d.textColor || '#ffffff';
  }

  // Draw Title
  x.font = `800 ${titleSize}px ${family}`;
  y = drawLines(x, layout.titleLines, alignX, y, titleSize * 1.15);
  y += 14 * scale;

  // Draw Body Message
  x.font = `600 ${bodySize}px ${BODY_FONT}`;
  y = drawLines(x, layout.bodyLines, alignX, y, bodySize * (l.lineHeight / 100));

  // Draw Sender Signature
  if (sender) {
    y += 20 * scale;
    x.font = `700 ${sigSize}px ${BODY_FONT}`;
    x.fillStyle = d.accentColor || '#f59e0b';
    x.fillText(`— ${sender}`, alignX, y);
  }
}

function measureLines(x, text, max) {
  const out = [];
  String(text || '').split('\n').forEach(p => {
    if (!p.trim()) { out.push(''); return; }
    let cur = '';
    p.split(/\s+/).forEach(word => {
      const test = cur ? cur + ' ' + word : word;
      if (x.measureText(test).width > max && cur) {
        out.push(cur);
        cur = word;
      } else cur = test;
    });
    if (cur) out.push(cur);
  });
  return out.length ? out : [''];
}

function drawLines(x, lines, cx, y, line) {
  lines.forEach(l => {
    x.fillText(l, cx, y);
    y += line;
  });
  return y;
}

function paintPhoto(x, img, px, py, size) {
  const p = state.photoCfg,
    fx = focusPct(p.panX) / 100,
    fy = focusPct(p.panY) / 100,
    scale = Math.max(size / img.width, size / img.height) * p.zoom / 100,
    dw = img.width * scale,
    dh = img.height * scale,
    dx = px - (dw - size) * fx,
    dy = py - (dh - size) * fy;

  x.save();
  roundedPath(x, px, py, size, size, radiusNumber(p.shape, size));
  x.clip();
  x.globalAlpha = p.opacity / 100;
  x.drawImage(img, dx, dy, dw, dh);
  x.restore();

  x.strokeStyle = p.borderStyle === 'gold' ? '#d4af37' : p.borderColor;
  x.lineWidth = p.borderWidth * 2;
  if (p.borderStyle === 'dashed') x.setLineDash([18, 12]);
  roundedPath(x, px, py, size, size, radiusNumber(p.shape, size));
  x.stroke();
  x.setLineDash([]);
}

let _fitCtx = null;
function getFitContext() {
  if (!_fitCtx) _fitCtx = document.createElement('canvas').getContext('2d');
  return _fitCtx;
}

function measureTextWidth(text, fontWeight, fontSizePx, fontFamily) {
  const ctx = getFitContext();
  ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

// Fits "Happy Birthday, {name}" into a logical-unit box (same numeric space is
// reused as 1080-wide canvas px for export and as cqw-of-container for the DOM
// preview) so both surfaces compute an identical result from identical inputs.
function fitGreetingHeading(name, opts) {
  const {
    maxWidth, maxHeight, startSize = 96, minSize = 34, floorSize = 14,
    fontFamily = 'Georgia, serif', fontWeight = 800, lineHeightRatio = 1.15
  } = opts;
  const prefix = 'Happy Birthday,';
  const safeName = String(name || 'Friend').trim() || 'Friend';
  const nameLine = safeName;
  const full = `${prefix} ${nameLine}`;

  const fitsBox = (lines, sizes) => {
    const lineH = Math.max(...sizes) * lineHeightRatio;
    if (lines.length * lineH > maxHeight) return false;
    return lines.every((l, i) => measureTextWidth(l, fontWeight, sizes[i], fontFamily) <= maxWidth);
  };

  // Only accept a single-line fit while it stays reasonably large — a technically-fitting
  // but tiny single line (long name squeezed edge-to-edge) is worse than a well-sized 2-line wrap.
  const singleLineFloor = Math.max(minSize, startSize * 0.62);
  for (let size = startSize; size >= singleLineFloor; size -= 2) {
    if (fitsBox([full], [size])) return { lines: [{ text: full, fontSize: size }], lineHeight: size * lineHeightRatio };
  }

  for (let size = startSize; size >= minSize; size -= 2) {
    if (fitsBox([prefix, nameLine], [size, size])) {
      return { lines: [{ text: prefix, fontSize: size }, { text: nameLine, fontSize: size }], lineHeight: size * lineHeightRatio };
    }
  }

  const words = nameLine.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const wrapped = [];
    let cur = '';
    words.forEach(w => {
      const test = cur ? cur + ' ' + w : w;
      if (!cur || measureTextWidth(test, fontWeight, minSize, fontFamily) <= maxWidth) cur = test;
      else { wrapped.push(cur); cur = w; }
    });
    if (cur) wrapped.push(cur);
    const lines = [prefix, ...wrapped];
    if (fitsBox(lines, lines.map(() => minSize))) {
      return { lines: lines.map(t => ({ text: t, fontSize: minSize })), lineHeight: minSize * lineHeightRatio };
    }
    let size = minSize;
    while (size > floorSize && !fitsBox(lines, lines.map(() => size))) size -= 1;
    size = Math.max(size, floorSize);
    return { lines: lines.map(t => ({ text: t, fontSize: size })), lineHeight: size * lineHeightRatio, compact: true };
  }

  // Single unbroken name still too wide at minSize: shrink that line alone rather than clip it.
  let nameSize = minSize;
  while (nameSize > floorSize && measureTextWidth(nameLine, fontWeight, nameSize, fontFamily) > maxWidth) nameSize -= 1;
  nameSize = Math.max(nameSize, floorSize);
  return {
    lines: [{ text: prefix, fontSize: minSize }, { text: nameLine, fontSize: nameSize }],
    lineHeight: Math.max(minSize, nameSize) * lineHeightRatio,
    compact: nameSize < minSize
  };
}

// The ONE set of fit parameters for hero-template greeting headings. Both
// renderCard() (DOM preview) and paintHeroCard() (PNG export) call this same
// function with the same template's d.titleArea, so the safe area, starting
// size, minimum size, wrapping decisions, line count and line height are
// identical by construction, not by separately-maintained matching constants.
const HERO_TITLE_FIT = { startSize: 96, minSize: 40, floorSize: 18, fontWeight: 800, lineHeightRatio: 1.12 };
function fitHeroTitle(d, name) {
  const area = d.titleArea || { top: 4, left: 4, width: 92, height: 30 };
  return fitGreetingHeading(name, {
    maxWidth: area.width / 100 * 1080,
    maxHeight: area.height / 100 * 1350,
    startSize: HERO_TITLE_FIT.startSize,
    minSize: HERO_TITLE_FIT.minSize,
    floorSize: HERO_TITLE_FIT.floorSize,
    fontFamily: FONT_MAP[d.font] || 'Georgia, serif',
    fontWeight: HERO_TITLE_FIT.fontWeight,
    lineHeightRatio: HERO_TITLE_FIT.lineHeightRatio
  });
}

async function paintHeroCard(x, d, w, h) {
  const img = d.backgroundImage ? await loadImg(d.backgroundImage) : null;
  if (img) drawCoverImage(x, img, 0, 0, w, h);
  else { x.fillStyle = '#12100f'; x.fillRect(0, 0, w, h); }

  const family = FONT_MAP[d.font] || 'Georgia, serif';
  const date = cardDateText();
  if (date) {
    x.save();
    x.fillStyle = d.textColor || '#ffffff';
    x.globalAlpha = .85;
    x.textAlign = 'right';
    x.textBaseline = 'top';
    x.font = `700 ${Math.round(h * 0.0185)}px Arial`;
    x.fillText(date, w * 0.94, h * 0.028);
    x.restore();
  }

  const area = d.titleArea || { top: 4, left: 4, width: 92, height: 30 };
  const boxX = w * area.left / 100, boxY = h * area.top / 100, boxW = w * area.width / 100, boxH = h * area.height / 100;
  const scrim = d.scrimColor || '0,0,0';

  // Same flat-then-fade scrims as the DOM preview (renderCard()'s hero
  // branch) behind the title and sender -- drawn before that text so it
  // reads clearly against a busy photo instead of relying on shadow alone.
  const titleScrimBottom = Math.min(h * 0.6, boxY + boxH + h * 0.08);
  const tgrad = x.createLinearGradient(0, 0, 0, titleScrimBottom);
  tgrad.addColorStop(0, `rgba(${scrim},0.6)`);
  tgrad.addColorStop(0.55, `rgba(${scrim},0.6)`);
  tgrad.addColorStop(1, `rgba(${scrim},0)`);
  x.fillStyle = tgrad;
  x.fillRect(0, 0, w, titleScrimBottom);

  const fit = fitHeroTitle(d, data().recipient);
  x.textAlign = 'center';
  x.textBaseline = 'top';
  x.fillStyle = d.textColor || '#ffffff';
  let ty = boxY + Math.max(0, (boxH - fit.lines.length * fit.lineHeight) / 2);
  fit.lines.forEach(line => {
    x.font = `800 ${line.fontSize}px ${family}`;
    x.fillText(line.text, boxX + boxW / 2, ty);
    ty += fit.lineHeight;
  });

  const scrimTop = h * 0.72;
  const grad = x.createLinearGradient(0, h, 0, scrimTop);
  grad.addColorStop(0, `rgba(${scrim},0.92)`);
  grad.addColorStop(0.65, `rgba(${scrim},0.92)`);
  grad.addColorStop(1, `rgba(${scrim},0)`);
  x.fillStyle = grad;
  x.fillRect(0, scrimTop, w, h - scrimTop);

  if (state.photo) {
    const pimg = await loadImg(state.photo);
    if (pimg) {
      const defaults = d.photoFrameDefaults || {};
      const frameSize = defaults.frameSize ?? state.photoCfg.frameSize;
      const frameY = defaults.frameY ?? state.photoCfg.frameY;
      const size = Math.min(w, h) * frameSize / 100;
      const px = (w - size) / 2, py = h * frameY / 100;
      paintPhoto(x, pimg, px, py, size);
    }
  }

  const sender = data().sender;
  const credit = footerCredit();
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  if (sender) {
    x.font = `700 ${Math.round(h * 0.023)}px ${BODY_FONT}`;
    x.fillStyle = d.accentColor || d.textColor || '#ffffff';
    x.fillText(`— ${sender}`, w / 2, h * 0.90);
  }

  if (credit) {
    x.font = '700 20px Arial';
    x.globalAlpha = .72;
    x.textAlign = 'center';
    x.fillStyle = d.textColor || '#ffffff';
    x.fillText(credit, w / 2, h * .955);
    x.globalAlpha = 1;
  }
  x.font = '700 18px Arial';
  x.globalAlpha = .65;
  x.textAlign = 'center';
  x.fillStyle = d.textColor || '#ffffff';
  x.fillText('MADE WITH WISHCRAFT', w / 2, h * .975);
  x.globalAlpha = 1;
}

async function paintBackground(x, d, w, h) {
  const custom = state.usingCustom ? state.custom : null;
  if (custom?.backgroundImage) {
    const img = await loadImg(custom.backgroundImage);
    if (img) drawCoverImage(x, img, 0, 0, w, h);
    x.fillStyle = '#0004';
    x.fillRect(0, 0, w, h);
    return;
  }
  const colors = d.colors || (custom ? [custom.color1, custom.color2] : ['#071426', '#1e2950']);
  if (custom?.backgroundType === 'solid') {
    x.fillStyle = custom.color1;
    x.fillRect(0, 0, w, h);
    return;
  }
  if (custom?.backgroundType === 'radial') {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .7);
    g.addColorStop(0, colors[1] || colors[0]);
    g.addColorStop(1, colors[0]);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    return;
  }
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1] || colors[0]);
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
}

function paintDecor(x, d, w, h) {
  const items = state.usingCustom ? state.custom.stickers : decorationsForDesign(d);
  x.textAlign = 'left';
  items.forEach(s => {
    const item = typeof s === 'string' ? decorItem(s, items.indexOf(s)) : s;
    x.save();
    x.translate(w * item.x / 100, h * item.y / 100);
    x.rotate((item.rotation || 0) * Math.PI / 180);
    x.font = `${(item.size || 55) * 2}px Arial`;
    x.fillText(item.emoji, 0, 0);
    x.restore();
  });
}

function occasionDecor() {
  if (state.occasion === 'festival') return festivalDecor(data().festival);
  return {
    birthday: ['🎂', '🎈', '🎉', '🎁'],
    anniversary: ['💍', '💕', '🌸', '✨'],
    baby: ['👶', '🍼', '🌟', '💕'],
    congratulations: ['🎉', '🏆', '🌟', '🎈'],
    housewarming: ['🏡', '🌿', '✨', '💕'],
    graduation: ['🎓', '🏆', '🌟', '🎉'],
    retirement: ['🌴', '🎊', '🌟', '💐'],
    getwell: ['💐', '💕', '🌿', '🌟'],
    thanks: ['💛', '🌸', '💕', '✨'],
    custom: ['✨', '🎉', '🌟', '💕']
  }[state.occasion] || ['✨', '🎉', '🌟', '💕'];
}

function festivalDecor(name) {
  return {
    'Raksha Bandhan': ['🪔', '✨', '🌸', '🪔'],
    'Diwali': ['🪔', '✨', '🎆', '🌟'],
    'Uttarayan / Makar Sankranti': ['🪁', '☀️', '🎉', '✨'],
    'Holi': ['🌈', '🎉', '🌸', '✨'],
    'Navratri': ['🪔', '💃', '✨', '🌸'],
    'Janmashtami': ['🪈', '🦚', '✨', '🌸'],
    'Ganesh Chaturthi': ['🐘', '🪔', '✨', '🌺'],
    'Dussehra': ['🏹', '🪔', '✨', '🌟'],
    'Bestu Varas (Gujarati New Year)': ['🪔', '🌿', '✨', '🌸'],
    'Independence Day': ['🇮🇳', '🕊️', '✨', '🌟'],
    'Republic Day': ['🇮🇳', '🕊️', '✨', '🌟'],
    'Valentine\'s Day': ['❤️', '💕', '🌹', '✨'],
    'Christmas': ['🎄', '⭐', '🎁', '✨'],
    'Eid': ['🌙', '✨', '💐', '🤲'],
    'New Year': ['🎆', '🎉', '🌟', '✨'],
    'Thanksgiving': ['🍁', '🕯️', '💛', '✨']
  }[name] || ['🎆', '✨', '🌟', '🎉'];
}

function templateDecor(t) {
  return t.stickers?.length ? t.stickers : occasionDecor();
}

function decorationsForDesign(d) {
  if (d.decor) return d.decor;
  const stickers = d.festivals ? (d.stickers?.length ? d.stickers : occasionDecor()) : occasionDecor();
  return stickers.map((emoji, i) => decorItem(emoji, i));
}

function decorItem(emoji, i) {
  return { emoji, x: [8, 84, 9, 84][i] ?? 50, y: [10, 10, 86, 86][i] ?? 50, size: [38, 38, 34, 34][i] ?? 34, rotation: 0 };
}

function stickerStyle(s, i) {
  const item = typeof s === 'string' ? decorItem(s, i) : s;
  return `${item.x < 50 ? 'left' : 'right'}:${item.x < 50 ? item.x : 100 - item.x}%;${item.y < 50 ? 'top' : 'bottom'}:${item.y < 50 ? item.y : 100 - item.y}%;font-size:${item.size || 34}px;transform:rotate(${item.rotation || 0}deg)`;
}

function selectFestivalTemplate(name) {
  // Falls back to a general template when a festival has no dedicated design yet
  // (e.g. Thanksgiving currently has none), so state.template never dangles on
  // whatever unrelated design happened to be selected before.
  const match = PRESET_TEMPLATES.find(t => t.festivals?.includes(name) && t.styleType === 'poster') || PRESET_TEMPLATES.find(t => t.festivals?.includes(name));
  state.template = match ? match.id : 'festive';
  state.usingCustom = false;
}

// Card-headline-only display names. The Festival selector/category/filter labels
// keep the full name (e.g. FESTIVAL_OPTIONS, template category text) -- only the
// generated greeting headline (live preview, PNG export, poster banner) is shortened.
const FESTIVAL_HEADLINE_OVERRIDES = { 'Bestu Varas (Gujarati New Year)': 'New Year' };
function festivalHeadline(name) {
  return FESTIVAL_HEADLINE_OVERRIDES[name] || name;
}

function cardTitleText() {
  const d = data();
  return festivalHeadline(d.festival) || 'Festival';
}

function cardTitle() {
  const d = data(), name = subjectFor(state.occasion, d);
  const festivalName = festivalHeadline(d.festival) || 'Festival';

  // Addressed to the baby (a baby name was given) vs addressed to the
  // parents (only a parent name was given) need different wording, not the
  // same "Welcome, {name}" template applied to whichever name is present.
  if (state.occasion === 'baby') {
    return d.baby ? `Welcome, ${d.baby}` : `Congratulations, ${d.parents || 'the Family'}`;
  }
  // Reason-aware headings (item 4): "Congratulations on {phrase}, {Name}"
  // when a reason/degree was given, otherwise just "Congratulations, {Name}".
  if (state.occasion === 'congratulations') {
    const phrase = reasonHeadingPhrase(d.reason);
    return phrase ? `Congratulations on ${phrase}, ${name}` : `Congratulations, ${name}`;
  }
  if (state.occasion === 'graduation') {
    const phrase = reasonHeadingPhrase(d.reason) || 'Your Graduation';
    return `Congratulations on ${phrase}, ${name}`;
  }

  return {
    birthday: `Happy Birthday, ${name}`,
    anniversary: `Happy Anniversary, ${name}`,
    housewarming: `Congratulations on Your New Home, ${name}`,
    retirement: `Happy Retirement, ${name}`,
    getwell: `Get Well Soon, ${name}`,
    festival: d.recipient ? `Happy ${festivalName}, ${name}` : `Happy ${festivalName}`,
    thanks: `Thank You, ${name}`,
    custom: `${d.title || 'Special Wishes'}, ${name}`
  }[state.occasion] || `Best Wishes, ${name}`;
}

// The default .text-panel CSS is a pale cream panel, correct for templates
// with dark text. A panel:true template whose textColor is light (e.g. the
// "royal" festival templates, meant to read against a dark card background)
// needs a dark panel instead, or the text is unreadable against its own
// backdrop (item 11: Royal Deepawali's pale panel + white text). Mirrors the
// same isLightColor(d.textColor) check paintCopy()/paintFitCopy() use for
// the PNG export, so preview and download match.
function panelStyleOverride(d) {
  if (!d.panel || !isLightColor(d.textColor)) return '';
  return `background:rgba(15,6,6,.75);border-color:${d.border || '#fbbf24'}88`;
}

function copyTopPct() {
  const d = design(), base = (state.photo && !d.titleAbovePhoto) ? state.photoCfg.frameY + state.photoCfg.frameSize + 5 : d.panel ? 31 : 24;
  return Math.max(12, Math.min(72, base + state.layout.copyShift));
}

function focusPct(value) {
  return Math.max(0, Math.min(100, (Number(value) + 100) / 2));
}

function footerCredit() {
  return state.settings.showDeveloperCredit ? String(state.settings.developerCredit || '').trim() : '';
}

function validDateValue(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? v : '';
}

function cardDateText() {
  if (!state.showCardDate) return '';
  const v = validDateValue(state.cardDate);
  if (!v) return '';
  return new Date(v + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
}

function patternLayer(p) {
  return p === 'none' ? '' : `<div style="position:absolute;inset:0;opacity:.16;background-image:${p === 'dots' ? 'radial-gradient(#fff 2px,transparent 2px)' : p === 'geometric' ? 'linear-gradient(30deg,#fff 12%,transparent 12.5%,transparent 87%,#fff 87.5%)' : 'none'};background-size:${p === 'dots' ? '22px 22px' : '40px 70px'};pointer-events:none">${['stars', 'confetti', 'floral'].includes(p) ? (p === 'stars' ? '✦　·　✧　·　'.repeat(18) : p === 'confetti' ? '▰　●　▲　'.repeat(18) : '❀　❁　'.repeat(20)) : ''}</div>`;
}

function paintPattern(x, p, w, h) {
  if (p === 'none') return;
  x.save();
  x.globalAlpha = .13;
  x.fillStyle = '#fff';
  x.font = '34px Arial';
  const sym = { dots: '•', stars: '✦', geometric: '◇', confetti: '▰', floral: '❀' }[p];
  for (let y = 30; y < h; y += 70) for (let a = 20; a < w; a += 90) x.fillText(sym, a + (y / 70 % 2) * 30, y);
  x.restore();
}

function saveWorking() {
  const copy = {
    occasion: state.occasion,
    tone: state.tone,
    messageIndex: state.messageIndex,
    fields: state.fields,
    template: state.template,
    festivalFilter: state.festivalFilter,
    photo: null,
    photoCfg: state.photoCfg,
    layout: state.layout,
    cardDate: state.cardDate,
    showCardDate: state.showCardDate,
    custom: state.custom,
    usingCustom: state.usingCustom
  };
  try {
    localStorage.setItem(KEYS.draft, JSON.stringify(copy));
  } catch (e) {
    toast('Draft saved without photo');
  }
}

function persistCards() {
  try {
    localStorage.setItem(KEYS.cards, JSON.stringify(state.cards));
  } catch (e) {
    state.cards.shift();
    toast('Storage full — newest card was not saved');
  }
}

function readImage(file, done) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => done(r.result);
  r.readAsDataURL(file);
}

function loadImg(src) {
  return new Promise((res) => {
    if (!src) return res(null);
    const i = new Image();
    if (typeof location !== 'undefined' && location.protocol !== 'file:' && !src.startsWith('data:')) {
      i.crossOrigin = 'anonymous';
    }
    i.onload = () => res(i);
    i.onerror = (e) => {
      console.warn('Image load failed for:', src, e);
      res(null);
    };
    i.src = src;
  });
}

function drawCoverImage(x, img, dx, dy, dw, dh, focusY = 0.5, focusX = 0.5) {
  if (!img || !img.width || !img.height) return;
  const scale = Math.max(dw / img.width, dh / img.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.width - sw) * focusX;
  const sy = (img.height - sh) * focusY;
  try {
    x.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  } catch (e) {
    console.warn('drawCoverImage error:', e);
  }
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function openModal(id) {
  $('#' + id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  $('#' + id).classList.remove('active');
  document.body.style.overflow = '';
}

function toast(s) {
  const t = $('#toast');
  t.textContent = s;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function aspectValue(a) {
  return a === 'square' ? '1/1' : a === 'landscape' ? '4/3' : '9/16';
}

function radius(s) {
  return { square: '0', soft: '12px', heavy: '24px', pill: '999px', circle: '50%' }[s];
}

function radiusNumber(s, z) {
  return { square: 0, soft: 24, heavy: 48, pill: z / 2, circle: z / 2 }[s];
}

function roundedPath(x, a, b, w, h, r) {
  x.beginPath();
  x.roundRect(a, b, w, h, r);
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(s = '') {
  return escapeHtml(String(s));
}
