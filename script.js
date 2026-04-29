/* ══════════════════════════════════════════════════════════════
   GLOBAL MOOD RING  ·  script.js  v2.0
   Features: IP geolocation · realtime ticker · live counter ·
             mood autocomplete · particle burst · mood-reactive
             audio · shareable URL · continent outlines globe ·
             atmospheric rim · background mood bleed
   ══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ── Config ──────────────────────────────────────────────────── */
const SB_URL  = 'https://elffxqkhihilfmbnengx.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

/* ── Mood Dictionary ─────────────────────────────────────────── */
const MOODS = {
  // Joy
  happy:      { t:'joy',      c:'#ffd166', e:'☀️' },
  joyful:     { t:'joy',      c:'#ffd166', e:'🌟' },
  excited:    { t:'joy',      c:'#ff9f1c', e:'⚡' },
  elated:     { t:'joy',      c:'#ffbf69', e:'✨' },
  bliss:      { t:'joy',      c:'#ffd166', e:'🌈' },
  cheerful:   { t:'joy',      c:'#ffe066', e:'😄' },
  euphoric:   { t:'joy',      c:'#ffc300', e:'🎉' },
  grateful:   { t:'joy',      c:'#ffaa44', e:'🙏' },
  hopeful:    { t:'joy',      c:'#ffc966', e:'🌅' },
  proud:      { t:'joy',      c:'#ffa500', e:'🦁' },
  // Sadness
  sad:        { t:'sadness',  c:'#4895ef', e:'🌊' },
  lonely:     { t:'sadness',  c:'#3a86ff', e:'🌙' },
  melancholy: { t:'sadness',  c:'#4361ee', e:'💙' },
  grief:      { t:'sadness',  c:'#2d3a8c', e:'🫧' },
  nostalgic:  { t:'sadness',  c:'#5577dd', e:'🕯️' },
  heartbroken:{ t:'sadness',  c:'#3a6bd6', e:'💔' },
  lost:       { t:'sadness',  c:'#3060cc', e:'🌫️' },
  // Anger
  angry:      { t:'anger',    c:'#ef233c', e:'🔥' },
  rage:       { t:'anger',    c:'#d62828', e:'💢' },
  frustrated: { t:'anger',    c:'#f4433c', e:'😤' },
  furious:    { t:'anger',    c:'#c1121f', e:'🌋' },
  bitter:     { t:'anger',    c:'#e63946', e:'😠' },
  // Fear
  anxious:    { t:'fear',     c:'#9b5de5', e:'🌀' },
  scared:     { t:'fear',     c:'#7b2d8b', e:'👁️' },
  nervous:    { t:'fear',     c:'#b57bee', e:'🌪️' },
  paranoid:   { t:'fear',     c:'#6a0dad', e:'🕷️' },
  overwhelmed:{ t:'fear',     c:'#8338ec', e:'💫' },
  // Serenity
  calm:       { t:'serenity', c:'#4af0c8', e:'🌿' },
  peaceful:   { t:'serenity', c:'#56cfe1', e:'🍃' },
  zen:        { t:'serenity', c:'#2ec4b6', e:'☯️' },
  serene:     { t:'serenity', c:'#80ffdb', e:'🌊' },
  content:    { t:'serenity', c:'#48cae4', e:'😌' },
  balanced:   { t:'serenity', c:'#4cc9f0', e:'⚖️' },
  // Love
  love:       { t:'love',     c:'#ff6b9d', e:'💗' },
  romantic:   { t:'love',     c:'#ff4d8d', e:'🌹' },
  tender:     { t:'love',     c:'#ff85a1', e:'🫶' },
  adoration:  { t:'love',     c:'#ff5c8a', e:'💖' },
  // Surprise
  surprised:  { t:'surprise', c:'#f77f00', e:'🎆' },
  amazed:     { t:'surprise', c:'#fcbf49', e:'🌠' },
  shocked:    { t:'surprise', c:'#f4a261', e:'😲' },
  awestruck:  { t:'surprise', c:'#e9c46a', e:'🤩' },
  // Neutral / Other
  bored:      { t:'neutral',  c:'#7a8fb5', e:'😐' },
  confused:   { t:'neutral',  c:'#a8b2cc', e:'🤔' },
  tired:      { t:'neutral',  c:'#6c7a9c', e:'😴' },
  neutral:    { t:'neutral',  c:'#4af0c8', e:'◌'  },
};

const TYPE_COLOR = {
  joy:      '#ffd166',
  sadness:  '#4895ef',
  anger:    '#ef233c',
  fear:     '#9b5de5',
  serenity: '#4af0c8',
  love:     '#ff6b9d',
  surprise: '#f77f00',
  neutral:  '#7a8fb5',
};

/* Frequency sets per mood type for audio engine */
const AUDIO_FREQS = {
  joy:      [261.63, 329.63, 392.00, 523.25],   // C major, bright
  sadness:  [55.00,  110.00, 146.83, 174.61],    // Low, minor-ish
  anger:    [65.41,  130.81, 155.56, 207.65],    // Tense
  fear:     [73.42,  110.00, 164.81, 196.00],    // Dissonant
  serenity: [174.61, 220.00, 261.63, 349.23],    // Pentatonic calm
  love:     [196.00, 246.94, 293.66, 392.00],    // Warm major
  surprise: [293.66, 369.99, 440.00, 587.33],    // High, open
  neutral:  [55.00,  110.00, 146.83, 220.00],    // Drone
};

/* ── State ───────────────────────────────────────────────────── */
let db             = null;
let currentMood    = MOODS.neutral;
let audioCtx       = null;
let masterGain     = null;
let audioNodes     = [];
let audioOn        = false;
let totalSignals   = 0;
let tickerTotal    = 0;
let userLat        = null;
let userLng        = null;
let loaderTimer    = null;

/* ── Three.js refs ───────────────────────────────────────────── */
let scene, camera, renderer;
let globeMesh, wireMesh, rimMesh, glowLight;
let particles2D    = [];      // 2-D canvas burst particles
let signalDots     = [];      // 3-D dots on globe surface
let isDragging     = false;
let prevMouse      = { x:0, y:0 };
let autoRotate     = true;
let pulseT         = 0;
let mouseParallax  = { x:0, y:0 };

/* ════════════════════════════════════════════════════════════════
   LOADER
   ════════════════════════════════════════════════════════════════ */
function hideLoader() {
  const loader = document.getElementById('loader');
  const app    = document.getElementById('app');
  loader.classList.add('fade-out');
  app.classList.remove('hidden');
  setTimeout(() => { loader.style.display = 'none'; }, 750);
}

loaderTimer = setTimeout(hideLoader, 1500);

/* ════════════════════════════════════════════════════════════════
   SUPABASE
   ════════════════════════════════════════════════════════════════ */
async function initDB() {
  try {
    db = supabase.createClient(SB_URL, SB_ANON);
    await fetchGlobalStats();
    subscribeRealtime();
  } catch (err) {
    console.warn('[DB] init error', err);
  }
}

async function fetchGlobalStats() {
  if (!db) return;
  try {
    const { data, error } = await db.from('mood_signals').select('mood_type');
    if (error) throw error;

    const counts = {};
    (data || []).forEach(r => { counts[r.mood_type] = (counts[r.mood_type] || 0) + 1; });
    totalSignals = (data || []).length;
    updateSignalCounter(totalSignals);
    renderDistBars(counts, totalSignals || 1);
    updateDominantMood(counts);
  } catch (err) {
    console.warn('[DB] fetchGlobalStats', err);
    renderDistBars({ joy:30, sadness:20, serenity:18, love:15, anger:10, fear:7 }, 100);
  }
}

window.fetchGlobalStats = fetchGlobalStats;

function subscribeRealtime() {
  if (!db) return;
  try {
    db.channel('mood_signals_v2')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'mood_signals' }, payload => {
        addTickerItem(payload.new, true);
        totalSignals++;
        animateCounter(totalSignals);
        fetchGlobalStats();
        chimeSignal();
      })
      .subscribe();
  } catch (err) {
    console.warn('[DB] realtime', err);
  }
}

/* ════════════════════════════════════════════════════════════════
   DISTRIBUTION BARS
   ════════════════════════════════════════════════════════════════ */
function renderDistBars(counts, total) {
  const el    = document.getElementById('dist-bars');
  const order = ['joy','sadness','serenity','love','anger','fear','surprise','neutral'];
  el.innerHTML = '';
  order.forEach(type => {
    const n   = counts[type] || 0;
    const pct = Math.round((n / total) * 100);
    const col = TYPE_COLOR[type] || '#4af0c8';
    const row = document.createElement('div');
    row.className = 'dist-row';
    row.innerHTML = `
      <span class="dist-label">${type}</span>
      <div class="dist-track"><div class="dist-fill" style="--bc:${col}"></div></div>
      <span class="dist-pct">${pct}%</span>`;
    el.appendChild(row);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      row.querySelector('.dist-fill').style.width = pct + '%';
    }));
  });
}

function updateDominantMood(counts) {
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  const el  = document.getElementById('ws-dominant');
  if (top && el) {
    el.textContent = top[0].toUpperCase();
    el.style.color = TYPE_COLOR[top[0]] || 'var(--accent)';
  }
}

/* ════════════════════════════════════════════════════════════════
   SIGNAL COUNTER
   ════════════════════════════════════════════════════════════════ */
function updateSignalCounter(n) {
  const el = document.getElementById('signal-count');
  if (el) el.textContent = n.toLocaleString();
  const hint = document.getElementById('hint-count');
  if (hint) hint.textContent = n > 0 ? n.toLocaleString() : 'thousands of';
}

function animateCounter(target) {
  const el   = document.getElementById('signal-count');
  if (!el) return;
  const cur  = parseInt(el.textContent.replace(/,/g,'')) || target - 1;
  const step = Math.ceil((target - cur) / 12);
  let   val  = cur;
  const tick = setInterval(() => {
    val = Math.min(val + step, target);
    el.textContent = val.toLocaleString();
    if (val >= target) clearInterval(tick);
  }, 40);
}

/* ════════════════════════════════════════════════════════════════
   TICKER
   ════════════════════════════════════════════════════════════════ */
let tickerItems = [];

function addTickerItem(signal, isNew = false) {
  const list  = document.getElementById('ticker-list');
  const color = TYPE_COLOR[signal.mood_type] || '#4af0c8';
  const mood  = MOODS[signal.word?.toLowerCase()] || null;
  const emoji = mood ? mood.e : (getEmojiForType(signal.mood_type));
  const loc   = [signal.city, signal.country]
                  .filter(s => s && s !== 'Unknown').join(', ') || 'Earth';

  const li = document.createElement('li');
  li.className = 'ticker-item';
  li.style.setProperty('--tc', color);
  li.innerHTML = `
    <span class="ticker-emoji">${emoji}</span>
    <div class="ticker-body">
      <span class="ticker-word">${esc(signal.word)}</span>
      <span class="ticker-meta">${esc(signal.mood_type)} · ${esc(loc)}</span>
    </div>`;

  list.prepend(li);
  tickerItems.unshift(li);

  if (tickerItems.length > 12) tickerItems.pop().remove();

  tickerTotal++;
  const badge = document.getElementById('ticker-badge');
  if (badge) badge.textContent = tickerTotal;
}

function getEmojiForType(type) {
  const map = { joy:'✨', sadness:'🌊', anger:'🔥', fear:'🌀', serenity:'🌿', love:'💗', surprise:'🌠', neutral:'◌' };
  return map[type] || '◌';
}

/* ════════════════════════════════════════════════════════════════
   MOOD INPUT + AUTOCOMPLETE
   ════════════════════════════════════════════════════════════════ */
window.onMoodInput = function(value) {
  const key  = value.trim().toLowerCase();
  const mood = MOODS[key] || inferMood(key) || MOODS.neutral;
  applyMood(mood, key);
  renderSuggestions(key);
  updateShareUrl(key);
};

function renderSuggestions(key) {
  const box = document.getElementById('suggestions');
  if (!key || key.length < 2) {
    box.innerHTML = '';
    box.classList.remove('has-items');
    return;
  }
  const matches = Object.keys(MOODS)
    .filter(w => w.startsWith(key) && w !== key)
    .slice(0, 6);

  if (!matches.length) {
    box.innerHTML = '';
    box.classList.remove('has-items');
    return;
  }
  box.innerHTML = matches.map(w =>
    `<button class="sug-pill" onclick="window.pickSuggestion('${w}')">${w}</button>`
  ).join('');
  box.classList.add('has-items');
}

window.pickSuggestion = function(word) {
  const input = document.getElementById('mood-input');
  input.value = word;
  window.onMoodInput(word);
  input.focus();
};

function applyMood(mood, key='') {
  currentMood = mood;
  document.documentElement.style.setProperty('--mood', mood.c);

  setGlobeColor(mood.c);

  const btn = document.getElementById('btn-send');
  if (btn) { btn.style.background = mood.c; btn.style.boxShadow = `0 0 28px ${mood.c}66`; }

  const chip = document.getElementById('mood-chip');
  if (chip) { chip.textContent = key ? mood.e : ''; chip.classList.toggle('visible', !!key); }

  document.getElementById('globe-mood-text').textContent = mood.t.toUpperCase();
  document.getElementById('globe-emoji').textContent     = mood.e;

  // Mood bleed
  const bleed = document.getElementById('mood-bleed');
  if (bleed) bleed.style.background = `radial-gradient(ellipse 60% 60% at 50% 50%, ${mood.c} 0%, transparent 70%)`;

  // Logo mark color
  const logo = document.querySelector('.logo-mark');
  if (logo) logo.style.color = mood.c;

  // Mood-reactive audio
  if (audioOn) shiftAudioMood(mood.t);
}

/* Partial-match fallback */
function inferMood(key) {
  if (!key || key.length < 3) return null;
  const match = Object.keys(MOODS).find(w => w.includes(key));
  return match ? MOODS[match] : null;
}

/* ════════════════════════════════════════════════════════════════
   SUBMIT
   ════════════════════════════════════════════════════════════════ */
window.submitMood = async function() {
  const wordEl  = document.getElementById('mood-input');
  const cityEl  = document.getElementById('city-input');
  const countEl = document.getElementById('country-input');
  const word    = wordEl.value.trim();

  if (!word) { showToast('✦ Type a mood word first'); return; }

  const key  = word.toLowerCase();
  const mood = MOODS[key] || inferMood(key) || { t: detectFallback(word), c:'#4af0c8', e:'◌' };
  applyMood(mood, key);

  const payload = {
    word,
    mood_type: mood.t,
    city:    cityEl.value.trim()  || 'Unknown',
    country: countEl.value.trim() || 'Unknown',
  };

  // Optimistic UI
  addTickerItem(payload, true);
  pulseT = 1.0;
  burstParticles(mood.c);
  prepareAuraCard(word, mood, payload.city, payload.country);
  wordEl.value = '';
  document.getElementById('suggestions').innerHTML = '';
  document.getElementById('suggestions').classList.remove('has-items');
  document.getElementById('mood-chip').classList.remove('visible');

  showToast('Signal sent ✦ Generating your Aura Card…');

  // DB insert
  if (db) {
    try {
      const { error } = await db.from('mood_signals').insert([payload]);
      if (error) throw error;
    } catch (err) { console.warn('[DB] insert', err); }
  }

  // Place dot on globe surface
  if (userLat !== null && userLng !== null) {
    addSignalDot(userLat, userLng, mood.c);
  } else {
    addSignalDot(
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 360,
      mood.c
    );
  }

  // Capture aura card
  setTimeout(captureAuraCard, 400);
};

function detectFallback(w) {
  w = w.toLowerCase();
  if (/happ|joy|glad|cheer/.test(w)) return 'joy';
  if (/sad|cry|lone|griev/.test(w))  return 'sadness';
  if (/ang|rage|mad|furi/.test(w))   return 'anger';
  if (/fear|scar|anxi|nerv/.test(w)) return 'fear';
  if (/love|care|warm|kis/.test(w))  return 'love';
  if (/calm|peace|zen|stil/.test(w)) return 'serenity';
  if (/wow|amaz|surp|shock/.test(w)) return 'surprise';
  return 'neutral';
}

/* ════════════════════════════════════════════════════════════════
   IP GEOLOCATION
   ════════════════════════════════════════════════════════════════ */
window.detectLocation = async function() {
  const btn = document.getElementById('btn-locate');
  btn.classList.add('loading');
  try {
    const res  = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (data.city)    document.getElementById('city-input').value    = data.city;
    if (data.country_name) document.getElementById('country-input').value = data.country_name;
    userLat = parseFloat(data.latitude)  || null;
    userLng = parseFloat(data.longitude) || null;
    showToast(`📍 Located: ${data.city}, ${data.country_name}`);
  } catch (err) {
    showToast('Could not detect location — fill it in manually');
    console.warn('[GEO]', err);
  } finally {
    btn.classList.remove('loading');
  }
};

/* Auto-detect silently on load */
async function silentGeoDetect() {
  try {
    const res  = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const city = document.getElementById('city-input');
    const ctry = document.getElementById('country-input');
    if (city && !city.value && data.city)         city.value = data.city;
    if (ctry && !ctry.value && data.country_name) ctry.value = data.country_name;
    userLat = parseFloat(data.latitude)  || null;
    userLng = parseFloat(data.longitude) || null;
  } catch (_) {}
}

/* ════════════════════════════════════════════════════════════════
   SHAREABLE URL
   ════════════════════════════════════════════════════════════════ */
function updateShareUrl(word) {
  const badge  = document.getElementById('share-badge');
  const urlEl  = document.getElementById('share-url-text');
  if (!word || word.length < 2) { badge.classList.add('hidden'); return; }
  const url = `${location.origin}${location.pathname}?mood=${encodeURIComponent(word)}`;
  urlEl.textContent = url.replace(/^https?:\/\//, '');
  badge.classList.remove('hidden');
}

window.copyShareUrl = function() {
  const word = document.getElementById('mood-input').value.trim() || currentMood.t;
  const url  = `${location.origin}${location.pathname}?mood=${encodeURIComponent(word)}`;
  navigator.clipboard.writeText(url).then(() => showToast('🔗 Share link copied!')).catch(() => showToast('Copy failed'));
};

/* Read ?mood= from URL on load */
function handleUrlMood() {
  const params = new URLSearchParams(location.search);
  const m      = params.get('mood');
  if (!m) return;
  const input = document.getElementById('mood-input');
  input.value = m;
  window.onMoodInput(m);
  showToast(`Mood loaded: "${m}" ✦`);
}

/* ════════════════════════════════════════════════════════════════
   AURA CARD
   ════════════════════════════════════════════════════════════════ */
function prepareAuraCard(word, mood, city, country) {
  document.getElementById('aura-word').textContent = word.toUpperCase();
  document.getElementById('aura-type').textContent = mood.t.toUpperCase();
  const loc = [city, country].filter(s => s && s !== 'Unknown').join(', ');
  document.getElementById('aura-loc').textContent  = loc || 'Somewhere on Earth';
  document.getElementById('aura-date').textContent = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  document.getElementById('aura-bg').style.background = `radial-gradient(ellipse at 30% 40%, ${mood.c} 0%, #050b1e 65%)`;
}

async function captureAuraCard() {
  const card = document.getElementById('aura-card');
  card.style.top = '-9999px'; card.style.left = '0px';
  try {
    const canvas = await html2canvas(card, { backgroundColor:null, scale:2, useCORS:true, logging:false });
    const a = document.createElement('a');
    a.download = 'mood-aura.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('🎴 Aura Card downloaded!');
  } catch (err) {
    console.warn('[AURA]', err);
  } finally {
    card.style.top = '-9999px'; card.style.left = '-9999px';
  }
}

/* ════════════════════════════════════════════════════════════════
   THREE.JS GLOBE — with continent outlines + rim glow + signal dots
   ════════════════════════════════════════════════════════════════ */

/* Simplified continent outlines as lat/lng polyline groups */
/* Each sub-array is one continuous stroke */
const CONTINENT_STROKES = (function() {
  // Very simplified world outlines (key coastal points)
  // Format: [[lat, lng], ...] arrays
  return [
    // North America
    [[70,-140],[60,-140],[55,-130],[50,-125],[45,-124],[40,-124],[35,-120],[30,-117],[25,-110],[20,-105],[15,-92],[10,-85],[8,-77],[10,-75],[15,-83],[20,-87],[25,-90],[30,-90],[35,-88],[40,-76],[45,-64],[50,-55],[55,-60],[60,-65],[65,-70],[70,-75],[72,-80],[70,-95],[70,-110],[70,-125],[70,-140]],
    // South America
    [[10,-75],[5,-77],[0,-78],[-5,-80],[-10,-75],[-15,-75],[-20,-70],[-25,-70],[-30,-72],[-35,-72],[-40,-65],[-45,-65],[-50,-69],[-55,-68],[-55,-64],[-50,-58],[-45,-52],[-40,-50],[-35,-54],[-30,-50],[-25,-48],[-20,-40],[-15,-38],[-10,-37],[-5,-35],[0,-50],[5,-52],[10,-62],[10,-75]],
    // Europe
    [[36,36],[38,27],[40,22],[42,18],[44,14],[46,12],[44,8],[42,3],[44,-1],[44,-8],[42,-9],[38,-9],[36,-6],[36,0],[36,10],[36,25],[36,36]],
    // Northern Europe
    [[55,14],[58,8],[58,5],[58,7],[60,5],[62,6],[64,8],[65,14],[65,22],[60,22],[58,18],[55,14]],
    // Scandinavia
    [[57,8],[58,7],[60,5],[62,6],[64,8],[65,15],[68,15],[70,24],[72,26],[70,28],[68,20],[65,16],[62,6]],
    // Africa
    [[37,10],[35,10],[30,32],[25,37],[20,38],[15,42],[10,44],[5,42],[0,42],[-5,40],[-10,38],[-15,35],[-20,35],[-25,33],[-30,30],[-34,26],[-34,18],[-28,16],[-20,13],[-15,12],[-10,16],[-5,10],[0,8],[5,2],[10,-1],[15,-17],[20,-17],[25,-15],[30,-10],[37,10]],
    // Asia (simplified)
    [[36,36],[40,36],[42,42],[45,50],[50,60],[55,68],[60,72],[65,72],[70,68],[72,100],[68,140],[60,140],[55,130],[50,140],[45,135],[40,128],[35,120],[30,122],[25,120],[20,110],[15,108],[10,104],[5,100],[5,95],[10,80],[15,73],[20,72],[22,68],[25,62],[25,58],[30,48],[35,36],[36,36]],
    // Australia
    [[-15,130],[-12,136],[-14,136],[-20,148],[-25,153],[-30,153],[-35,150],[-38,146],[-38,140],[-34,136],[-30,114],[-22,114],[-18,122],[-15,128],[-15,130]],
    // Japan (simplified)
    [[31,130],[34,132],[36,136],[38,140],[42,140],[44,145],[42,142],[40,140],[36,136],[34,130],[31,130]],
  ];
})();

function latLngToVec3(lat, lng, r) {
  const phi   = (90 - lat)  * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function buildContinentLines(r) {
  const group = new THREE.Group();
  const mat   = new THREE.LineBasicMaterial({ color: 0x4af0c8, transparent: true, opacity: 0.55, linewidth: 1 });

  CONTINENT_STROKES.forEach(stroke => {
    const pts = stroke.map(([lat,lng]) => latLngToVec3(lat, lng, r));
    const geo  = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, mat.clone()));
  });
  return group;
}

let continentGroup = null;

function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  const W = window.innerWidth, H = window.innerHeight;

  scene    = new THREE.Scene();
  camera   = new THREE.PerspectiveCamera(42, W/H, 0.1, 1000);
  camera.position.z = 2.9;

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* Inner solid sphere */
  const solidGeo = new THREE.SphereGeometry(1, 48, 48);
  const solidMat = new THREE.MeshPhongMaterial({
    color:     0x030810,
    emissive:  0x010408,
    transparent: true, opacity: 0.97,
  });
  globeMesh = new THREE.Mesh(solidGeo, solidMat);
  scene.add(globeMesh);

  /* Wireframe latitude/longitude grid */
  const wireGeo = new THREE.SphereGeometry(1.003, 24, 24);
  const wireMat = new THREE.MeshBasicMaterial({ color:0x4af0c8, wireframe:true, transparent:true, opacity:0.10 });
  wireMesh = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireMesh);

  /* Continent outlines */
  continentGroup = buildContinentLines(1.005);
  scene.add(continentGroup);

  /* Atmospheric rim (backside shell) */
  const rimGeo = new THREE.SphereGeometry(1.08, 32, 32);
  const rimMat = new THREE.MeshBasicMaterial({ color:0x4af0c8, transparent:true, opacity:0.06, side:THREE.BackSide });
  rimMesh = new THREE.Mesh(rimGeo, rimMat);
  scene.add(rimMesh);

  /* Outer glow halo */
  const haloGeo = new THREE.SphereGeometry(1.18, 24, 24);
  const haloMat = new THREE.MeshBasicMaterial({ color:0x4af0c8, transparent:true, opacity:0.02, side:THREE.BackSide });
  scene.add(new THREE.Mesh(haloGeo, haloMat));

  /* Lights */
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  glowLight = new THREE.DirectionalLight(0x4af0c8, 1.4);
  glowLight.position.set(3, 2, 3);
  scene.add(glowLight);
  const back = new THREE.DirectionalLight(0x7b5ef8, 0.5);
  back.position.set(-3,-2,-3); scene.add(back);

  /* Stars */
  buildStars();

  /* Input events */
  setupDrag(canvas);
  window.addEventListener('mousemove', e => {
    mouseParallax.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseParallax.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animateGlobe();
}

function buildStars() {
  const geo = new THREE.BufferGeometry();
  const n   = 2400;
  const pos = new Float32Array(n * 3);
  const sz  = new Float32Array(n);
  for (let i=0; i<n; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r  = 7 + Math.random() * 8;
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    pos[i*3+2] = r * Math.cos(ph);
    sz[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color:0xffffff, size:0.022, transparent:true, opacity:0.75 });
  scene.add(new THREE.Points(geo, mat));
}

function setupDrag(canvas) {
  const start = (x,y) => { isDragging=true; autoRotate=false; prevMouse={x,y}; };
  const move  = (x,y) => {
    if (!isDragging) return;
    const dx = x - prevMouse.x, dy = y - prevMouse.y;
    rotateGlobe(dx * 0.005, dy * 0.005);
    prevMouse = {x,y};
  };
  const end   = () => { isDragging=false; setTimeout(()=>{ autoRotate=true; },2200); };

  canvas.addEventListener('mousedown',  e => start(e.clientX, e.clientY));
  window.addEventListener('mousemove',  e => move(e.clientX, e.clientY));
  window.addEventListener('mouseup',    end);
  canvas.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), {passive:true});
  canvas.addEventListener('touchmove',  e => move(e.touches[0].clientX, e.touches[0].clientY),  {passive:true});
  canvas.addEventListener('touchend',   end);
}

function rotateGlobe(dx, dy) {
  [globeMesh, wireMesh, rimMesh, continentGroup].forEach(o => {
    if (!o) return;
    o.rotation.y += dx;
    o.rotation.x += dy;
  });
}

function setGlobeColor(hex) {
  if (!wireMesh)       return;
  wireMesh.material.color.set(hex);
  if (rimMesh)         rimMesh.material.color.set(hex);
  if (glowLight)       glowLight.color.set(hex);
  if (continentGroup)  continentGroup.children.forEach(l => l.material.color.set(hex));
}

/* Add a glowing dot at lat/lng on the globe */
function addSignalDot(lat, lng, color) {
  const pos = latLngToVec3(lat, lng, 1.015);
  const geo = new THREE.SphereGeometry(0.018, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:1.0 });
  const dot = new THREE.Mesh(geo, mat);
  dot.position.copy(pos);

  // Copy globe rotation so dot sits on the surface correctly
  dot.position.applyEuler(globeMesh.rotation);

  scene.add(dot);
  const info = { mesh:dot, life:1.0 };
  signalDots.push(info);
}

function animateGlobe() {
  requestAnimationFrame(animateGlobe);

  if (autoRotate) {
    const dr = 0.0013;
    [globeMesh, wireMesh, rimMesh, continentGroup].forEach(o => { if (o) o.rotation.y += dr; });
  }

  // Subtle parallax tilt
  if (!isDragging) {
    globeMesh.rotation.x += (mouseParallax.y * 0.04 - globeMesh.rotation.x) * 0.02;
  }

  // Pulse
  if (pulseT > 0) {
    const s = 1 + Math.sin(pulseT * Math.PI) * 0.07;
    [globeMesh, wireMesh, rimMesh, continentGroup].forEach(o => { if (o) o.scale.setScalar(s); });
    pulseT = Math.max(0, pulseT - 0.035);
  } else {
    [globeMesh, wireMesh, rimMesh, continentGroup].forEach(o => { if (o) o.scale.setScalar(1); });
  }

  // Signal dots fade out
  signalDots = signalDots.filter(d => {
    d.life -= 0.008;
    d.mesh.material.opacity = Math.max(0, d.life);
    d.mesh.scale.setScalar(1 + (1 - d.life) * 0.8);
    if (d.life <= 0) { scene.remove(d.mesh); return false; }
    return true;
  });

  renderer.render(scene, camera);
}

/* ════════════════════════════════════════════════════════════════
   2D PARTICLE BURST (canvas overlay)
   ════════════════════════════════════════════════════════════════ */
const pCanvas = document.createElement('canvas'); // we use #particle-canvas from HTML
let   pCtx    = null;

function initParticleCanvas() {
  const el = document.getElementById('particle-canvas');
  el.width  = window.innerWidth;
  el.height = window.innerHeight;
  pCtx = el.getContext('2d');
  window.addEventListener('resize', () => { el.width = window.innerWidth; el.height = window.innerHeight; });
  animateParticles();
}

function burstParticles(color) {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles2D.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r:  2 + Math.random() * 3,
      life: 1.0,
      decay: 0.012 + Math.random() * 0.018,
      color,
    });
  }
}

function animateParticles() {
  requestAnimationFrame(animateParticles);
  if (!pCtx) return;
  pCtx.clearRect(0, 0, pCtx.canvas.width, pCtx.canvas.height);
  particles2D = particles2D.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.96; p.vy *= 0.96;
    p.life -= p.decay;
    if (p.life <= 0) return false;
    pCtx.save();
    pCtx.globalAlpha = p.life;
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = p.color;
    pCtx.shadowBlur  = 8;
    pCtx.shadowColor = p.color;
    pCtx.fill();
    pCtx.restore();
    return true;
  });
}

/* ════════════════════════════════════════════════════════════════
   AUDIO ENGINE — mood-reactive Web Audio API
   ════════════════════════════════════════════════════════════════ */
window.toggleAudio = function() {
  audioOn ? stopAudio() : startAudio();
};

function startAudio() {
  try {
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 2.5);
    masterGain.connect(audioCtx.destination);

    buildDrone(currentMood.t || 'neutral');
    audioOn = true;
    const btn = document.getElementById('btn-audio');
    if (btn) { btn.classList.add('active'); document.getElementById('audio-icon-glyph').textContent = '◉'; }
  } catch (e) {
    showToast('Audio unavailable in this browser');
    console.warn('[AUDIO]', e);
  }
}

function buildDrone(moodType) {
  // Clear old nodes
  audioNodes.forEach(n => { try { n.stop(); } catch(_){} });
  audioNodes = [];

  const freqs = AUDIO_FREQS[moodType] || AUDIO_FREQS.neutral;
  freqs.forEach((freq, i) => {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const lfo  = audioCtx.createOscillator();
    const lfog = audioCtx.createGain();

    osc.type           = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    lfo.frequency.value = 0.06 + i * 0.025;
    lfog.gain.value     = 0.4;
    gain.gain.value     = 0.07 / (i + 1);

    lfo.connect(lfog); lfog.connect(osc.frequency);
    osc.connect(gain); gain.connect(masterGain);
    lfo.start(); osc.start();
    audioNodes.push(osc, lfo);
  });
}

function shiftAudioMood(moodType) {
  if (!audioOn || !audioCtx) return;
  // Crossfade to new drone
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
  setTimeout(() => {
    buildDrone(moodType);
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.2);
  }, 850);
}

/* Short chime on new realtime signal */
function chimeSignal() {
  if (!audioOn || !audioCtx) return;
  try {
    const osc  = audioCtx.createOscillator();
    const env  = audioCtx.createGain();
    osc.frequency.value = 880;
    osc.type = 'sine';
    env.gain.setValueAtTime(0.08, audioCtx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(env); env.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.6);
  } catch(_) {}
}

function stopAudio() {
  audioNodes.forEach(n => { try { n.stop(); } catch(_){} });
  audioNodes = [];
  if (masterGain) { masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); }
  setTimeout(() => { if (audioCtx) { audioCtx.close(); audioCtx = null; } }, 600);
  audioOn = false;
  const btn = document.getElementById('btn-audio');
  if (btn) { btn.classList.remove('active'); document.getElementById('audio-icon-glyph').textContent = '◎'; }
}

/* ════════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}

/* ════════════════════════════════════════════════════════════════
   UTILITY
   ════════════════════════════════════════════════════════════════ */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {

  // Globe + particles
  initGlobe();
  initParticleCanvas();

  // Supabase (non-blocking; loader forced at 1.5s)
  initDB().then(() => {
    clearTimeout(loaderTimer);
    hideLoader();
  }).catch(() => {});

  // Silently geo-detect
  silentGeoDetect();

  // Seed demo ticker
  const seeds = [
    { word:'hopeful',    mood_type:'joy',      city:'Tokyo',     country:'Japan' },
    { word:'nostalgic',  mood_type:'sadness',  city:'Paris',     country:'France' },
    { word:'serene',     mood_type:'serenity', city:'Bali',      country:'Indonesia' },
    { word:'electric',   mood_type:'surprise', city:'New York',  country:'USA' },
    { word:'tender',     mood_type:'love',     city:'Rome',      country:'Italy' },
    { word:'zen',        mood_type:'serenity', city:'Kyoto',     country:'Japan' },
  ];
  seeds.reverse().forEach((s, i) => setTimeout(() => addTickerItem(s), i * 260));

  // Enter key
  document.getElementById('mood-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') window.submitMood();
  });

  // URL mood param
  handleUrlMood();

  // Demo counter seed (until real data loads)
  updateSignalCounter(0);
});

})(); // end IIFE
