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

// 1. GLOBE INITIALIZATION (Broad Compatibility)
function initGlobe() {
  const wrap = document.getElementById('globe-wrap');
  if(!wrap) return;

  globeScene = new THREE.Scene();
  globeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  globeCamera.position.z = 2.8;

  globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  globeRenderer.setSize(window.innerWidth, window.innerHeight);
  globeRenderer.setPixelRatio(window.devicePixelRatio);
  wrap.appendChild(globeRenderer.domElement);

  const geo = new THREE.SphereGeometry(1, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  
  // Use a reliable dark earth texture
  const earthTexture = textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    () => { console.log("Globe texture ready."); },
    undefined,
    () => { makeWireframeGlobe(); }
  );

  const mat = new THREE.MeshPhongMaterial({ map: earthTexture, shininess: 5 });
  globeMesh = new THREE.Mesh(geo, mat);
  globeScene.add(globeMesh);

  // Atmosphere glow
  const glowGeo = new THREE.SphereGeometry(1.05, 64, 64);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x5DDCB8, transparent: true, opacity: 0.1, side: THREE.BackSide });
  glowMesh = new THREE.Mesh(glowGeo, glowMat);
  globeScene.add(glowMesh);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  globeScene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(5, 3, 5);
  globeScene.add(sun);

  (function animate() {
    requestAnimationFrame(animate);
    if(globeMesh) globeMesh.rotation.y += 0.0015;
    if(glowMesh) glowMesh.rotation.y += 0.0015;
    globeRenderer.render(globeScene, globeCamera);
    drawStars();
  })();
}

function makeWireframeGlobe() {
    if(!globeMesh) return;
    globeMesh.material = new THREE.MeshPhongMaterial({ color: 0x112233, wireframe: true });
}

// 2. LOGIC & DATA
window.handleTyping = (val) => {
    const w = val.toLowerCase().trim();
    let detected = 'calm';
    if(w.includes('happy') || w.includes('joy')) detected = 'joy';
    if(w.includes('sad')) detected = 'sad';
    if(w.includes('love')) detected = 'love';
    document.getElementById('send-btn').style.background = MOODS[detected].h;
    if(glowMesh) glowMesh.material.color.set(MOODS[detected].h);
};

async function fetchStats() {
    const { data } = await db.from('mood_signals').select('mood_type');
    if (data) {
        const counts = { JOY: 0, CALM: 0, HOPE: 0 };
        data.forEach(r => { if(counts[r.mood_type.toUpperCase()] !== undefined) counts[r.mood_type.toUpperCase()]++; });
        const b = document.getElementById('bars'); 
        if(b) {
            b.innerHTML = '';
            Object.entries(counts).forEach(([m, c]) => {
                const row = document.createElement('div'); row.className = 'bar-row';
                row.innerHTML = `<div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:3px"><span>${m}</span><span>${c}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(c, 100)}%"></div></div>`;
                b.appendChild(row);
            });
        }
    }
}

// 3. STARS CANVAS
const cS = document.getElementById('c-stars');
const ctxS = cS.getContext('2d');
function resizeStars() {
    cS.width = window.innerWidth; cS.height = window.innerHeight;
    stars = [];
    for(let i=0; i<150; i++) stars.push({x: Math.random()*cS.width, y: Math.random()*cS.height, r: Math.random()*1.2, a: Math.random()});
}
function drawStars() {
    ctxS.clearRect(0, 0, cS.width, cS.height);
    stars.forEach(s => {
        ctxS.beginPath(); ctxS.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctxS.fillStyle = `rgba(255,255,255,${s.a})`; ctxS.fill();
    });
}

// 4. FAIL-SAFE BOOT
async function boot() {
  console.log("App booting...");
  resizeStars();

  // Force loader hide after max 2 seconds
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if(loader && loader.style.display !== 'none') {
        loader.classList.add('fade');
        setTimeout(() => loader.style.display = 'none', 900);
    }
  }, 2000);

  try { initGlobe(); } catch(e) { console.error("Globe failed:", e); }
  fetchStats().catch(() => {});

  fetch('https://ipapi.co/json/').then(r => r.json()).then(loc => {
    userCity = loc.city || 'Global';
  }).catch(() => {});
}

window.addEventListener('load', boot);
window.addEventListener('resize', () => {
    if(globeCamera) { globeCamera.aspect = window.innerWidth / window.innerHeight; globeCamera.updateProjectionMatrix(); }
    if(globeRenderer) globeRenderer.setSize(window.innerWidth, window.innerHeight);
    resizeStars();
});

window.submitMood = () => { document.getElementById('overlay').classList.add('on'); };
window.closeOverlay = () => { document.getElementById('overlay').classList.remove('on'); };
