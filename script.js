'use strict';

const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// ── MOOD DATA ─────────────────────────────────────────────────
const MOODS = {
  joy:      { h: '#F7C948', g: 'rgba(247,201,72,0.5)',   note: 261.63, poetic: "Joy ripples outward like light on still water..." },
  love:     { h: '#FF6B8A', g: 'rgba(255,107,138,0.5)',  note: 293.66, poetic: "Hearts beating in quiet unison across the globe..." },
  hope:     { h: '#7EC8FF', g: 'rgba(126,200,255,0.5)',  note: 329.63, poetic: "A silver thread of hope weaves through the dark..." },
  calm:     { h: '#5DDCB8', g: 'rgba(93,220,184,0.5)',   note: 349.23, poetic: "The world holds its breath between heartbeats..." },
  sad:      { h: '#7B9FC4', g: 'rgba(123,159,196,0.5)',  note: 220.00, poetic: "Even grief is a kind of love for what once was..." },
  grateful: { h: '#68D480', g: 'rgba(104,212,128,0.5)',  note: 311.13, poetic: "Gratitude blooms in the smallest moments of light..." },
  angry:    { h: '#FF5733', g: 'rgba(255,87,51,0.5)',    note: 196.00, poetic: "Fire purifies. The storm always passes..." },
  fear:     { h: '#9B59B6', g: 'rgba(155,89,182,0.5)',   note: 174.61, poetic: "In the dark, even a single candle is enough..." }
};

// Keyword → mood mapping
const KEYWORD_MAP = {
  happy: 'joy', happiness: 'joy', joyful: 'joy', excited: 'joy', elated: 'joy', ecstatic: 'joy', bliss: 'joy', delight: 'joy',
  love: 'love', loved: 'love', romantic: 'love', adore: 'love', affection: 'love', heart: 'love', passion: 'love',
  hope: 'hope', hopeful: 'hope', optimistic: 'hope', future: 'hope', dream: 'hope', wish: 'hope', believe: 'hope',
  calm: 'calm', peace: 'calm', peaceful: 'calm', serene: 'calm', tranquil: 'calm', zen: 'calm', still: 'calm', quiet: 'calm', relax: 'calm',
  sad: 'sad', sadness: 'sad', grief: 'sad', sorrow: 'sad', lonely: 'sad', loneliness: 'sad', miss: 'sad', empty: 'sad', melancholy: 'sad',
  grateful: 'grateful', gratitude: 'grateful', thankful: 'grateful', blessed: 'grateful', appreciate: 'grateful',
  angry: 'angry', anger: 'angry', rage: 'angry', furious: 'angry', frustration: 'angry', frustrated: 'angry', mad: 'angry',
  fear: 'fear', afraid: 'fear', scared: 'fear', anxious: 'fear', anxiety: 'fear', worry: 'fear', nervous: 'fear', dread: 'fear'
};

function classifyMood(word) {
  const w = word.toLowerCase().trim();
  if (KEYWORD_MAP[w]) return KEYWORD_MAP[w];
  // Partial match
  for (const [key, mood] of Object.entries(KEYWORD_MAP)) {
    if (w.includes(key) || key.includes(w)) return mood;
  }
  // Fallback: deterministic but covers all moods
  const keys = Object.keys(MOODS);
  return keys[w.length % keys.length];
}

// ── STATE ─────────────────────────────────────────────────────
let userCity = "Global", userCountry = "Earth";
let actx, mGain, drones = [], audioOn = false, curMood = 'calm';
let globeScene, globeCamera, globeRenderer, globeMesh, glowMesh, starField;
let globeRotating = true;
let moodCounts = { joy: 12, love: 8, hope: 10, calm: 18, sad: 6, grateful: 9, angry: 4, fear: 5 };

// ── STARS CANVAS ──────────────────────────────────────────────
const cS = document.getElementById('c-stars');
const ctxS = cS.getContext('2d');
let stars = [];

function resizeStars() {
  cS.width = window.innerWidth;
  cS.height = window.innerHeight;
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * cS.width, y: Math.random() * cS.height, r: Math.random() * 1.2, a: Math.random() * 0.8 + 0.1, blink: Math.random() });
  }
}

function drawStars() {
  ctxS.clearRect(0, 0, cS.width, cS.height);
  const t = Date.now() / 1000;
  stars.forEach(s => {
    const alpha = s.a * (0.6 + 0.4 * Math.sin(t * s.blink * 2));
    ctxS.beginPath(); ctxS.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctxS.fillStyle = `rgba(255,255,255,${alpha})`; ctxS.fill();
  });
}

// ── GLOBE (THREE.JS) ──────────────────────────────────────────
function initGlobe() {
  const wrap = document.getElementById('globe-wrap');
  const W = window.innerWidth, H = window.innerHeight;

  globeScene = new THREE.Scene();
  globeCamera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  globeCamera.position.z = 2.8;

  globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  globeRenderer.setSize(W, H);
  globeRenderer.setPixelRatio(window.devicePixelRatio);
  globeRenderer.setClearColor(0x000000, 0);
  wrap.appendChild(globeRenderer.domElement);

  // Earth sphere
  const geo = new THREE.SphereGeometry(1, 64, 64);

  // Load texture from a reliable CDN
  const loader = new THREE.TextureLoader();
  const earthTex = loader.load(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    () => { globeRenderer.render(globeScene, globeCamera); },
    undefined,
    () => {
      // Fallback: procedural globe if texture fails
      makeFallbackGlobe();
    }
  );
  const bumpTex = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg');
  const specTex = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg');

  const mat = new THREE.MeshPhongMaterial({
    map: earthTex,
    bumpMap: bumpTex,
    bumpScale: 0.05,
    specularMap: specTex,
    specular: new THREE.Color(0x333333),
    shininess: 15
  });

  globeMesh = new THREE.Mesh(geo, mat);
  globeScene.add(globeMesh);

  // Atmosphere glow
  const glowGeo = new THREE.SphereGeometry(1.08, 64, 64);
  const glowMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(MOODS[curMood].h),
    transparent: true, opacity: 0.08, side: THREE.FrontSide
  });
  glowMesh = new THREE.Mesh(glowGeo, glowMat);
  globeScene.add(glowMesh);

  // Outer glow ring
  const outerGeo = new THREE.SphereGeometry(1.15, 64, 64);
  const outerMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(MOODS[curMood].h),
    transparent: true, opacity: 0.03, side: THREE.BackSide
  });
  globeScene.add(new THREE.Mesh(outerGeo, outerMat));

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  globeScene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 3, 5);
  globeScene.add(sun);
  const fill = new THREE.DirectionalLight(0x4488ff, 0.2);
  fill.position.set(-5, -2, -5);
  globeScene.add(fill);

  // Drag to rotate
  let isDragging = false, prevX = 0, prevY = 0, velX = 0, velY = 0;
  const dom = globeRenderer.domElement;
  dom.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; velX = 0; velY = 0; globeRotating = false; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    velX = (e.clientX - prevX) * 0.005;
    velY = (e.clientY - prevY) * 0.005;
    globeMesh.rotation.y += velX;
    globeMesh.rotation.x += velY;
    glowMesh.rotation.y += velX;
    glowMesh.rotation.x += velY;
    prevX = e.clientX; prevY = e.clientY;
  });
  window.addEventListener('mouseup', () => { isDragging = false; globeRotating = true; });

  // Touch support
  dom.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; globeRotating = false; });
  dom.addEventListener('touchmove', e => {
    if (!isDragging) return;
    velX = (e.touches[0].clientX - prevX) * 0.005;
    globeMesh.rotation.y += velX;
    glowMesh.rotation.y += velX;
    prevX = e.touches[0].clientX;
  });
  dom.addEventListener('touchend', () => { isDragging = false; globeRotating = true; });

  animateGlobe();
}

function makeFallbackGlobe() {
  if (!globeMesh) return;
  globeMesh.material = new THREE.MeshPhongMaterial({
    color: 0x0a2a4a, emissive: 0x001122, wireframe: false,
    specular: new THREE.Color(MOODS[curMood].h), shininess: 20
  });
  // Add wireframe overlay
  const wf = new THREE.Mesh(new THREE.SphereGeometry(1.001, 32, 32), new THREE.MeshBasicMaterial({ color: 0x5DDCB8, wireframe: true, transparent: true, opacity: 0.15 }));
  globeScene.add(wf);
}

function animateGlobe() {
  requestAnimationFrame(animateGlobe);
  if (globeRotating) {
    globeMesh.rotation.y += 0.0015;
    glowMesh.rotation.y += 0.0015;
  }
  // Pulse glow
  const pulse = 0.08 + 0.02 * Math.sin(Date.now() / 1000);
  if (glowMesh) glowMesh.material.opacity = pulse;
  globeRenderer.render(globeScene, globeCamera);
  drawStars();
}

function updateGlobeColor(mood) {
  if (!glowMesh) return;
  const col = new THREE.Color(MOODS[mood].h);
  glowMesh.material.color = col;
}

window.addEventListener('resize', () => {
  if (!globeRenderer) return;
  const W = window.innerWidth, H = window.innerHeight;
  globeCamera.aspect = W / H;
  globeCamera.updateProjectionMatrix();
  globeRenderer.setSize(W, H);
  resizeStars();
});

// ── AUDIO ─────────────────────────────────────────────────────
function initAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  mGain = actx.createGain(); mGain.gain.value = 0; mGain.connect(actx.destination);
}

function startDrone(mood) {
  if (!actx) return;
  drones.forEach(o => { try { o.stop(); } catch(e) {} });
  drones = [];
  const mc = MOODS[mood] || MOODS.calm;
  [1, 1.5, 2].forEach((mult, i) => {
    const osc = actx.createOscillator(); const g = actx.createGain();
    osc.frequency.value = mc.note * mult;
    osc.type = i === 0 ? 'sine' : 'triangle';
    g.gain.value = i === 0 ? 0.06 : 0.02;
    osc.connect(g); g.connect(mGain); osc.start(); drones.push(osc);
  });
}

window.toggleAudio = () => {
  if (!actx) initAudio();
  audioOn = !audioOn;
  if (audioOn) { actx.resume(); mGain.gain.setTargetAtTime(0.4, actx.currentTime, 2); startDrone(curMood); }
  else { mGain.gain.setTargetAtTime(0, actx.currentTime, 1); }
  document.getElementById('snd-btn').classList.toggle('on', audioOn);
  document.getElementById('snd-lbl').textContent = audioOn ? "Soundscape On" : "Enable Soundscape";
};

// ── MOOD SUBMIT ───────────────────────────────────────────────
window.submitMood = async () => {
  const inp = document.getElementById('mood-in');
  const word = inp.value.trim();
  if (!word) return;

  const mood = classifyMood(word);
  curMood = mood;
  const mc = MOODS[mood];

  // Update globe glow
  updateGlobeColor(mood);

  // Update UI
  const bigMood = document.getElementById('big-mood');
  bigMood.textContent = mood.toUpperCase();
  bigMood.style.color = mc.h;
  bigMood.style.textShadow = `0 0 60px ${mc.g}`;
  document.getElementById('poetic').textContent = mc.poetic;
  document.getElementById('mood-chip').textContent = mood.toUpperCase();
  document.getElementById('logo-mood').style.color = mc.h;
  document.getElementById('logo-mood').style.textShadow = `0 0 30px ${mc.g}`;

  // Update overlay
  document.getElementById('ov-word').textContent = `"${word}"`;
  document.getElementById('ov-mood').textContent = mood.toUpperCase();
  document.getElementById('ov-mood').style.color = mc.h;
  document.getElementById('ov-city').textContent = userCity;
  document.getElementById('overlay').classList.add('on');

  // Audio
  if (audioOn) startDrone(mood);

  // Update mood counts & bars
  moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  updateBars();
  addFeedItem(word, mood);

  inp.value = '';

  // Supabase insert
  try { await db.from('mood_signals').insert([{ word, mood_type: mood, city: userCity, country: userCountry }]); } catch(e) {}
};

// ── FEED ──────────────────────────────────────────────────────
function addFeedItem(word, mood) {
  const list = document.getElementById('feed-list'); if (!list) return;
  const mc = MOODS[mood];
  const fi = document.createElement('div'); fi.className = 'fi';
  fi.innerHTML = `<div class="fi-word" style="color:${mc.h}">${word.toUpperCase()}</div><div class="fi-meta">${mood} · ${userCity}</div>`;
  list.insertBefore(fi, list.firstChild);
  if (list.children.length > 5) list.removeChild(list.lastChild);
  document.getElementById('feed-cnt').textContent = parseInt(document.getElementById('feed-cnt').textContent) + 1;
}

// Simulate live global feed
function simulateFeed() {
  const moodKeys = Object.keys(MOODS);
  const sampleWords = ['peace','love','anxious','grateful','hopeful','lonely','joy','tired','alive','lost','found','broken','whole','free'];
  const m = moodKeys[Math.floor(Math.random() * moodKeys.length)];
  const w = sampleWords[Math.floor(Math.random() * sampleWords.length)];
  addFeedItem(w, m);
}

// ── BARS ──────────────────────────────────────────────────────
function updateBars() {
  const b = document.getElementById('bars'); if (!b) return;
  b.innerHTML = '';
  const total = Object.values(moodCounts).reduce((a, v) => a + v, 0);
  const sorted = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  sorted.forEach(([mood, count]) => {
    const pct = Math.round(count / total * 100);
    const mc = MOODS[mood];
    const row = document.createElement('div'); row.className = 'bar-row';
    row.innerHTML = `<div class="bar-label-row"><span style="color:${mc.h}">${mood.toUpperCase()}</span><span>${pct}%</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${mc.h}"></div></div>`;
    b.appendChild(row);
  });
}

// ── SHARE ─────────────────────────────────────────────────────
window.shareMood = () => {
  html2canvas(document.getElementById('capture-area'), { backgroundColor: '#020810' }).then(canvas => {
    const link = document.createElement('a');
    link.download = `GlobalMoodRing-${userCity}.png`;
    link.href = canvas.toDataURL(); link.click();
  });
};

window.closeOverlay = () => document.getElementById('overlay').classList.remove('on');

// ── BOOT ──────────────────────────────────────────────────────
async function boot() {
  resizeStars();
  initGlobe();
  updateBars();

  // Geo-locate user
  try {
    const loc = await fetch('https://ipapi.co/json/').then(r => r.json());
    userCity = loc.city || 'Global';
    userCountry = loc.country_name || 'Earth';
  } catch(e) {}

  // Loader out
  document.getElementById('ld-bar').style.width = '100%';
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade');
    setTimeout(() => document.getElementById('loader').style.display = 'none', 900);
  }, 800);

  // Live feed simulation
  setInterval(simulateFeed, 5000);
}

boot();
