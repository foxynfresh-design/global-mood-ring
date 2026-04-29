
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

/* ════════════════════════════════════════════════════════════
   GLOBAL MOOD RING — script.js
   Three.js r128 | Supabase v2 | html2canvas 1.4.1
   ════════════════════════════════════════════════════════════ */

'use strict';

/* ── Supabase Config ────────────────────────────────────────── */
const SUPABASE_URL  = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

/* ── Mood Dictionary ────────────────────────────────────────── */
const MOOD_MAP = {
  // Joy cluster
  happy:     { type: 'joy',       color: '#ffd166', emoji: '☀️' },
  joyful:    { type: 'joy',       color: '#ffd166', emoji: '🌟' },
  excited:   { type: 'joy',       color: '#ff9f1c', emoji: '⚡' },
  elated:    { type: 'joy',       color: '#ffbf69', emoji: '✨' },
  bliss:     { type: 'joy',       color: '#ffd166', emoji: '🌈' },
  // Sad cluster
  sad:       { type: 'sadness',   color: '#4895ef', emoji: '🌊' },
  lonely:    { type: 'sadness',   color: '#3a86ff', emoji: '🌙' },
  melancholy:{ type: 'sadness',   color: '#4361ee', emoji: '💙' },
  grief:     { type: 'sadness',   color: '#2d3a8c', emoji: '🫧' },
  // Anger cluster
  angry:     { type: 'anger',     color: '#ef233c', emoji: '🔥' },
  rage:      { type: 'anger',     color: '#d62828', emoji: '💢' },
  frustrated:{ type: 'anger',     color: '#f4433c', emoji: '⚡' },
  // Fear cluster
  anxious:   { type: 'fear',      color: '#9b5de5', emoji: '🌀' },
  scared:    { type: 'fear',      color: '#7b2d8b', emoji: '👁️' },
  nervous:   { type: 'fear',      color: '#b57bee', emoji: '🌪️' },
  // Calm cluster
  calm:      { type: 'serenity',  color: '#4af0c8', emoji: '🌿' },
  peaceful:  { type: 'serenity',  color: '#56cfe1', emoji: '🍃' },
  zen:       { type: 'serenity',  color: '#2ec4b6', emoji: '☯️' },
  serene:    { type: 'serenity',  color: '#80ffdb', emoji: '🌊' },
  // Love cluster
  love:      { type: 'love',      color: '#ff6b9d', emoji: '💗' },
  romantic:  { type: 'love',      color: '#ff4d8d', emoji: '🌹' },
  grateful:  { type: 'love',      color: '#ff85a1', emoji: '🙏' },
  // Disgust cluster
  disgusted: { type: 'disgust',   color: '#6a994e', emoji: '😤' },
  // Surprise cluster
  surprised: { type: 'surprise',  color: '#f77f00', emoji: '🎆' },
  amazed:    { type: 'surprise',  color: '#fcbf49', emoji: '🌠' },
  // Neutral
  neutral:   { type: 'neutral',   color: '#4af0c8', emoji: '◌' },
};

const MOOD_COLORS_BY_TYPE = {
  joy:      '#ffd166',
  sadness:  '#4895ef',
  anger:    '#ef233c',
  fear:     '#9b5de5',
  serenity: '#4af0c8',
  love:     '#ff6b9d',
  disgust:  '#6a994e',
  surprise: '#f77f00',
  neutral:  '#4af0c8',
};

/* ── State ──────────────────────────────────────────────────── */
let db          = null;
let currentMood = MOOD_MAP.neutral;
let audioCtx    = null;
let audioOn     = false;
let oscillators = [];
let tickerItems = [];

/* ════════════════════════════════════════════════════════════
   LOADER  ─  forced hide after 1.5s
   ════════════════════════════════════════════════════════════ */
function hideLoader() {
  const loader = document.getElementById('loader');
  const app    = document.getElementById('app');
  loader.classList.add('fade-out');
  app.classList.remove('hidden');
  setTimeout(() => { loader.style.display = 'none'; }, 700);
}

const loaderForce = setTimeout(hideLoader, 1500);

/* ════════════════════════════════════════════════════════════
   SUPABASE INIT
   ════════════════════════════════════════════════════════════ */
async function initSupabase() {
  try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    await fetchGlobalStats();
    subscribeRealtime();
  } catch (err) {
    console.warn('Supabase init error:', err);
  }
}

/* ════════════════════════════════════════════════════════════
   FETCH GLOBAL STATS — mood distribution bars
   ════════════════════════════════════════════════════════════ */
async function fetchGlobalStats() {
  if (!db) return;
  try {
    const { data, error } = await db
      .from('mood_signals')
      .select('mood_type');

    if (error) throw error;

    const counts = {};
    (data || []).forEach(row => {
      counts[row.mood_type] = (counts[row.mood_type] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    renderDistBars(counts, total);
  } catch (err) {
    console.warn('fetchGlobalStats error:', err);
    // Render placeholder distribution
    renderDistBars({ joy: 30, sadness: 20, serenity: 18, love: 15, anger: 10, fear: 7 }, 100);
  }
}

function renderDistBars(counts, total) {
  const container = document.getElementById('dist-bars');
  const order = ['joy','sadness','serenity','love','anger','fear','surprise','neutral'];

  container.innerHTML = '';

  order.forEach(type => {
    const n   = counts[type] || 0;
    const pct = Math.round((n / total) * 100);
    const col = MOOD_COLORS_BY_TYPE[type] || '#4af0c8';

    const row = document.createElement('div');
    row.className = 'dist-row';
    row.innerHTML = `
      <span class="dist-label">${type}</span>
      <div class="dist-track"><div class="dist-fill" style="--bar-color:${col}"></div></div>
      <span class="dist-pct">${pct}%</span>
    `;
    container.appendChild(row);

    // Animate bar width on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector('.dist-fill').style.width = pct + '%';
      });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   REALTIME SUBSCRIPTION
   ════════════════════════════════════════════════════════════ */
function subscribeRealtime() {
  if (!db) return;
  try {
    db
      .channel('mood_signals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_signals' }, payload => {
        addTickerItem(payload.new);
        fetchGlobalStats();
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscribe error:', err);
  }
}

/* ════════════════════════════════════════════════════════════
   TICKER
   ════════════════════════════════════════════════════════════ */
function addTickerItem(signal) {
  const list  = document.getElementById('ticker-list');
  const color = MOOD_COLORS_BY_TYPE[signal.mood_type] || '#4af0c8';
  const loc   = [signal.city, signal.country].filter(Boolean).join(', ') || 'Unknown';

  const li = document.createElement('li');
  li.className = 'ticker-item';
  li.style.setProperty('--item-color', color);
  li.innerHTML = `
    <span class="ticker-word">${escHtml(signal.word)}</span>
    <span class="ticker-meta">${escHtml(signal.mood_type)} · ${escHtml(loc)}</span>
  `;

  list.prepend(li);
  tickerItems.unshift(li);

  // Keep max 10 items
  if (tickerItems.length > 10) {
    const old = tickerItems.pop();
    old.remove();
  }
}

/* ════════════════════════════════════════════════════════════
   MOOD INPUT — real-time color change
   ════════════════════════════════════════════════════════════ */
window.onMoodInput = function(value) {
  const key  = value.trim().toLowerCase();
  const mood = MOOD_MAP[key] || MOOD_MAP.neutral;
  applyMood(mood);
};

function applyMood(mood) {
  currentMood = mood;

  // CSS variable (affects input border, button shadow, etc.)
  document.documentElement.style.setProperty('--mood-color', mood.color);

  // Globe wireframe color
  setGlobeColor(mood.color);

  // Button
  const btn = document.getElementById('btn-send');
  if (btn) {
    btn.style.background  = mood.color;
    btn.style.boxShadow   = `0 0 24px ${mood.color}`;
  }

  // Label
  const moodText  = document.getElementById('globe-mood-text');
  const moodEmoji = document.getElementById('globe-mood-emoji');
  if (moodText)  moodText.textContent  = mood.type.toUpperCase();
  if (moodEmoji) moodEmoji.textContent = mood.emoji;
}

/* ════════════════════════════════════════════════════════════
   SUBMIT MOOD
   ════════════════════════════════════════════════════════════ */
window.submitMood = async function() {
  const input   = document.getElementById('mood-input');
  const cityEl  = document.getElementById('city-input');
  const countEl = document.getElementById('country-input');
  const word    = input.value.trim();

  if (!word) { showToast('Please type a mood word first ✦'); return; }

  const key  = word.toLowerCase();
  const mood = MOOD_MAP[key] || { type: detectMoodFallback(word), color: '#4af0c8', emoji: '◌' };
  applyMood(mood);

  const payload = {
    word:      word,
    mood_type: mood.type,
    city:      cityEl.value.trim()  || 'Unknown',
    country:   countEl.value.trim() || 'Unknown',
  };

  // Optimistic UI tick
  addTickerItem(payload);

  // Pulse the globe
  pulseGlobe();

  // Prepare aura card
  prepareAuraCard(word, mood, payload.city, payload.country);

  // Clear input
  input.value = '';

  showToast('Signal sent ✦ Preparing your Aura Card…');

  // Supabase insert
  if (db) {
    try {
      const { error } = await db.from('mood_signals').insert([payload]);
      if (error) throw error;
    } catch (err) {
      console.warn('Insert error:', err);
    }
  }

  // Capture aura card after slight delay (allow repaint)
  setTimeout(captureAuraCard, 300);
};

/* Simple keyword-based fallback classifier */
function detectMoodFallback(word) {
  const w = word.toLowerCase();
  if (/joy|happ|glad|cheer|delig/.test(w)) return 'joy';
  if (/sad|cry|tear|grief|mourn/.test(w)) return 'sadness';
  if (/ang|rage|furi|mad|hate/.test(w)) return 'anger';
  if (/fear|scar|terr|anxi|nerv/.test(w)) return 'fear';
  if (/love|care|warm|grat|kiss/.test(w)) return 'love';
  if (/calm|peace|rest|still|zen/.test(w)) return 'serenity';
  if (/wow|surp|amaz|shock|stun/.test(w)) return 'surprise';
  return 'neutral';
}

/* ════════════════════════════════════════════════════════════
   AURA CARD
   ════════════════════════════════════════════════════════════ */
function prepareAuraCard(word, mood, city, country) {
  document.getElementById('aura-word').textContent  = word.toUpperCase();
  document.getElementById('aura-mood').textContent  = mood.type.toUpperCase();
  document.getElementById('aura-meta').textContent  = [city, country].filter(s => s && s !== 'Unknown').join(', ') || 'Somewhere on Earth';
  document.getElementById('aura-date').textContent  = new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
  document.getElementById('aura-bg').style.background = `radial-gradient(ellipse at 30% 40%, ${mood.color} 0%, #0a0d1f 60%)`;
}

async function captureAuraCard() {
  const card = document.getElementById('aura-card');
  // Temporarily move onscreen for capture
  card.style.top  = '-9999px';
  card.style.left = '0px';

  try {
    const canvas = await html2canvas(card, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = 'mood-aura.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('🎴 Aura Card downloaded!');
  } catch (err) {
    console.warn('html2canvas error:', err);
    showToast('Could not capture Aura Card');
  } finally {
    card.style.top  = '-9999px';
    card.style.left = '-9999px';
  }
}

/* ════════════════════════════════════════════════════════════
   THREE.JS GLOBE
   ════════════════════════════════════════════════════════════ */
let scene, camera, renderer, globe, wireSphere;
let isDragging = false, prevMouse = { x: 0, y: 0 };
let autoRotate  = true;

function initGlobe() {
  const canvas = document.getElementById('globe-canvas');

  /* Scene */
  scene = new THREE.Scene();

  /* Camera */
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 2.8;

  /* Renderer */
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* Geometry */
  const geo = new THREE.SphereGeometry(1, 48, 48);

  /* Solid inner sphere (dark tinted) */
  const matSolid = new THREE.MeshPhongMaterial({
    color: 0x050c1f,
    emissive: 0x020812,
    transparent: true,
    opacity: 0.92,
  });
  globe = new THREE.Mesh(geo, matSolid);
  scene.add(globe);

  /* Wireframe overlay */
  const wireGeo = new THREE.SphereGeometry(1.002, 28, 28);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x4af0c8,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  wireSphere = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireSphere);

  /* Atmospheric glow (large additive shell) */
  const glowGeo = new THREE.SphereGeometry(1.12, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x4af0c8,
    transparent: true,
    opacity: 0.04,
    side: THREE.BackSide,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glowMesh);

  /* Lights */
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x4af0c8, 1.2);
  dirLight.position.set(3, 3, 3);
  scene.add(dirLight);

  const backLight = new THREE.DirectionalLight(0x7b5ef8, 0.6);
  backLight.position.set(-3, -2, -3);
  scene.add(backLight);

  /* Stars */
  buildStarField();

  /* Mouse drag */
  canvas.addEventListener('mousedown', e => {
    isDragging = true; autoRotate = false;
    prevMouse  = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    globe.rotation.y      += dx * 0.005;
    wireSphere.rotation.y += dx * 0.005;
    globe.rotation.x      += dy * 0.005;
    wireSphere.rotation.x += dy * 0.005;
    prevMouse = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 2000);
  });

  /* Touch drag */
  canvas.addEventListener('touchstart', e => {
    isDragging = true; autoRotate = false;
    prevMouse  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - prevMouse.x;
    const dy = e.touches[0].clientY - prevMouse.y;
    globe.rotation.y      += dx * 0.005;
    wireSphere.rotation.y += dx * 0.005;
    globe.rotation.x      += dy * 0.005;
    wireSphere.rotation.x += dy * 0.005;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 2000);
  });

  /* Resize */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* Animate */
  animate();
}

function buildStarField() {
  const starGeo = new THREE.BufferGeometry();
  const count   = 1800;
  const pos     = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 8 + Math.random() * 6;
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat  = new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.7 });
  const stars    = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

/* Globe color update */
function setGlobeColor(hexColor) {
  if (!wireSphere) return;
  wireSphere.material.color.set(hexColor);

  // Also update lights
  scene.children.forEach(child => {
    if (child.isDirectionalLight && child.color) {
      if (child.position.x > 0) child.color.set(hexColor);
    }
  });
}

/* Globe pulse on submit */
let pulseT = 0;
function pulseGlobe() {
  pulseT = 1.0;
}

/* Animation loop */
function animate() {
  requestAnimationFrame(animate);

  if (autoRotate) {
    globe.rotation.y      += 0.0012;
    wireSphere.rotation.y += 0.0018;
    wireSphere.rotation.x += 0.0004;
  }

  // Pulse scale
  if (pulseT > 0) {
    const s = 1 + Math.sin(pulseT * Math.PI) * 0.08;
    globe.scale.setScalar(s);
    wireSphere.scale.setScalar(s);
    pulseT = Math.max(0, pulseT - 0.04);
  } else {
    globe.scale.setScalar(1);
    wireSphere.scale.setScalar(1);
  }

  renderer.render(scene, camera);
}

/* ════════════════════════════════════════════════════════════
   AUDIO ENGINE  — Web Audio API ambient soundscape
   ════════════════════════════════════════════════════════════ */
window.toggleAudio = function() {
  if (!audioOn) {
    startAudio();
  } else {
    stopAudio();
  }
};

function startAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0, audioCtx.currentTime);
    master.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 2);
    master.connect(audioCtx.destination);

    // Drone tones
    const freqs = [55, 110, 146.83, 220, 329.63];
    freqs.forEach((freq, i) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;

      // Slow LFO vibrato
      const lfo  = audioCtx.createOscillator();
      const lfog = audioCtx.createGain();
      lfo.frequency.value = 0.08 + i * 0.03;
      lfog.gain.value     = 0.5;
      lfo.connect(lfog);
      lfog.connect(osc.frequency);
      lfo.start();

      gain.gain.value = 0.06 / (i + 1);
      osc.connect(gain);
      gain.connect(master);
      osc.start();

      oscillators.push(osc, lfo);
    });

    audioOn = true;
    const btn = document.getElementById('btn-audio');
    if (btn) { btn.textContent = '◉ Soundscape ON'; btn.classList.add('active'); }
  } catch (e) {
    console.warn('Audio error:', e);
    showToast('Audio not available in this browser');
  }
}

function stopAudio() {
  oscillators.forEach(o => { try { o.stop(); } catch(_) {} });
  oscillators = [];
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  audioOn = false;
  const btn = document.getElementById('btn-audio');
  if (btn) { btn.textContent = '◎ Enable Soundscape'; btn.classList.remove('active'); }
}

/* ════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3200);
}

/* ════════════════════════════════════════════════════════════
   UTILITY
   ════════════════════════════════════════════════════════════ */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {

  // 1. Kick off supabase (non-blocking)
  initSupabase().then(() => {
    clearTimeout(loaderForce);
    hideLoader();
  }).catch(() => {
    // loader already forced-hidden at 1.5s
  });

  // 2. Init globe immediately
  initGlobe();

  // 3. Seed a few demo ticker items so UI isn't empty
  const demoSeeds = [
    { word: 'hopeful',   mood_type: 'joy',      city: 'Tokyo',    country: 'Japan' },
    { word: 'nostalgic', mood_type: 'sadness',  city: 'Paris',    country: 'France' },
    { word: 'serene',    mood_type: 'serenity', city: 'Bali',     country: 'Indonesia' },
    { word: 'electric',  mood_type: 'surprise', city: 'NYC',      country: 'USA' },
    { word: 'cozy',      mood_type: 'joy',      city: 'London',   country: 'UK' },
  ];
  demoSeeds.reverse().forEach((s, i) => {
    setTimeout(() => addTickerItem(s), i * 220);
  });

  // 4. Enter key to submit
  document.getElementById('mood-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') window.submitMood();
  });
});

/* expose fetchGlobalStats for any manual refresh need */
window.fetchGlobalStats = fetchGlobalStats;
