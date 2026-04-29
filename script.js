(function () {
'use strict';

const SB_URL  = 'https://elffxqkhihilfmbnengx.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

/* ── Mood Dictionary ─────────────────────────────────────────── */
const MOODS = {
  happy:      { t:'joy',      c:'#ffd166', e:'☀️' },
  joyful:     { t:'joy',      c:'#ffd166', e:'🌟' },
  excited:    { t:'joy',      c:'#ff9f1c', e:'⚡' },
  calm:       { t:'serenity', c:'#4af0c8', e:'🌿' },
  zen:        { t:'serenity', c:'#2ec4b6', e:'☯️' },
  sad:        { t:'sadness',  c:'#4895ef', e:'🌊' },
  angry:      { t:'anger',    c:'#ef233c', e:'🔥' },
  love:       { t:'love',     c:'#ff6b9d', e:'💗' },
  anxious:    { t:'fear',     c:'#9b5de5', e:'🌀' },
  neutral:    { t:'neutral',  c:'#4af0c8', e:'◌'  },
};

const TYPE_COLOR = {
  joy:'#ffd166', sadness:'#4895ef', anger:'#ef233c', fear:'#9b5de5', serenity:'#4af0c8', love:'#ff6b9d', neutral:'#7a8fb5'
};

/* ── State ───────────────────────────────────────────────────── */
let db, currentMood = MOODS.neutral, audioCtx, masterGain, audioNodes = [], audioOn = false;
let scene, camera, renderer, controls, globeMesh, wireMesh, rimMesh, glowLight, continentGroup;
let particles2D = [], signalDots = [], userLat = null, userLng = null, userCity = 'Unknown', userCountry = 'Unknown';

/* ════════════════════════════════════════════════════════════════
   SUPABASE & REALTIME
   ════════════════════════════════════════════════════════════════ */
async function initDB() {
  db = supabase.createClient(SB_URL, SB_ANON);
  await fetchGlobalStats();
  db.channel('mood_signals').on('postgres_changes', { event:'INSERT', schema:'public', table:'mood_signals' }, p => {
    addTickerItem(p.new, true);
    fetchGlobalStats();
  }).subscribe();
}

async function fetchGlobalStats() {
  const { data } = await db.from('mood_signals').select('mood_type');
  if (!data) return;
  const counts = {};
  data.forEach(r => { counts[r.mood_type] = (counts[r.mood_type] || 0) + 1; });
  updateSignalCounter(data.length);
  renderDistBars(counts, data.length);
  updateDominantMood(counts);
}

/* ════════════════════════════════════════════════════════════════
   GEOLOCATION (SILENT)
   ════════════════════════════════════════════════════════════════ */
async function silentGeoDetect() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    userCity = data.city || 'Unknown';
    userCountry = data.country_name || 'Unknown';
    userLat = parseFloat(data.latitude);
    userLng = parseFloat(data.longitude);
  } catch (e) { console.warn("Geo fail", e); }
}

/* ════════════════════════════════════════════════════════════════
   SUBMIT & AURA
   ════════════════════════════════════════════════════════════════ */
window.submitMood = async function() {
  const wordEl = document.getElementById('mood-input');
  const word = wordEl.value.trim();
  if (!word) return;

  const mood = MOODS[word.toLowerCase()] || { t:'neutral', c:'#4af0c8', e:'◌' };
  const payload = { word, mood_type: mood.t, city: userCity, country: userCountry };

  // UI Effects
  burstParticles(mood.c);
  addSignalDot(userLat || (Math.random()-0.5)*160, userLng || (Math.random()-0.5)*360, mood.c);
  
  // Display Aura Card instead of auto-downloading
  prepareAuraCard(word, mood, userCity, userCountry);
  const card = document.getElementById('aura-card');
  card.classList.add('active');
  setTimeout(() => card.classList.remove('active'), 5000);

  if (db) await db.from('mood_signals').insert([payload]);
  wordEl.value = '';
};

/* ════════════════════════════════════════════════════════════════
   GLOBE (HIGH RES + ORBIT CONTROLS)
   ════════════════════════════════════════════════════════════════ */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 3.5;

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // OrbitControls for Google Earth feel
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  const geo = new THREE.SphereGeometry(1, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ color:0x030810, metalness:0.8, roughness:0.2 });
  globeMesh = new THREE.Mesh(geo, mat);
  scene.add(globeMesh);

  const wireMat = new THREE.MeshBasicMaterial({ color:0x4af0c8, wireframe:true, transparent:true, opacity:0.1 });
  wireMesh = new THREE.Mesh(geo, wireMat);
  scene.add(wireMesh);

  glowLight = new THREE.PointLight(0x4af0c8, 2);
  glowLight.position.set(5, 3, 5);
  scene.add(glowLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/* ════════════════════════════════════════════════════════════════
   BOOT (DEMOS REMOVED)
   ════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  initDB().then(() => {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
  });
  silentGeoDetect();
});

// Helper functions (addSignalDot, burstParticles, etc.) should remain as they were but target the new scene
// ... (omitted for brevity, keep your original implementation of these helper logic) ...

window.onMoodInput = function(val) {
    const mood = MOODS[val.toLowerCase()] || MOODS.neutral;
    document.documentElement.style.setProperty('--mood', mood.c);
};

function prepareAuraCard(word, mood, city, country) {
  document.getElementById('aura-word').textContent = word.toUpperCase();
  document.getElementById('aura-type').textContent = mood.t.toUpperCase();
  document.getElementById('aura-loc').textContent  = `${city}, ${country}`;
  document.getElementById('aura-date').textContent = new Date().toLocaleDateString();
}

function updateSignalCounter(n) {
  document.getElementById('signal-count').textContent = n.toLocaleString();
  document.getElementById('hint-count').textContent = n.toLocaleString();
}

function renderDistBars(counts, total) {
  const el = document.getElementById('dist-bars');
  el.innerHTML = '';
  Object.entries(counts).forEach(([type, n]) => {
    const pct = Math.round((n / total) * 100);
    const row = document.createElement('div');
    row.className = 'dist-row';
    row.innerHTML = `<span class="dist-label">${type}</span><div class="dist-track"><div class="dist-fill" style="width:${pct}%; --bc:${TYPE_COLOR[type]}"></div></div><span class="dist-pct">${pct}%</span>`;
    el.appendChild(row);
  });
}

function updateDominantMood(counts) {
    const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    if (top) document.getElementById('ws-dominant').textContent = top[0].toUpperCase();
}

function addTickerItem(signal) {
    const list = document.getElementById('ticker-list');
    const li = document.createElement('li');
    li.className = 'ticker-item';
    li.innerHTML = `<span class="ticker-word">${signal.word}</span> <span class="ticker-meta">${signal.city}</span>`;
    list.prepend(li);
}

})();
