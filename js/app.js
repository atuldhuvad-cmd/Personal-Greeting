const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], KEYS = { settings: 'wishcraft_settings_v2', cards: 'wishcraft_cards_v2', draft: 'wishcraft_working_v2' };
const state = {
  occasion: 'festival',
  tone: 'joyful',
  messageIndex: 0,
  fields: { festival: 'Diwali' },
  template: 'diwali-poster',
  festivalFilter: 'Diwali',
  photo: null,
  photoCfg: { zoom: 100, panX: 0, panY: 0, frameSize: 32, frameY: 8, shape: 'soft', borderStyle: 'solid', borderWidth: 4, borderColor: '#ffffff', opacity: 100, shadow: true },
  layout: { titleSize: 28, bodySize: 17, copyShift: 0, lineHeight: 125 },
  cardDate: todayValue(),
  showCardDate: true,
  custom: { aspect: 'portrait', color1: '#3b0764', color2: '#ec4899', backgroundType: 'linear', pattern: 'none', backgroundImage: null, font: 'sans', textColor: '#ffffff', fontSize: 36, alignment: 'center', lineHeight: 1.4, textGlow: false, stickers: [] },
  usingCustom: false,
  selectedSticker: null,
  cards: [],
  settings: { sender: '', theme: 'dark', developerCredit: 'Developed by Dr.Atul Dhuvad', showDeveloperCredit: true },
  installPrompt: null
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  const fixes = document.createElement('link');
  fixes.rel = 'stylesheet';
  fixes.href = 'css/fixes.css';
  document.head.append(fixes);

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
  panel.innerHTML = '<div class="step"><span>4</span><div><h3>Upload or take photo</h3><p>Adjust the photo here and the same placement is used in the card.</p></div></div>';
  if (!$('#photoLivePreview')) {
    $('#photoControls').insertAdjacentHTML('beforebegin', '<div id="photoLivePreview" class="photo-live-preview"><div class="photo-live-title">Live card photo placement</div><div class="photo-stage"><div id="photoStageFrame" class="photo-stage-frame empty-photo"><span>Photo preview appears here</span></div></div></div>');
  }
  if (!$('#frameSize')) {
    $('#panX').closest('label').insertAdjacentHTML('afterend', '<label>Photo size <output id="frameSizeOut">32%</output><input id="frameSize" type="range" min="20" max="50" value="32"></label><label>Photo vertical place <output id="frameYOut">8%</output><input id="frameY" type="range" min="4" max="38" value="8"></label>');
  }
  if (!$('#borderColorHint')) {
    $('#borderColor').closest('label').insertAdjacentHTML('beforeend', '<small id="borderColorHint" class="field-hint">Applies to Solid and Dashed. Gold metallic keeps a gold border.</small>');
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
  $('#dynamicFields').insertAdjacentHTML('afterend', '<div class="date-row"><label>Card date<input id="cardDate" type="date"></label><label class="check compact-check"><input id="showCardDate" type="checkbox" checked> Show date</label></div>');
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
  state.cardDate = validDateValue(state.cardDate) || todayValue();
  state.showCardDate = state.showCardDate !== false;
  if (!state.fields) state.fields = {};
  if (state.occasion === 'festival' && !state.fields.festival) {
    state.fields.festival = 'Diwali';
  }
  if (!state.festivalFilter) {
    state.festivalFilter = state.occasion === 'festival' ? (state.fields.festival || 'Diwali') : 'all';
  }
  if (!PRESET_TEMPLATES.some(t => t.id === state.template)) {
    state.template = 'diwali-poster';
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
  $('#cardDate').oninput = e => { state.cardDate = validDateValue(e.target.value) || todayValue(); renderCard(); saveWorking(); };
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
      state.festivalFilter = e.target.value;
      renderFestivalFilter();
      renderTemplates();
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

function renderOccasions() {
  const selected = OCCASIONS.find(o => o.id === state.occasion) || OCCASIONS[0];
  $('#occasionGrid').innerHTML = `<label class="occasion-select">Choose an occasion<select id="occasionSelect">${OCCASIONS.map(o => `<option value="${o.id}" ${o.id === state.occasion ? 'selected' : ''}>${o.icon} ${o.name}</option>`).join('')}</select><small>${selected.hint}</small></label>`;
  $('#occasionSelect').onchange = e => {
    state.occasion = e.target.value;
    state.messageIndex = 0;
    state.fields = {};
    if (state.occasion === 'festival') {
      state.fields.festival = 'Diwali';
      state.festivalFilter = 'Diwali';
      selectFestivalTemplate('Diwali');
    } else {
      state.festivalFilter = 'all';
      if (!PRESET_TEMPLATES.some(t => t.id === state.template && !t.festivals)) {
        state.template = 'festive';
      }
    }
    renderOccasions();
    renderFields();
    generate();
    renderFestivalFilter();
    renderTemplates();
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
      state.fields[el.dataset.field] = el.value;
      state.messageIndex = 0;
      if (el.dataset.field === 'festival') {
        state.festivalFilter = el.value;
        selectFestivalTemplate(el.value);
        renderFestivalFilter();
      }
      generate();
      renderTemplates();
      saveWorking();
    };
  });

  if (state.occasion === 'festival' && state.fields.festival) {
    selectFestivalTemplate(state.fields.festival);
  }
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
        state.festivalFilter = btn.dataset.filter;
        if (select) select.value = state.festivalFilter;
        renderFestivalFilter();
        renderTemplates();
      };
    });
  }
}

function templatesForCurrentFilter() {
  const f = state.festivalFilter;
  if (!f || f === 'all') {
    return PRESET_TEMPLATES;
  }
  if (f === 'General') {
    return PRESET_TEMPLATES.filter(t => !t.festivals);
  }
  return PRESET_TEMPLATES.filter(t => t.festivals?.includes(f));
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
    const miniPillars = isPoster && t.pillars ? `<div class="thumb-pillars">${t.pillars.map(p => `<span>${p.icon}</span>`).join('')}</div>` : '';
    const badgeText = t.badge || (isPoster ? 'POSTER' : 'THEME');

    return `
      <button class="template-card ${isActive ? 'active' : ''}" data-id="${t.id}">
        <div class="template-thumb" style="background:${t.background}; color:${t.textColor};">
          <div class="thumb-badge" style="background:${t.accentColor || '#f59e0b'};">${badgeText}</div>
          <div class="thumb-center">
            ${t.image ? `<img src="${t.image}" alt="" class="thumb-art-img">` : `<span class="thumb-icon">${templateDecor(t)[0]}</span>`}
            <span class="thumb-title">${escapeHtml(t.name.replace(/^(Diwali|Holi|Navratri|Uttarayan|Raksha Bandhan|Janmashtami|Ganesh Chaturthi|Dussehra|Bestu Varas|Independence Day|Valentine's Day|Christmas|Eid|New Year)\s*/i, ''))}</span>
          </div>
          ${miniPillars}
        </div>
        <div class="template-card-info">
          <strong>${escapeHtml(t.name)}</strong>
          <small>${escapeHtml(t.category)}</small>
        </div>
      </button>
    `;
  }).join('');

  $$('.template-card').forEach(b => b.onclick = () => {
    state.template = b.dataset.id;
    state.usingCustom = false;
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
  return PRESET_TEMPLATES.find(t => t.id === state.template) || PRESET_TEMPLATES[0];
}

function renderCard() {
  const d = design(), preview = $('#cardPreview'), decor = decorationsForDesign(d), sender = data().sender, l = state.layout, credit = footerCredit(), date = cardDateText();
  const isPoster = !state.usingCustom && d.styleType === 'poster';

  preview.className = `card-preview ${isPoster ? 'is-poster' : ''}`;
  preview.classList.toggle('has-photo', !!state.photo);
  preview.classList.toggle('has-panel', !!d.panel && !isPoster);
  preview.style.cssText = `background:${d.background}; color:${d.textColor}; font-family:${FONT_MAP[d.font] || 'sans-serif'}; text-align:${state.usingCustom ? state.custom.alignment : 'center'}; aspect-ratio:${state.usingCustom ? aspectValue(state.custom.aspect) : '4/5'}`;

  const pattern = state.usingCustom ? patternLayer(state.custom.pattern) : '';
  const stickers = state.usingCustom ? state.custom.stickers.map(s => `<span class="placed-sticker" style="left:${s.x}%;top:${s.y}%;font-size:${s.size}px;transform:rotate(${s.rotation}deg)">${s.emoji}</span>`).join('') :
    (!isPoster ? decor.map((s, i) => `<span class="placed-sticker" style="${stickerStyle(s, i)}">${escapeHtml(s.emoji || s)}</span>`).join('') : '');

  const artSrc = state.photo || d.image;

  if (isPoster) {
    const festivalName = (d.festival || cardTitleText()).toUpperCase();
    const subtitle = d.subtitle || 'Celebrate Safe, Healthy & Happy';
    const tagline = d.tagline || 'Light up happiness, not pollution. Choose safety. Choose health.';
    const pillarsHtml = (d.pillars || []).map(p => `
      <div class="infographic-pillar" style="border-color:${d.accentColor || '#f59e0b'}40">
        <span class="pillar-emoji">${p.icon}</span>
        <div class="pillar-text">
          <strong style="color:${d.accentColor || '#f59e0b'}">${escapeHtml(p.title)}</strong>
          <span>${escapeHtml(p.desc)}</span>
        </div>
      </div>
    `).join('');

    preview.innerHTML = `
      ${pattern}
      <div class="poster-container">
        <header class="poster-header" style="background:${d.headerBg || d.accentColor || '#180928'}; color:${d.headerTextColor || '#ffffff'}">
          <div class="poster-main-title">${escapeHtml(festivalName)}</div>
          <div class="poster-subtitle" style="color:${d.accentColor || '#fbbf24'}">${escapeHtml(subtitle)}</div>
        </header>

        <div class="poster-body" style="background:${d.bodyBg || '#ffffff'}">
          ${date ? `<div class="poster-date">${escapeHtml(date)}</div>` : ''}
          
          ${artSrc ? `
            <div class="poster-art-section" style="border-color:${d.accentColor || '#ea580c'}44">
              <img src="${artSrc}" alt="${escapeHtml(festivalName)}" class="poster-art-img">
            </div>
          ` : photoMarkup('card')}

          <div class="poster-message-wrap" style="transform:translateY(${l.copyShift || 0}px)">
            <h3 class="poster-greeting" style="font-size:${l.titleSize}px; color:${d.textColor}">${escapeHtml(cardTitle())}</h3>
            <p class="poster-message" style="font-size:${l.bodySize}px; line-height:${l.lineHeight / 100}; color:${d.textColor}">${escapeHtml($('#message').value)}</p>
            ${sender ? `<div class="poster-sender" style="color:${d.accentColor || '#d97706'}">— ${escapeHtml(sender)}</div>` : ''}
          </div>

          <div class="poster-pillars-grid">
            ${pillarsHtml}
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
  } else {
    const copyTop = copyTopPct();
    const badgeText = d.badge || 'FESTIVE CELEBRATION';
    preview.innerHTML = `
      ${pattern}
      ${stickers}
      ${date ? `<div class="card-date">${escapeHtml(date)}</div>` : ''}
      
      <section class="card-copy ${d.panel ? 'text-panel' : ''}" style="top:${d.image && !state.photo ? '6%' : copyTop + '%'}; bottom:${credit ? '12%' : '9%'}">
        <div class="card-top-badge" style="background:${d.accentColor || '#f59e0b'}; color:#ffffff">✨ ${escapeHtml(badgeText)} ✨</div>
        
        ${artSrc ? `
          <div class="card-art-section" style="border-color:${d.border || '#fbbf24'}">
            <img src="${artSrc}" alt="" class="card-art-img">
          </div>
        ` : photoMarkup('card')}

        <h3 style="font-size:${l.titleSize}px">${escapeHtml(cardTitle())}</h3>
        <p style="font-size:${l.bodySize}px;line-height:${l.lineHeight / 100}">${escapeHtml($('#message').value)}</p>
        ${d.tagline ? `<div class="card-tagline-text"><em>${escapeHtml(d.tagline)}</em></div>` : ''}
        ${sender ? `<div class="card-signature">— ${escapeHtml(sender)}</div>` : ''}
      </section>
      ${credit ? `<div class="developer-credit">${escapeHtml(credit)}</div>` : ''}
      <div class="card-watermark">MADE WITH WISHCRAFT</div>
    `;
  }

  syncPreviewTune();
}

function openPreview() {
  renderCard();
  openModal('previewModal');
}

function photoMarkup(mode) {
  if (!state.photo) return '';
  const p = state.photoCfg,
    posX = focusPct(p.panX),
    posY = focusPct(p.panY),
    borderColor = p.borderStyle === 'gold' ? '#d4af37' : p.borderColor,
    frameStyle = `border-radius:${radius(p.shape)};border:${p.borderWidth}px ${p.borderStyle === 'dashed' ? 'dashed' : 'solid'} ${borderColor};opacity:${p.opacity / 100};box-shadow:${p.shadow ? '0 10px 28px #0007' : 'none'}`,
    img = `<img src="${state.photo}" alt="" style="object-position:${posX}% ${posY}%;transform-origin:${posX}% ${posY}%;transform:scale(${p.zoom / 100})">`;
  return mode === 'card' ?
    `<div class="card-photo-frame" style="${frameStyle};width:${p.frameSize}%;top:${p.frameY}%">${img}</div>` :
    `<div class="photo-stage-frame" style="${frameStyle};width:${p.frameSize}%;top:${p.frameY}%">${img}</div>`;
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

function bindPhoto() {
  $('#photoInput').onchange = e => readImage(e.target.files[0], url => {
    state.photo = url;
    $('#photoControls').classList.remove('hidden');
    updatePhotoPreview();
    renderCard();
    saveWorking();
  });
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
  const c = $('#exportCanvas'),
    ratio = state.usingCustom ? state.custom.aspect : 'portrait',
    dims = ratio === 'square' ? [1080, 1080] : ratio === 'landscape' ? [1200, 900] : [1080, 1350];
  c.width = dims[0];
  c.height = dims[1];
  const x = c.getContext('2d'), d = design(), isPoster = !state.usingCustom && d.styleType === 'poster';

  if (isPoster) {
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
    if (state.photo) {
      const img = await loadImg(state.photo);
      if (img) {
        const size = Math.min(c.width, c.height) * state.photoCfg.frameSize / 100,
          px = (c.width - size) / 2,
          py = c.height * state.photoCfg.frameY / 100;
        paintPhoto(x, img, px, py, size);
      }
    } else if (d.image) {
      const img = await loadImg(d.image);
      if (img) {
        const artW = c.width * 0.78;
        const artH = c.height * 0.23;
        const px = (c.width - artW) / 2;
        const py = c.height * 0.11;
        x.save();
        roundedPath(x, px, py, artW, artH, 24);
        x.clip();
        drawCoverImage(x, img, px, py, artW, artH);
        x.restore();
        x.strokeStyle = d.border || '#fbbf24';
        x.lineWidth = 6;
        roundedPath(x, px, py, artW, artH, 24);
        x.stroke();
      }
    }
    paintDecor(x, d, c.width, c.height);
    paintCopy(x, d, c.width, c.height);
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
  const festivalName = (d.festival || cardTitleText()).toUpperCase();
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

  // Photo or Traditional Artwork
  if (state.photo) {
    const img = await loadImg(state.photo);
    const photoSize = Math.min(w, h) * (state.photoCfg.frameSize / 100) * 1.1;
    const px = (w - photoSize) / 2;
    paintPhoto(x, img, px, currentY, photoSize);
    currentY += photoSize + 25;
  } else if (d.image) {
    try {
      const img = await loadImg(d.image);
      const artW = w * 0.88;
      const artH = h * 0.24;
      const px = (w - artW) / 2;
      x.save();
      roundedPath(x, px, currentY, artW, artH, 20);
      x.clip();
      drawCoverImage(x, img, px, currentY, artW, artH);
      x.restore();
      x.strokeStyle = (d.accentColor || '#ea580c') + '55';
      x.lineWidth = 4;
      roundedPath(x, px, currentY, artW, artH, 20);
      x.stroke();
      currentY += artH + 25;
    } catch(e) {
      currentY += 15;
    }
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

  x.font = `600 ${l.bodySize * 1.3}px ${FONT_MAP[d.font] || 'sans-serif'}`;
  const bodyLines = measureLines(x, $('#message').value, w * 0.85);
  currentY = drawLines(x, bodyLines, w / 2, currentY, l.bodySize * 1.6);

  if (sender) {
    currentY += 20;
    x.font = `700 ${l.bodySize * 1.3}px Arial`;
    x.fillStyle = d.accentColor || '#d97706';
    x.fillText(`— ${sender}`, w / 2, currentY);
    currentY += 35;
  }

  // 4 Infographic Pillars
  const pillars = d.pillars || [];
  if (pillars.length >= 4) {
    const pillarTop = h * 0.72;
    const pillarHeight = h * 0.12;
    const pillarWidth = (w * 0.9) / 4 - 15;
    const startX = w * 0.05;

    pillars.slice(0, 4).forEach((p, i) => {
      const px = startX + i * (pillarWidth + 20);
      x.save();
      x.fillStyle = '#f8fafc';
      x.strokeStyle = (d.accentColor || '#f59e0b') + '55';
      x.lineWidth = 3;
      roundedPath(x, px, pillarTop, pillarWidth, pillarHeight, 20);
      x.fill();
      x.stroke();

      x.textAlign = 'center';
      x.font = '36px Arial';
      x.fillText(p.icon, px + pillarWidth / 2, pillarTop + 42);

      x.font = '800 20px Arial';
      x.fillStyle = d.accentColor || '#d97706';
      x.fillText(p.title, px + pillarWidth / 2, pillarTop + 80);

      x.font = '600 16px Arial';
      x.fillStyle = '#475569';
      x.fillText(p.desc, px + pillarWidth / 2, pillarTop + 106);
      x.restore();
    });
  }

  // Tagline Banner
  x.font = 'italic 700 22px Arial, sans-serif';
  x.fillStyle = d.textColor || '#1e293b';
  x.textAlign = 'center';
  x.fillText(tagline, w / 2, h * 0.88);

  // Footer & credits
  x.fillStyle = '#64748b';
  x.font = '700 19px Arial';
  if (credit) {
    x.fillText(credit, w / 2, h * 0.93);
  }
  x.font = '700 16px Arial';
  x.fillText('MADE WITH WISHCRAFT', w / 2, h * 0.96);
}

function paintCopy(x, d, w, h) {
  const sender = data().sender,
    align = state.usingCustom ? state.custom.alignment : 'center',
    alignX = align === 'left' ? w * .1 : align === 'right' ? w * .9 : w / 2,
    max = w * .8,
    hasArt = (d.image && !state.photo) || state.photo,
    top = hasArt ? h * 0.38 : h * copyTopPct() / 100,
    bottom = h * .88,
    family = FONT_MAP[d.font] || 'sans-serif',
    scale = w / 360,
    l = state.layout;

  x.textAlign = align;
  x.textBaseline = 'top';
  let titleSize = l.titleSize * scale * 0.92, bodySize = l.bodySize * scale * 0.92, sigSize = Math.max(16, l.bodySize * .9) * scale, layout;

  for (let i = 0; i < 24; i++) {
    x.font = `800 ${titleSize}px ${family}`;
    const titleLines = measureLines(x, cardTitle(), max * 0.9);
    x.font = `600 ${bodySize}px ${family}`;
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
    const isDark = d.background && (d.background.includes('#0') || d.background.includes('#1') || d.background.includes('#2') || d.background.includes('#3') || d.background.includes('#4') || d.background.includes('#7f') || d.background.includes('#78') || d.background.includes('#45') || d.background.includes('#4a'));
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
  x.font = `600 ${bodySize}px ${family}`;
  y = drawLines(x, layout.bodyLines, alignX, y, bodySize * (l.lineHeight / 100));

  // Draw Sender Signature
  if (sender) {
    y += 20 * scale;
    x.font = `700 ${sigSize}px ${family}`;
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
    anniversary: ['💍', '💕', '🌸', '🥂'],
    baby: ['👶', '🍼', '🌟', '💕'],
    congratulations: ['🎉', '🏆', '🌟', '🎈'],
    housewarming: ['🏡', '🌿', '✨', '💕'],
    graduation: ['🎓', '🏆', '🌟', '🎉'],
    retirement: ['🌴', '🥂', '🌟', '💐'],
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
    'New Year': ['🎆', '🥂', '🌟', '✨'],
    'Thanksgiving': ['🍁', '🕯️', '💛', '✨']
  }[name] || ['🎆', '✨', '🌟', '🎉'];
}

function templateDecor(t) {
  return t.stickers?.length ? t.stickers : occasionDecor();
}

function decorationsForDesign(d) {
  if (d.decor) return d.decor;
  return (d.stickers?.length ? d.stickers : occasionDecor()).map((emoji, i) => decorItem(emoji, i));
}

function decorItem(emoji, i) {
  return { emoji, x: [8, 84, 9, 84][i] ?? 50, y: [10, 10, 86, 86][i] ?? 50, size: [38, 38, 34, 34][i] ?? 34, rotation: 0 };
}

function stickerStyle(s, i) {
  const item = typeof s === 'string' ? decorItem(s, i) : s;
  return `${item.x < 50 ? 'left' : 'right'}:${item.x < 50 ? item.x : 100 - item.x}%;${item.y < 50 ? 'top' : 'bottom'}:${item.y < 50 ? item.y : 100 - item.y}%;font-size:${item.size || 34}px;transform:rotate(${item.rotation || 0}deg)`;
}

function selectFestivalTemplate(name) {
  const match = PRESET_TEMPLATES.find(t => t.festivals?.includes(name));
  if (match) {
    state.template = match.id;
    state.usingCustom = false;
  }
}

function cardTitleText() {
  const d = data();
  return d.festival || 'Festival';
}

function cardTitle() {
  const d = data(), name = subjectFor(state.occasion, d);
  return {
    birthday: `Happy Birthday, ${name}!`,
    anniversary: `Happy Anniversary, ${name}!`,
    baby: `Welcome, ${name}!`,
    congratulations: `Congratulations, ${name}!`,
    housewarming: `New Home Wishes, ${name}!`,
    graduation: `Congratulations, ${name}!`,
    retirement: `Happy Retirement, ${name}!`,
    getwell: `Get Well Soon, ${name}!`,
    festival: d.recipient ? `Happy ${d.festival || 'Festival'}, ${name}!` : `Happy ${d.festival || 'Festival'}!`,
    thanks: `Thank You, ${name}!`,
    custom: `${d.title || 'Special Wishes'}, ${name}!`
  }[state.occasion] || `Best Wishes, ${name}!`;
}

function copyTopPct() {
  const d = design(), base = state.photo ? state.photoCfg.frameY + state.photoCfg.frameSize + 5 : d.panel ? 31 : 24;
  return Math.max(12, Math.min(72, base + state.layout.copyShift));
}

function focusPct(value) {
  return Math.max(0, Math.min(100, (Number(value) + 100) / 2));
}

function drawCoverImage(x, img, dx, dy, w, h) {
  const scale = Math.max(w / img.width, h / img.height), sw = w / scale, sh = h / scale, sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
  x.drawImage(img, sx, sy, sw, sh, dx, dy, w, h);
}

function footerCredit() {
  return state.settings.showDeveloperCredit ? String(state.settings.developerCredit || '').trim() : '';
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
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
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = () => {
      console.warn('Image load failed for:', src);
      res(null);
    };
    i.src = src;
  });
}

function drawCoverImage(x, img, dx, dy, dw, dh) {
  if (!img || !img.width || !img.height) return;
  const scale = Math.max(dw / img.width, dh / img.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
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
