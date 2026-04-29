(function () {
'use strict';

const SB_URL  = 'https://elffxqkhihilfmbnengx.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

const MOODS = {
  happy: { t:'joy', c:'#ffd166', e:'☀️' },
  joyful: { t:'joy', c:'#ffd166', e:'🌟' },
  calm: { t:'serenity', c:'#4af0c8', e:'🌿' },
  zen: { t:'serenity', c:'#2ec4b6', e:'☯️' },
  sad: { t:'sadness', c:'#4895ef', e:'🌊' },
  love: { t:'love', c:'#ff6b9d', e:'💗' },
  neutral: { t:'neutral', c:'#4af0c8', e:'◌' }
};

let db, scene, camera, renderer, controls, globeMesh, signalDots = [];
let audioCtx, masterGain, audioOn = false;
let userLat = 33.57, userLng = -117.73, userCity = 'Aliso Viejo', userCountry = 'USA';

// --- GEOLOCATION (CORS Fix) ---
async function silentGeoDetect() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error();
    const data = await res.json();
    userCity = data.city; userCountry = data.country_name;
    userLat = data.latitude; userLng = data.longitude;
  } catch (e) {
    console.warn("Using fallback location due to CORS/Rate Limit.");
  }
}

// --- AUDIO ENGINE (Fixed Global Exposure) ---
window.toggleAudio = function() {
  if (!audioOn) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    
    // Create a low ambient drone
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime);
    osc.connect(masterGain);
    osc.start();
    
    audioOn = true;
    document.getElementById('audio-icon-glyph').textContent = '◉';
  } else {
    audioCtx.close();
    audioOn = false;
    document.getElementById('audio-icon-glyph').textContent = '◎';
  }
};

// --- GLOBE (Google Earth Style) ---
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 3.5;

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.8;
  controls.maxDistance = 6;

  const loader = new THREE.TextureLoader();
  // Using high-quality open-source assets for the "Google Earth" look
  const dayTexture = loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  const bumpMap = loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');

  const globeGeo = new THREE.SphereGeometry(1, 64, 64);
  const globeMat = new THREE.MeshStandardMaterial({
    map: dayTexture,
    bumpMap: bumpMap,
    bumpScale: 0.05,
    metalness: 0.1,
    roughness: 0.8
  });
  
  globeMesh = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globeMesh);

  // Atmospheric Rim Glow
  const rimGeo = new THREE.SphereGeometry(1.01, 64, 64);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0x4af0c8, transparent: true, opacity: 0.1, side: THREE.BackSide });
  scene.add(new THREE.Mesh(rimGeo, rimMat));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 3, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040, 2));

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  signalDots = signalDots.filter(d => {
    d.life -= 0.005;
    d.mesh.material.opacity = d.life;
    if (d.life <= 0) { scene.remove(d.mesh); return false; }
    return true;
  });

  renderer.render(scene, camera);
}

// --- APP LOGIC ---
window.submitMood = async function() {
  const wordEl = document.getElementById('mood-input');
  const word = wordEl.value.trim();
  if (!word) return;

  const mood = MOODS[word.toLowerCase()] || MOODS.neutral;
  addSignalDot(userLat, userLng, mood.c);

  // Show Aura Card UI
  const card = document.getElementById('aura-card');
  document.getElementById('aura-word').textContent = word.toUpperCase();
  document.getElementById('aura-loc').textContent = `${userCity}, ${userCountry}`;
  card.classList.add('active');
  setTimeout(() => card.classList.remove('active'), 5000);

  if (db) await db.from('mood_signals').insert([{ word, mood_type: mood.t, city: userCity, country: userCountry }]);
  wordEl.value = '';
};

function addSignalDot(lat, lng, color) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const pos = new THREE.Vector3(
    -1.02 * Math.sin(phi) * Math.cos(theta),
    1.02 * Math.cos(phi),
    1.02 * Math.sin(phi) * Math.sin(theta)
  );
  
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
  );
  mesh.position.copy(pos);
  scene.add(mesh);
  signalDots.push({ mesh, life: 1.0 });
}

window.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  silentGeoDetect();
  db = supabase.createClient(SB_URL, SB_ANON);
  
  // Hide loader
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade-out');
    document.getElementById('app').classList.remove('hidden');
  }, 1000);
});

})();
