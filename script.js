'use strict';

const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';
const db = supabase.createClient(supabaseUrl, supabaseKey);

let userCity = "Global", userCountry = "Earth";
let scene, camera, renderer, globe, glow;
let actx, mGain, drones = [], audioOn = false, curMood = 'calm';

const MOODS = {
  joy: { h: '#F7C948', note: 261.63 },
  love: { h: '#FF6B8A', note: 293.66 },
  hope: { h: '#7EC8FF', note: 329.63 },
  calm: { h: '#5DDCB8', note: 349.23 },
  sad: { h: '#7B9FC4', note: 220.00 }
};

// 1. GLOBE INITIALIZATION
function initGlobe() {
  const wrap = document.getElementById('globe-wrap');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 3;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  wrap.appendChild(renderer.domElement);

  // AESTHETIC: Glow-Grid Globe (No external textures needed)
  const geo = new THREE.SphereGeometry(1, 48, 48);
  const mat = new THREE.MeshPhongMaterial({ 
    color: 0x5DDCB8, 
    emissive: 0x112233, 
    wireframe: true, 
    transparent: true, 
    opacity: 0.2 
  });
  globe = new THREE.Mesh(geo, mat);
  scene.add(globe);

  // Aura Glow
  const glowGeo = new THREE.SphereGeometry(1.1, 48, 48);
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0x5DDCB8, 
    transparent: true, 
    opacity: 0.05, 
    side: THREE.BackSide 
  });
  glow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glow);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  (function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.001;
    renderer.render(scene, camera);
  })();
}

// 2. AUDIO (Fixed for browser security)
function initAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  mGain = actx.createGain(); 
  mGain.gain.value = 0; 
  mGain.connect(actx.destination);
}

window.toggleAudio = () => {
  initAudio();
  audioOn = !audioOn;
  if (audioOn) {
    actx.resume();
    mGain.gain.setTargetAtTime(0.5, actx.currentTime, 1);
  } else {
    mGain.gain.setTargetAtTime(0, actx.currentTime, 1);
  }
  document.getElementById('snd-btn').classList.toggle('on', audioOn);
};

// 3. UI LOGIC
window.handleTyping = (val) => {
  const w = val.toLowerCase();
  let mood = 'calm';
  if (w.includes('happy')) mood = 'joy';
  if (w.includes('sad')) mood = 'sad';
  
  const col = new THREE.Color(MOODS[mood].h);
  globe.material.color = col;
  glow.material.color = col;
};

window.submitMood = () => {
  document.getElementById('overlay').classList.add('on');
};

window.closeOverlay = () => {
  document.getElementById('overlay').classList.remove('on');
};

// 4. BOOT
function boot() {
  console.log("App booting...");
  initGlobe();
  
  // Force loader hide
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade');
    setTimeout(() => document.getElementById('loader').style.display = 'none', 900);
  }, 1000);
}

window.addEventListener('load', boot);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
