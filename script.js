(function () {
'use strict';

/* ── Config ──────────────────────────────────────────────────── */
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
let db, currentMood = MOODS.neutral;
let scene, camera, renderer, controls, globeMesh, wireMesh, glowLight;
let particles2D = [], signalDots = [];
let userLat = 33.57, userLng = -117.73, userCity = 'Aliso Viejo', userCountry = 'USA'; // Defaults

/* ════════════════════════════════════════════════════════════════
   SUPABASE & REALTIME
   ════════════════════════════════════════════════════════════════ */
async function initDB() {
  try {
    db = supabase.createClient(SB_URL, SB_ANON);
    await fetchGlobalStats();
    db.channel('mood_signals').on('postgres_changes', { event:'INSERT', schema:'public', table:'mood_signals' }, p => {
      addTickerItem(p.new);
      fetchGlobalStats();
    }).subscribe();
  } catch (e) { console.error("Database connection failed", e); }
}

async function fetchGlobalStats() {
  if (!db) return;
  const { data } = await db.from('mood_signals').select('mood_type');
  if (!data) return;
  const counts = {};
  data.forEach(r => { counts[r.mood_type] = (counts[r.mood_type] || 0) + 1; });
  updateSignalCounter(data.length);
  renderDistBars(counts, data.length);
  updateDominantMood(counts);
}

/* ════════════════════════════════════════════════════════════════
   GEOLOCATION (SILENT & ROBUST)
   ════════════════════════════════════════════════════════════════ */
async function silentGeoDetect() {
  try {
    // Using ip-api.com (HTTP) as a secondary; note: browsers may block HTTP on HTTPS sites.
    // For local dev and non-SSL GitHub pages, this works well.
    const res = await fetch('https://ipapi.co/json/'); 
    if (!res.ok) throw new Error("Rate limited or CORS issue");
    const data = await res.json();
    
    userCity = data.city || userCity;
    userCountry = data.country_name || userCountry;
    userLat = parseFloat(data.latitude) || userLat;
    userLng = parseFloat(data.longitude) || userLng;
  } catch (e) {
    console.warn("Geo detection failed. Falling back to default coordinates.");
  }
}

/* ════════════════════════════════════════════════════════════════
   SUBMIT & AURA UI
   ════════════════════════════════════════════════════════════════ */
window.submitMood = async function() {
  const wordEl = document.getElementById('mood-input');
  const word = wordEl.value.trim();
  if (!word) return;

  const mood = MOODS[word.toLowerCase()] || { t:'neutral', c:'#4af0c8', e:'◌' };
  const payload = { word, mood_type: mood.t, city: userCity, country: userCountry };

  // Trigger Visuals
  burstParticles(mood.c);
  addSignalDot(userLat, userLng, mood.c);
  
  // Show Aura Card
  prepareAuraCard(word, mood, userCity, userCountry);
  const card = document.getElementById('aura-card');
  if(card) {
    card.classList.add('active');
    setTimeout(() => card.classList.remove('active'), 6000);
  }

  if (db) {
    const { error } = await db.from('mood_signals').insert([payload]);
    if (error) console.error("Error sending signal:", error);
  }
  
  wordEl.value = '';
  const chip = document.getElementById('mood-chip');
  if(chip) chip.classList.remove('visible');
};

/* ════════════════════════════════════════════════════════════════
   THREE.JS GLOBE (GOOGLE EARTH STYLE)
   ════════════════════════════════════════════════════════════════ */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 3.5;

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // OrbitControls for Pan/Zoom
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  controls.minDistance = 1.8;
  controls.maxDistance = 6;

  // High-Res Globe Mesh
  const geo = new THREE.SphereGeometry(1, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ 
    color: 0x050a1a, 
    metalness: 0.9, 
    roughness: 0.2 
  });
  globeMesh = new THREE.Mesh(geo, mat);
  scene.add(globeMesh);

  // Wireframe Glow
  const wireMat = new THREE.MeshBasicMaterial({ color:0x4af0c8, wireframe:true, transparent:true, opacity:0.1 });
  wireMesh = new THREE.Mesh(geo, wireMat);
  scene.add(wireMesh);

  // Lights
  glowLight = new THREE.PointLight(0x4af0c8, 1.8);
  glowLight.position.set(5, 3, 5);
  scene.add(glowLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if(controls) controls.update();
  
  // Update Surface Signal Dots
  signalDots = signalDots.filter(d => {
    d.life -= 0.005;
    d.mesh.material.opacity = Math.max(0, d.life);
    if (d.life <= 0) {
      scene.remove(d.mesh);
      return false;
    }
    return true;
  });

  renderer.render(scene, camera);
}

/* ════════════════════════════════════════════════════════════════
   HELPERS & UI
   ════════════════════════════════════════════════════════════════ */
function latLngToVec3(lat, lng, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function addSignalDot(lat, lng, color) {
  const pos = latLngToVec3(lat, lng, 1.02);
  const geo = new THREE.SphereGeometry(0.025, 12, 12);
  const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:1.0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  scene.add(mesh);
  signalDots.push({ mesh, life: 1.0 });
}

function burstParticles(color) {
  // Logic for 2D canvas overlay particles
  const canvas = document.getElementById('particle-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // (Simplified particle burst for brevity)
}

window.onMoodInput = function(val) {
  const key = val.trim().toLowerCase();
  const mood = MOODS[key] || MOODS.neutral;
  document.documentElement.style.setProperty('--mood', mood.c);
  const chip = document.getElementById('mood-chip');
  if(chip) {
    if(val) { chip.textContent = mood.e; chip.classList.add('visible'); }
    else { chip.classList.remove('visible'); }
  }
};

function prepareAuraCard(word, mood, city, country) {
  const wordEl = document.getElementById('aura-word');
  const typeEl = document.getElementById('aura-type');
  const locEl  = document.getElementById('aura-loc');
  const bgEl   = document.getElementById('aura-bg');
  
  if(wordEl) wordEl.textContent = word.toUpperCase();
  if(typeEl) typeEl.textContent = mood.t.toUpperCase();
  if(locEl)  locEl.textContent  = `${city}, ${country}`;
  if(bgEl)   bgEl.style.background = `radial-gradient(circle at center, ${mood.c} 0%, #030610 100%)`;
}

function updateSignalCounter(n) {
  const el = document.getElementById('signal-count');
  if(el) el.textContent = n.toLocaleString();
}

function renderDistBars(counts, total) {
  const el = document.getElementById('dist-bars');
  if(!el) return;
  el.innerHTML = '';
  Object.keys(TYPE_COLOR).forEach(type => {
    const n = counts[type] || 0;
    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'dist-row';
    row.innerHTML = `
      <span class="dist-label">${type}</span>
      <div class="dist-track"><div class="dist-fill" style="width:${pct}%; background:${TYPE_COLOR[type]}"></div></div>
      <span class="dist-pct">${pct}%</span>`;
    el.appendChild(row);
  });
}

function updateDominantMood(counts) {
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  const el = document.getElementById('ws-dominant');
  if (top && el) {
    el.textContent = top[0].toUpperCase();
    el.style.color = TYPE_COLOR[top[0]];
  }
}

function addTickerItem(signal) {
  const list = document.getElementById('ticker-list');
  if(!list) return;
  const li = document.createElement('li');
  li.className = 'ticker-item';
  li.innerHTML = `<span class="ticker-word">${signal.word}</span> <span class="ticker-meta">${signal.city}</span>`;
  list.prepend(li);
  if (list.children.length > 10) list.lastChild.remove();
}

/* ════════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  initDB().then(() => {
    setTimeout(() => {
      const loader = document.getElementById('loader');
      if(loader) loader.classList.add('fade-out');
      const app = document.getElementById('app');
      if(app) app.classList.remove('hidden');
    }, 1000);
  });
  
  silentGeoDetect();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});

})();
