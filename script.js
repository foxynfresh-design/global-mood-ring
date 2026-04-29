'use strict';

const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';
const db = supabase.createClient(supabaseUrl, supabaseKey);

let userCity = "Global", userCountry = "Earth";
let globeScene, globeCamera, globeRenderer, globeMesh, glowMesh;
let actx, mGain, drones = [], audioOn = false, curMood = 'calm';
let stars = [];

const MOODS = {
  joy: { h: '#F7C948', note: 261.63, poetic: "Joy ripples outward like light..." },
  love: { h: '#FF6B8A', note: 293.66, poetic: "Hearts beating in unison..." },
  hope: { h: '#7EC8FF', note: 329.63, poetic: "A silver thread of hope..." },
  calm: { h: '#5DDCB8', note: 349.23, poetic: "The world holds its breath..." },
  sad: { h: '#7B9FC4', note: 220.00, poetic: "Even grief is a kind of love..." }
};

// GLOBE LOGIC
function initGlobe() {
  const wrap = document.getElementById('globe-wrap');
  globeScene = new THREE.Scene();
  globeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  globeCamera.position.z = 3;
  globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  globeRenderer.setSize(window.innerWidth, window.innerHeight);
  wrap.appendChild(globeRenderer.domElement);

  const geo = new THREE.SphereGeometry(1, 64, 64);
  const mat = new THREE.MeshPhongMaterial({ color: 0x112233, wireframe: true });
  globeMesh = new THREE.Mesh(geo, mat);
  globeScene.add(globeMesh);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  globeScene.add(ambient);

  (function animate() {
    requestAnimationFrame(animate);
    globeMesh.rotation.y += 0.002;
    globeRenderer.render(globeScene, globeCamera);
  })();
}

// REAL-TIME TYPING FEEDBACK
window.handleTyping = (val) => {
    const w = val.toLowerCase();
    let detected = 'calm';
    if(w.includes('happy') || w.includes('joy')) detected = 'joy';
    if(w.includes('sad')) detected = 'sad';
    document.getElementById('send-btn').style.background = MOODS[detected].h;
};

// DATABASE SYNC
async function fetchStats() {
    const { data } = await db.from('mood_signals').select('mood_type');
    if (data) {
        const counts = { JOY: 0, CALM: 0, HOPE: 0 };
        data.forEach(r => { if(counts[r.mood_type.toUpperCase()] !== undefined) counts[r.mood_type.toUpperCase()]++; });
        const b = document.getElementById('bars'); b.innerHTML = '';
        Object.entries(counts).forEach(([m, c]) => {
            const row = document.createElement('div'); row.className = 'bar-row';
            row.innerHTML = `<div style="display:flex; justify-content:space-between; font-size:9px"><span>${m}</span><span>${c}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(c, 100)}%"></div></div>`;
            b.appendChild(row);
        });
    }
}

// BOOT (FAIL-SAFE)
async function boot() {
  console.log("Boot sequence started...");
  
  // 1. Hide loader after 1.5s no matter what
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade');
    setTimeout(() => document.getElementById('loader').style.display = 'none', 900);
  }, 1500);

  try { initGlobe(); } catch(e) { console.error("Globe init failed"); }
  fetchStats().catch(() => {});

  // Get Location
  fetch('https://ipapi.co/json/').then(r => r.json()).then(loc => {
    userCity = loc.city || 'Global';
  }).catch(() => {});
}

window.addEventListener('load', boot);
window.submitMood = () => { document.getElementById('overlay').classList.add('on'); };
window.closeOverlay = () => { document.getElementById('overlay').classList.remove('on'); };
