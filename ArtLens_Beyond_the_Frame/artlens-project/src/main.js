import './styles.css';
import { recognizeArtwork } from './recognizer.js';

const root = document.querySelector('#app');
const STORAGE_KEY = 'artlens.saved.v1';
const defaultState = {
  lang: 'en', activeId: null, activeTab: 'story', activeDetailId: null,
  savedOnly: false, cameraStream: null, capturedImage: '', scan: null,
  analyzing: false, modelInstalled: false, modelChecking: true,
  toast: '', chatHistory: [], installPrompt: null, speechActive: false
};
const state = { ...defaultState, saved: new Set(readSaved()) };
let artworks = [];
let copy = {};
let toastTimeout;

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function persistSaved() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.saved])); }
function t(key) { return copy[state.lang]?.[key] ?? copy.en?.[key] ?? key; }
function tr(value) {
  if (value && typeof value === 'object') return value[state.lang] ?? value.en ?? '';
  return value ?? '';
}
function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function getArtwork(id) { return artworks.find(item => item.id === id); }
function icon(name) {
  const paths = {
    scan: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v7h-3"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    camera: '<path d="M14 5 16 8h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h4l2-3z"/><circle cx="12" cy="13" r="3.5"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 4.5v17M8 6h8M8 10h7"/>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z"/>',
    audio: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    sparkle: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="m19 15 1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    offline: '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M8.5 5.1A12.7 12.7 0 0 1 12 4c3.7 0 6.8 1.6 9 4.2M5 8.5A12.2 12.2 0 0 0 3 10M8.5 13.5A5.5 5.5 0 0 0 12 15M16 16l3 3"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.sparkle}</svg>`;
}

function artCard(art, index = 0) {
  const isSaved = state.saved.has(art.id);
  return `<article class="art-card" style="--card-index:${index}" data-art-card="${esc(art.id)}">
    <button class="art-card-image" data-action="open-art" data-id="${esc(art.id)}" aria-label="Explore ${esc(art.title.en)}">
      <img src="${esc(art.image)}" alt="${esc(art.alt)}" loading="lazy" />
      <span class="art-card-index">0${index + 1}</span>
      <span class="image-open">${icon('arrow')}</span>
    </button>
    <div class="art-card-info">
      <div class="art-card-topline"><span>${esc(art.year)}</span><button class="mini-save ${isSaved ? 'is-saved' : ''}" data-action="save" data-id="${esc(art.id)}" aria-label="${esc(isSaved ? t('removeSaved') : t('save'))}">${icon('heart')}</button></div>
      <button class="art-card-title" data-action="open-art" data-id="${esc(art.id)}">${esc(tr(art.title))}</button>
      <p>${esc(art.artist)}</p>
      <span class="art-card-period">${esc(tr(art.period))}</span>
    </div>
  </article>`;
}

function header() {
  return `<header class="site-header">
    <a href="#top" class="brand" aria-label="ArtLens home"><span class="brand-mark">A<span>·</span></span><span class="brand-word">ART<span>LENS</span><small>BEYOND THE FRAME</small></span></a>
    <nav class="desktop-nav" aria-label="Main navigation">
      <button data-action="nav" data-target="collection">${esc(t('navExplore'))}</button>
      <button data-action="saved-view">${esc(t('navSaved'))}<span class="nav-count">${state.saved.size}</span></button>
      <button data-action="nav" data-target="how-it-works">${esc(t('navHow'))}</button>
    </nav>
    <div class="header-right">
      <span class="offline-chip">${icon('offline')} <span>${esc(t('offline'))}</span></span>
      <div class="language-switch" aria-label="${esc(t('language'))}">${['en','hi','mr'].map(lang => `<button data-action="lang" data-lang="${lang}" class="${state.lang === lang ? 'active' : ''}" aria-pressed="${state.lang === lang}">${lang.toUpperCase()}</button>`).join('')}</div>
    </div>
  </header>`;
}

function renderHero() {
  return `<section class="hero shell" id="top">
    <div class="hero-copy">
      <div class="eyebrow"><span class="eyebrow-line"></span>${esc(t('eyebrow'))}</div>
      <h1>${esc(t('heroTitle')).replace('\n','<br>')}</h1>
      <p class="hero-lede">${esc(t('heroText'))}</p>
      <div class="hero-actions"><button class="button button-primary" data-action="nav" data-target="scanner">${icon('camera')} ${esc(t('scanNow'))}</button><button class="button button-text" data-action="nav" data-target="collection">${esc(t('exploreGallery'))} ${icon('arrow')}</button></div>
      <div class="hero-footnote"><span class="status-dot"></span><span>${artworks.length} ${esc(t('collectionCount'))}</span><span class="foot-separator">·</span><span>EN / HI / MR</span><span class="foot-separator">·</span><span>NO CLOUD API</span></div>
    </div>
    <div class="hero-art-wrap">
      <div class="hero-art-frame"><img src="/img/starry-night.svg" alt="${esc(artworks[0]?.alt || 'Illustrative artwork cover')}" /><div class="hero-art-caption"><div><span class="tiny-label">FEATURED STUDY 01</span><strong>${esc(tr(artworks[0]?.title || {}))}</strong><small>${esc(artworks[0]?.artist || '')} · ${esc(artworks[0]?.year || '')}</small></div><button data-action="open-art" data-id="starry-night" aria-label="Open featured artwork">${icon('arrow')}</button></div></div>
      <div class="hero-stamp"><span>SEE</span><span>·</span><span>FEEL</span><span>·</span><span>DISCOVER</span></div>
      <span class="hero-coordinate">19° 04' N · 72° 52' E</span>
    </div>
    <div class="hero-side-note">A NEW WAY<br/>TO LOOK AGAIN <span>↘</span></div>
  </section>`;
}

function renderFeatureStrip() {
  const features = [
    ['scan','featureScan','featureScanText','01'], ['book','featureStory','featureStoryText','02'], ['sparkle','featureExplore','featureExploreText','03'], ['audio','featureListen','featureListenText','04']
  ];
  return `<section class="feature-strip shell" aria-label="App capabilities">${features.map(([ico,title,text,num]) => `<article class="feature-item"><div class="feature-num">${num}</div><div class="feature-icon">${icon(ico)}</div><div><h3>${esc(t(title))}</h3><p>${esc(t(text))}</p></div></article>`).join('')}</section>`;
}

function renderScanner() {
  const hasPreview = Boolean(state.capturedImage);
  const streamActive = Boolean(state.cameraStream);
  let statusClass = state.modelInstalled ? 'model-ok' : 'model-missing';
  let modelLabel = state.modelChecking ? 'Checking local model…' : (state.modelInstalled ? t('modelReady') : t('modelMissing'));
  let analysisPanel = '';
  if (state.analyzing) {
    analysisPanel = `<div class="scan-feedback loading-feedback"><span class="spinner"></span><span id="analysis-progress">Loading local vision model…</span></div>`;
  } else if (state.scan?.mode === 'manual') {
    analysisPanel = `<div class="scan-feedback"><div class="feedback-kicker">${icon('offline')} ${esc(t('manualTitle'))}</div><p>${esc(t('manualText'))}</p><div class="manual-candidates">${artworks.map((art,i) => `<button class="manual-candidate" data-action="open-art" data-id="${esc(art.id)}"><img src="${esc(art.image)}" alt=""/><span><strong>${esc(tr(art.title))}</strong><small>${esc(art.artist)}</small></span>${icon('arrow')}</button>`).join('')}</div></div>`;
  } else if (state.scan?.mode === 'unknown') {
    analysisPanel = `<div class="scan-feedback"><div class="feedback-kicker">${icon('sparkle')} ${esc(t('unknownTitle'))}</div><p>${esc(t('unknownText'))}</p><button class="button button-outline button-small" data-action="nav" data-target="collection">${esc(t('exploreGallery'))} ${icon('arrow')}</button></div>`;
  } else if (state.scan?.mode === 'matches') {
    const top = state.scan.matches;
    analysisPanel = `<div class="scan-feedback"><div class="feedback-kicker">${icon('sparkle')} ${esc(top.length === 1 ? 'Match found' : t('candidateTitle'))}</div><p>${esc(t('candidateTitle'))}</p><div class="manual-candidates">${top.map((match,i) => `<button class="manual-candidate" data-action="open-art" data-id="${esc(match.artwork.id)}"><img src="${esc(match.artwork.image)}" alt=""/><span><strong>${esc(tr(match.artwork.title))}</strong><small>${esc(match.artwork.artist)} · ${Math.round(match.score*100)}% ${esc(t('confidence').toLowerCase())}</small></span>${icon('arrow')}</button>`).join('')}</div></div>`;
  }
  return `<section class="scanner-section shell" id="scanner">
    <div class="section-heading scanner-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span>01 / SCAN & DISCOVER</div><h2>${esc(t('scanTitle'))}</h2><p>${esc(t('scanText'))}</p></div><span class="model-status ${statusClass}"><i></i>${esc(modelLabel)}</span></div>
    <div class="scanner-layout">
      <div class="scanner-card">
        <div class="scanner-topline"><span class="scanner-label">${icon('camera')} CAMERA / IMAGE INPUT</span><span class="step-counter">STEP 01 <span>—</span> 03</span></div>
        <div class="scanner-viewport ${hasPreview || streamActive ? 'has-image' : ''}" id="scanner-viewport">
          <div class="viewfinder-corner corner-tl"></div><div class="viewfinder-corner corner-tr"></div><div class="viewfinder-corner corner-bl"></div><div class="viewfinder-corner corner-br"></div>
          <div class="scan-grid"></div>
          <video id="camera-video" autoplay playsinline muted class="camera-video ${streamActive ? 'visible' : ''}" ${streamActive ? '' : 'hidden'}></video>
          <img id="scan-preview-image" class="scan-preview-image ${hasPreview ? 'visible' : ''}" src="${hasPreview ? esc(state.capturedImage) : ''}" alt="${esc(t('previewTitle'))}" ${hasPreview ? '' : 'hidden'} />
          <div class="scanner-empty ${hasPreview || streamActive ? 'hidden' : ''}" id="scanner-empty"><div class="scanner-lens">${icon('scan')}<span></span></div><strong>FRAME AN ARTWORK</strong><p>Keep the work centred and reduce glare.</p></div>
          ${streamActive ? '<span class="live-indicator"><i></i> LIVE</span>' : ''}
        </div>
        <div class="scanner-actions">
          <button class="button button-primary" data-action="camera" ${streamActive ? 'hidden' : ''}>${icon('camera')} ${esc(t('openCamera'))}</button>
          <button class="button button-outline" data-action="capture" ${streamActive ? '' : 'hidden'}>${icon('scan')} ${esc(t('capture'))}</button>
          <button class="button button-outline" data-action="close-camera" ${streamActive ? '' : 'hidden'}>${icon('close')} ${esc(t('closeCamera'))}</button>
          <label class="button button-outline upload-button">${icon('book')} ${esc(t('uploadPhoto'))}<input id="photo-input" type="file" accept="image/*" hidden /></label>
          <button class="button button-dark" data-action="analyze" ${hasPreview ? '' : 'disabled'}>${esc(t('analyze'))} ${icon('arrow')}</button>
        </div>
        <p class="scanner-help">${icon('offline')} ${esc(t('cameraHelp'))}</p>
        ${analysisPanel}
      </div>
      <aside class="scanner-aside">
        <div class="aside-index">A / 01</div><h3>Not just a label.<br/><em>A whole new lens.</em></h3><p>ArtLens combines a curated art-history guide with on-device image recognition. No visitor photo is sent to a server.</p>
        <div class="aside-rule"></div>
        <div class="aside-checklist"><div><span>01</span><p><strong>Look</strong><small>Frame the artwork</small></p></div><div><span>02</span><p><strong>Recognise</strong><small>Match the curated collection</small></p></div><div><span>03</span><p><strong>Discover</strong><small>Stories, details, voice & time</small></p></div></div>
        <p class="model-note"><span class="model-note-mark">i</span>${esc(t('modelHelp'))}</p>
      </aside>
    </div>
  </section>`;
}

function renderCollection() {
  const filtered = state.savedOnly ? artworks.filter(art => state.saved.has(art.id)) : artworks;
  return `<section class="collection-section shell" id="collection">
    <div class="section-heading collection-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span>02 / THE COLLECTION</div><h2>${esc(state.savedOnly ? t('savedTitle') : t('worksTitle'))}</h2><p>${esc(state.savedOnly ? t('savedText') : t('worksText'))}</p></div><div class="collection-tools"><span class="collection-count">${String(filtered.length).padStart(2,'0')} <small>/ ${String(artworks.length).padStart(2,'0')}</small></span><button class="button button-text" data-action="toggle-saved-view">${esc(state.savedOnly ? t('showAll') : t('navSaved'))} ${icon('arrow')}</button></div></div>
    ${filtered.length ? `<div class="art-grid">${filtered.map((art,index) => artCard(art, artworks.indexOf(art))).join('')}</div>` : `<div class="empty-state"><span class="empty-spark">✳</span><h3>${esc(t('emptySaved'))}</h3><button class="button button-outline" data-action="toggle-saved-view">${esc(t('showAll'))}</button></div>`}
    <p class="collection-disclaimer">${icon('sparkle')} ${esc(t('footnote'))}</p>
  </section>`;
}

function renderTimeline(art) {
  return `<div class="timeline-list">${art.timeline.map((item,index) => `<article class="timeline-row"><div class="timeline-year"><span>${String(index+1).padStart(2,'0')}</span><strong>${esc(item.year)}</strong></div><div class="timeline-event"><span class="timeline-overline">ARTWORK</span><p>${esc(tr(item.event))}</p></div><div class="timeline-event timeline-world"><span class="timeline-overline">THE WORLD</span><p>${esc(tr(item.world))}</p></div></article>`).join('')}</div>`;
}

function renderHotspots(art) {
  const selected = art.hiddenDetails.find(detail => detail.id === state.activeDetailId) || art.hiddenDetails[0];
  return `<div class="details-layout"><div class="hotspot-stage"><img src="${esc(art.image)}" alt="${esc(art.alt)}"/><span class="hotspot-stage-label">TAP TO EXPLORE</span>${art.hiddenDetails.map((detail,index) => `<button class="hotspot ${selected?.id === detail.id ? 'active' : ''}" data-action="hotspot" data-id="${esc(detail.id)}" style="left:${detail.position.x}%;top:${detail.position.y}%" aria-label="${esc(tr(detail.label))}"><span>${index+1}</span></button>`).join('')}</div><div class="detail-explainer"><div class="detail-index">DETAIL / ${String(art.hiddenDetails.findIndex(detail => detail.id === selected?.id)+1).padStart(2,'0')}</div><h3>${esc(tr(selected?.label))}</h3><p>${esc(tr(selected?.text))}</p><div class="detail-selector">${art.hiddenDetails.map((detail,index) => `<button class="detail-selector-item ${selected?.id === detail.id ? 'active' : ''}" data-action="hotspot" data-id="${esc(detail.id)}"><span>0${index+1}</span>${esc(tr(detail.label))}${icon('arrow')}</button>`).join('')}</div><p class="interpretation-note">${icon('sparkle')} ArtLens separates sourced information from interpretation. A symbol may have more than one reading.</p></div></div>`;
}

function renderAsk(art) {
  const history = state.chatHistory;
  const messages = history.map(message => `<div class="chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}"><span class="chat-avatar">${message.role === 'user' ? 'YOU' : 'A'}</span><div class="chat-bubble">${esc(message.text)}</div></div>`).join('');
  return `<div class="ask-layout"><div class="ask-intro"><div class="ask-symbol">${icon('message')}</div><h3>${esc(t('askHeading'))}</h3><p>${esc(t('askText'))}</p><div class="source-pill">${icon('check')} CURATED NOTES ONLY</div></div><div class="chat-panel"><div class="chat-messages" id="chat-messages">${messages || `<div class="chat-welcome"><span class="welcome-spark">✳</span><strong>Curiosity looks good on you.</strong><p>Choose a prompt or ask about this work.</p></div>`}</div><form id="ask-form" class="chat-form"><input name="question" autocomplete="off" placeholder="${esc(t('askPlaceholder'))}" aria-label="${esc(t('askPlaceholder'))}" maxlength="240" required/><button type="submit" class="button button-primary" aria-label="${esc(t('askSend'))}">${esc(t('askSend'))} ${icon('arrow')}</button></form><div class="suggested-questions"><span>${esc(t('suggested'))}</span>${art.qa.slice(0,3).map(item => `<button data-action="ask-suggestion" data-question="${esc(item.q)}">${esc(item.q)}</button>`).join('')}</div></div></div>`;
}

function renderExperience() {
  const art = getArtwork(state.activeId);
  if (!art) return '';
  const saved = state.saved.has(art.id);
  let tabContent = '';
  if (state.activeTab === 'story') {
    tabContent = `<div class="story-layout"><div class="story-main"><div class="content-overline">THE STORY / ${esc(art.year)}</div><h3>${esc(t('storyHeading'))}</h3><p class="story-copy">${esc(tr(art.story))}</p><div class="fact-grid"><div><span>${esc(t('artist'))}</span><strong>${esc(art.artist)}</strong></div><div><span>${esc(t('year'))}</span><strong>${esc(art.year)}</strong></div><div><span>${esc(t('period'))}</span><strong>${esc(tr(art.period))}</strong></div><div><span>${esc(t('medium'))}</span><strong>${esc(tr(art.medium))}</strong></div></div><div class="story-source"><span>${icon('book')} NOTES & SOURCES</span><a href="${esc(art.source)}" target="_blank" rel="noreferrer">${esc(t('source'))} ${icon('arrow')}</a></div></div><aside class="speaks-card"><span class="speaks-label">${icon('audio')} THE ARTWORK SPEAKS</span><h3>${esc(t('voiceHeading'))}</h3><blockquote>“${esc(tr(art.speaks))}”</blockquote><p>${esc(t('voiceNote'))}</p><button class="button button-gold" data-action="speak">${icon('audio')} ${esc(t('playVoice'))}</button></aside></div>`;
  } else if (state.activeTab === 'details') {
    tabContent = `<div class="tab-intro"><div><h3>${esc(t('detailHeading'))}</h3><p>${esc(t('detailText'))}</p></div><span class="tab-index">03 / DETAILS</span></div>${renderHotspots(art)}`;
  } else if (state.activeTab === 'timeline') {
    tabContent = `<div class="tab-intro"><div><h3>${esc(t('timelineHeading'))}</h3><p>${esc(t('timelineText'))}</p></div><span class="tab-index">04 / TIME TRAVEL</span></div>${renderTimeline(art)}`;
  } else {
    tabContent = renderAsk(art);
  }
  return `<section class="experience-section shell" id="experience">
    <div class="experience-banner"><div class="experience-banner-label"><span class="eyebrow-line"></span>${esc(t('experienceEyebrow'))}</div><button class="close-experience" data-action="close-experience">${esc(t('close'))} ${icon('close')}</button></div>
    <div class="experience-hero"><div class="experience-image"><img src="${esc(art.image)}" alt="${esc(art.alt)}"/><span class="image-caption">ARTLENS / CURATED STUDY</span><button class="image-expand" data-action="tab" data-tab="details" aria-label="Explore details">${icon('sparkle')}</button></div><div class="experience-summary"><span class="artwork-category">${esc(tr(art.period))}</span><h2>${esc(tr(art.title))}</h2><p class="artwork-artist">${esc(art.artist)} <span>·</span> ${esc(art.year)}</p><div class="artwork-location">${icon('pin')} ${esc(tr(art.place))}</div><div class="summary-rule"></div><div class="summary-actions"><button class="button ${saved ? 'button-saved' : 'button-primary'}" data-action="save" data-id="${esc(art.id)}">${icon(saved ? 'check' : 'heart')} ${esc(saved ? t('saved') : t('save'))}</button><button class="button button-outline" data-action="speak">${icon('audio')} ${esc(t('listen'))}</button></div><div class="experience-stats"><div><span>01</span><strong>SEE</strong></div><div><span>02</span><strong>UNDERSTAND</strong></div><div><span>03</span><strong>REMEMBER</strong></div></div></div></div>
    <div class="experience-tabs" role="tablist">${[['story','storyTab'],['details','detailsTab'],['timeline','timelineTab'],['ask','askTab']].map(([tab,label]) => `<button role="tab" aria-selected="${state.activeTab === tab}" class="experience-tab ${state.activeTab === tab ? 'active' : ''}" data-action="tab" data-tab="${tab}">${esc(t(label))}<span>${['01','02','03','04'][['story','details','timeline','ask'].indexOf(tab)]}</span></button>`).join('')}</div>
    <div class="experience-content">${tabContent}</div>
  </section>`;
}

function renderHow() {
  return `<section class="how-section shell" id="how-it-works"><div class="how-copy"><div class="eyebrow"><span class="eyebrow-line"></span>03 / THE PRINCIPLE</div><h2>${esc(t('howTitle'))}</h2><p>${esc(t('howText'))}</p><div class="privacy-stamp">${icon('offline')} <span>NO CLOUD.<br/>NO API KEYS.<br/>NO GUESSWORK.</span></div></div><div class="how-steps">${[['stepOne','stepOneText'],['stepTwo','stepTwoText'],['stepThree','stepThreeText']].map(([head,body],index) => `<article class="how-step"><span class="step-line">${index===2?'✳':'→'}</span><div><span class="how-step-index">${['01','02','03'][index]}</span><h3>${esc(t(head))}</h3><p>${esc(t(body))}</p></div></article>`).join('')}</div></section>`;
}

function footer() {
  return `<footer class="site-footer shell"><div class="footer-brand"><span class="brand-mark">A<span>·</span></span><div><strong>ARTLENS</strong><small>BEYOND THE FRAME</small></div></div><p>See the art. Hear it speak.</p><div class="footer-meta"><span>BUILT FOR RENAISSANCE BUILDATHON</span><span>ART / SCIENCE / COMMUNICATION / TECHNOLOGY</span></div></footer>`;
}

function render() {
  const active = state.activeId ? renderExperience() : '';
  root.innerHTML = `${header()}<main>${renderHero()}${renderFeatureStrip()}${renderScanner()}${active}${renderCollection()}${renderHow()}</main>${footer()}${state.toast ? `<div class="toast" role="status">${icon('check')}<span>${esc(state.toast)}</span></div>` : ''}`;
  if (state.cameraStream) {
    const video = document.getElementById('camera-video');
    const viewport = document.getElementById('scanner-viewport');
    if (video && viewport) {
      video.hidden = false; video.classList.add('visible'); video.srcObject = state.cameraStream;
      video.play().catch(() => {});
      viewport.classList.add('camera-live');
      viewport.querySelector('.scanner-empty')?.classList.add('hidden');
      if (!viewport.querySelector('.live-indicator')) { const indicator = document.createElement('span'); indicator.className = 'live-indicator'; indicator.innerHTML = '<i></i> LIVE'; viewport.appendChild(indicator); }
    }
  }
}

function showToast(message) {
  state.toast = message;
  render();
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { state.toast = ''; render(); }, 2600);
}
function scrollToTarget(id) {
  const element = document.getElementById(id);
  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function stopCamera(silent = true) {
  if (state.cameraStream) state.cameraStream.getTracks().forEach(track => track.stop());
  state.cameraStream = null;
  if (!silent) showToast(t('toastCameraClosed'));
}
async function startCamera() {
  state.capturedImage = '';
  state.scan = null;
  render();
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera is not supported in this browser.');
    if (state.cameraStream) stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 }, height: { ideal: 1200 } }, audio: false });
    state.cameraStream = stream;
    const video = document.getElementById('camera-video');
    const viewport = document.getElementById('scanner-viewport');
    if (!video || !viewport) { stopCamera(); return; }
    video.hidden = false; video.classList.add('visible'); video.srcObject = stream;
    const previousImage = document.getElementById('scan-preview-image');
    if (previousImage) previousImage.hidden = true;
    await video.play();
    viewport.classList.add('camera-live');
    viewport.querySelector('.scanner-empty')?.classList.add('hidden');
    const indicator = document.createElement('span'); indicator.className = 'live-indicator'; indicator.innerHTML = '<i></i> LIVE'; viewport.appendChild(indicator);
    document.querySelector('[data-action="camera"]')?.setAttribute('hidden','');
    document.querySelector('[data-action="capture"]')?.removeAttribute('hidden');
    document.querySelector('[data-action="close-camera"]')?.removeAttribute('hidden');
  } catch (error) {
    stopCamera();
    showToast(t('toastCamera'));
  }
}
function captureFrame() {
  const video = document.getElementById('camera-video');
  if (!video || !state.cameraStream || !video.videoWidth) return;
  const canvas = document.createElement('canvas');
  const maxWidth = 1280;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(video, 0, 0, canvas.width, canvas.height);
  state.capturedImage = canvas.toDataURL('image/jpeg', 0.88);
  state.scan = null;
  stopCamera();
  render();
  scrollToTarget('scanner');
}
function setUploadedImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    stopCamera();
    state.capturedImage = String(reader.result || '');
    state.scan = null;
    render();
  };
  reader.readAsDataURL(file);
}
async function getCanvasFromPreview() {
  const image = new Image();
  image.src = state.capturedImage;
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
  const canvas = document.createElement('canvas');
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}
async function analyzeImage() {
  if (!state.capturedImage) { showToast(t('toastNoImage')); return; }
  state.analyzing = true;
  state.scan = null;
  render();
  scrollToTarget('scanner');
  try {
    const canvas = await getCanvasFromPreview();
    const matches = await recognizeArtwork(canvas, artworks, progress => {
      const label = document.getElementById('analysis-progress');
      if (label) label.textContent = progress;
    });
    state.modelInstalled = true;
    const top = matches[0];
    const second = matches[1];
    if (!top || top.score < 0.34) {
      state.scan = { mode: 'unknown', matches };
    } else if (top.score >= 0.63 && (!second || top.score - second.score >= 0.10)) {
      state.scan = { mode: 'matches', matches: matches.slice(0,1), confidence: 'high' };
      state.activeId = top.artwork.id;
      state.activeTab = 'story';
      state.activeDetailId = null;
      state.chatHistory = [];
    } else {
      state.scan = { mode: 'matches', matches: matches.slice(0,3), confidence: 'confirm' };
    }
  } catch (error) {
    state.modelInstalled = false;
    state.scan = { mode: 'manual', reason: error?.message || 'Local model is not available.' };
  } finally {
    state.analyzing = false;
    render();
    if (state.activeId) setTimeout(() => scrollToTarget('experience'), 120);
    else scrollToTarget('scanner');
  }
}
function openArtwork(id) {
  stopCamera();
  state.activeId = id;
  state.activeTab = 'story';
  state.activeDetailId = null;
  state.chatHistory = [];
  render();
  setTimeout(() => scrollToTarget('experience'), 60);
}
function toggleSave(id) {
  if (state.saved.has(id)) {
    state.saved.delete(id);
    showToast(t('toastRemoved'));
  } else {
    state.saved.add(id);
    showToast(t('toastSaved'));
  }
  persistSaved();
}
function speakCurrent() {
  const art = getArtwork(state.activeId);
  if (!art) return;
  if (!('speechSynthesis' in window)) {
    showToast('Speech synthesis is unavailable in this browser.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(tr(art.speaks));
  utterance.lang = ({ en: 'en-US', hi: 'hi-IN', mr: 'mr-IN' })[state.lang];
  utterance.rate = 0.92;
  utterance.pitch = 0.98;
  window.speechSynthesis.speak(utterance);
}
function localAnswer(art, question) {
  const normalise = text => String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u0900-\u097f\s]/g,' ').split(/\s+/).filter(token => token.length > 2);
  const tokens = [...new Set(normalise(question))];
  let best = { score: 0, text: '' };
  const entries = [];
  for (const item of art.qa) entries.push({ question: item.q, answer: tr(item.a), source: item.q });
  entries.push({ question: 'story', answer: tr(art.story), source: 'story' });
  for (const detail of art.hiddenDetails) entries.push({ question: `${tr(detail.label)} ${tr(detail.text)}`, answer: tr(detail.text), source: tr(detail.label) });
  for (const entry of entries) {
    const entryTokens = new Set(normalise(`${entry.question} ${entry.answer}`));
    const score = tokens.reduce((total, token) => total + (entryTokens.has(token) ? 1 : 0), 0) / Math.max(2, Math.min(tokens.length, 6));
    if (score > best.score) best = { score, text: entry.answer, source: entry.source };
  }
  if (best.score < 0.16 || !best.text) return t('noAnswer');
  return best.text;
}
function askQuestion(question) {
  const art = getArtwork(state.activeId);
  if (!art || !question.trim()) return;
  state.chatHistory.push({ role: 'user', text: question.trim() });
  state.chatHistory.push({ role: 'assistant', text: localAnswer(art, question.trim()) });
  state.activeTab = 'ask';
  render();
  setTimeout(() => {
    const messages = document.getElementById('chat-messages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  }, 20);
}

root.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const { action, id, target, lang, tab, question } = button.dataset;
  if (action === 'nav') { scrollToTarget(target); return; }
  if (action === 'open-art') { openArtwork(id); return; }
  if (action === 'save') { toggleSave(id); return; }
  if (action === 'lang') {
    window.speechSynthesis?.cancel();
    state.lang = lang;
    render();
    return;
  }
  if (action === 'saved-view' || action === 'toggle-saved-view') {
    state.savedOnly = !state.savedOnly;
    render();
    scrollToTarget('collection');
    return;
  }
  if (action === 'camera') { await startCamera(); return; }
  if (action === 'capture') { captureFrame(); return; }
  if (action === 'close-camera') { stopCamera(); render(); return; }
  if (action === 'analyze') { await analyzeImage(); return; }
  if (action === 'tab') { state.activeTab = tab; state.activeDetailId = null; render(); scrollToTarget('experience'); return; }
  if (action === 'hotspot') { state.activeDetailId = id; render(); return; }
  if (action === 'speak') { speakCurrent(); return; }
  if (action === 'ask-suggestion') { askQuestion(question || ''); return; }
  if (action === 'close-experience') { state.activeId = null; state.chatHistory = []; render(); scrollToTarget('collection'); return; }
  if (action === 'install' && state.installPrompt) {
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    return;
  }
});

root.addEventListener('change', event => {
  if (event.target.id === 'photo-input') setUploadedImage(event.target.files?.[0]);
});
root.addEventListener('submit', event => {
  if (event.target.id !== 'ask-form') return;
  event.preventDefault();
  const input = event.target.elements.question;
  askQuestion(input.value);
});

async function checkLocalModel() {
  state.modelChecking = true;
  try {
    const [response, weightsResponse] = await Promise.all([
      fetch('/models/Xenova/clip-vit-base-patch32/config.json', { cache: 'no-store' }),
      fetch('/models/Xenova/clip-vit-base-patch32/onnx/model_quantized.onnx', { method: 'HEAD', cache: 'no-store' })
    ]);
    if (!response.ok || !weightsResponse.ok) throw new Error('missing');
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json')) throw new Error('missing');
    const config = await response.json();
    state.modelInstalled = Boolean(config.model_type || config.architectures?.length);
  } catch { state.modelInstalled = false; }
  state.modelChecking = false;
  render();
}

async function init() {
  try {
    const [artResponse, copyResponse] = await Promise.all([fetch('/data/artworks.json'), fetch('/data/i18n.json')]);
    if (!artResponse.ok || !copyResponse.ok) throw new Error('The local ArtLens data could not be loaded.');
    artworks = await artResponse.json();
    copy = await copyResponse.json();
    render();
    checkLocalModel();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  } catch (error) {
    root.innerHTML = `<main class="fatal-error"><h1>ArtLens could not open.</h1><p>${esc(error.message)}</p><p>Run the app through Vite instead of opening index.html directly.</p></main>`;
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  state.installPrompt = event;
});
window.addEventListener('pagehide', () => {
  stopCamera();
  window.speechSynthesis?.cancel();
});
init();
