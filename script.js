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

/* ── Audio Engine ── */
window.toggleAudio = function() {
  if (!audioOn) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }
    audioCtx.resume();
    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(110, audioCtx.currentTime);
    const lg = audioCtx.createGain(); lg.gain.value = 0.05;
    osc.connect(lg); lg.connect(masterGain);
    osc.start(); window.activeOsc = osc;
    audioOn = true;
    document.getElementById('audio-icon-glyph').textContent = '◉';
  } else {
    if (window.activeOsc) window.activeOsc.stop();
    audioOn = false;
    document.getElementById('audio-icon-glyph').textContent = '◎';
  }
};

/* ── High-Res Globe ── */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 4;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;

  const loader = new THREE.TextureLoader();
  const dayTex = loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  const bumpTex = loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');

  const globeGeo = new THREE.SphereGeometry(1, 128, 128); 
  const globeMat = new THREE.MeshStandardMaterial({ map: dayTex, bumpMap: bumpTex, bumpScale: 0.05, roughness: 0.8 });
  globeMesh = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globeMesh);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 3, 5);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x404040, 1.5));

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/* ── UX Handlers ── */
window.submitMood = async function() {
  const word = document.getElementById('mood-input').value.trim();
  if (!word) return;

  document.getElementById('aura-word').textContent = word.toUpperCase();
  document.getElementById('aura-loc').textContent = `${userCity}, ${userCountry}`;
  document.getElementById('aura-overlay').classList.remove('hidden');

  if (db) await db.from('mood_signals').insert([{ word, city: userCity, country: userCountry }]);
  document.getElementById('mood-input').value = '';
};

window.closeAura = function() { document.getElementById('aura-overlay').classList.add('hidden'); };

window.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
    userCity = d.city || userCity; userLat = d.latitude || userLat; userLng = d.longitude || userLng;
  }).finally(() => {
    setTimeout(() => {
      document.getElementById('loader').classList.add('fade-out');
      document.getElementById('app').classList.remove('hidden');
    }, 1000);
  });
});

})();
