'use strict';

const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'sb_publishable_KcAegsmUshdHvwPJJoJMJg_fbOyAono';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let userCity = "Global", userCountry = "Earth";
let W, H, DPR = window.devicePixelRatio || 1;
let tx = 0, ty = 0, sc = 1;
let dragging = false, dx, dy, dtx, dty;
let geoFeatures = [];
let stars = [];
let actx, mGain, drones = [], audioOn = false, curMood = 'calm';
let mX = 0, mY = 0;
let currentRegion = 'all';

const M = {
  joy:      { h: '#F7C948', g: 'rgba(247,201,72,0.4)',   note: 261.63, poetic: "Joy ripples outward, touching every shore..." },
  love:     { h: '#FF6B8A', g: 'rgba(255,107,138,0.4)',  note: 293.66, poetic: "Hearts beating in quiet unison across the globe..." },
  hope:     { h: '#7EC8FF', g: 'rgba(126,200,255,0.4)',  note: 329.63, poetic: "A silver thread of hope weaves through the dark..." },
  calm:     { h: '#5DDCB8', g: 'rgba(93,220,184,0.4)',   note: 349.23, poetic: "The world holds its breath between heartbeats..." },
  sad:      { h: '#7B9FC4', g: 'rgba(123,159,196,0.4)',  note: 220.00, poetic: "Grief shared is grief halved, across every ocean..." },
  grateful: { h: '#68D480', g: 'rgba(104,212,128,0.4)',  note: 311.13, poetic: "Gratitude blooms in the smallest moments of light..." }
};

const regionViews = {
  all: { tx: 0,    ty: 0,   sc: 1   },
  eu:  { tx: -300, ty: -80, sc: 3   },
  it:  { tx: -500, ty: -200,sc: 6   }
};

const cS = document.getElementById('c-stars');
const cM = document.getElementById('c-map');
const cC = document.getElementById('c-cities');
const ctxS = cS.getContext('2d');
const ctxM = cM.getContext('2d');
const ctxC = cC.getContext('2d');
const BW = 960, BH = 500;

function proj(lon, lat) {
  lat = Math.max(-85, Math.min(85, lat));
  const x = (lon + 180) / 360 * BW * (W / BW) * sc + tx;
  const sinL = Math.sin(lat * Math.PI / 180);
  const mercN = Math.log((1 + sinL) / (1 - sinL)) / 2;
  const y = (Math.PI - mercN) / (2 * Math.PI) * BH * (H / BH) * sc + ty;
  return [x, y];
}

// AUDIO ENGINE
function initAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  mGain = actx.createGain(); mGain.gain.value = 0; mGain.connect(actx.destination);
}

function startDrone(mood) {
  if (!actx) return;
  drones.forEach(o => { try { o.stop(); } catch(e) {} });
  drones = [];
  const mc = M[mood] || M.calm;
  [1, 0.5, 0.75].forEach(mult => {
    const osc = actx.createOscillator(); const g = actx.createGain();
    osc.frequency.value = mc.note * mult; osc.type = 'sine'; g.gain.value = 0.04;
    osc.connect(g); g.connect(mGain); osc.start(); drones.push(osc);
  });
}

window.toggleAudio = () => {
  if (!actx) initAudio();
  audioOn = !audioOn;
  if (audioOn) { actx.resume(); mGain.gain.setTargetAtTime(0.5, actx.currentTime, 2); startDrone(curMood); }
  else { mGain.gain.setTargetAtTime(0, actx.currentTime, 1); }
  document.getElementById('snd-btn').classList.toggle('on', audioOn);
  document.getElementById('snd-lbl').textContent = audioOn ? "Soundscape On" : "Enable Soundscape";
};

// REGION FILTER
window.setRegion = (el, region) => {
  currentRegion = region;
  document.querySelectorAll('.reg').forEach(r => r.classList.remove('on'));
  el.classList.add('on');
  const v = regionViews[region] || regionViews.all;
  tx = v.tx; ty = v.ty; sc = v.sc;
  document.getElementById('zoom-chip').textContent = sc.toFixed(1) + '×';
  drawAll();
};

// UI & DATABASE
window.submitMood = async () => {
  const inp = document.getElementById('mood-in');
  const word = inp.value.trim();
  if (!word) return;
  const moodKeys = Object.keys(M);
  const mood = moodKeys[word.length % moodKeys.length];
  curMood = mood;
  if (audioOn) startDrone(mood);
  document.getElementById('big-mood').textContent = mood.toUpperCase();
  document.getElementById('big-mood').style.color = M[mood].h;
  document.getElementById('poetic').textContent = M[mood].poetic;
  document.getElementById('ov-mood').textContent = mood.toUpperCase();
  document.getElementById('ov-mood').style.color = M[mood].h;
  document.getElementById('overlay').classList.add('on');
  try { await supabaseClient.from('mood_signals').insert([{ word, mood_type: mood, city: userCity, country: userCountry }]); } catch(e) {}
  inp.value = '';
  updateBars();
};

window.shareMood = () => {
  html2canvas(document.getElementById('capture-area')).then(canvas => {
    const link = document.createElement('a');
    link.download = `Aura-${userCity}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
};

function addFeed() {
  const list = document.getElementById('feed-list'); if (!list) return;
  const moods = Object.keys(M); const m = moods[Math.floor(Math.random() * moods.length)];
  const fi = document.createElement('div'); fi.className = 'fi';
  fi.innerHTML = `<div style="font-family:'Bebas Neue'; font-size:14px; color:${M[m].h}">${m.toUpperCase()}</div><div style="font-size:8px; opacity:0.5">${userCity}</div>`;
  list.insertBefore(fi, list.firstChild);
  if (list.children.length > 4) list.removeChild(list.lastChild);
  document.getElementById('feed-cnt').textContent = parseInt(document.getElementById('feed-cnt').textContent) + 1;
}

function updateBars() {
  const b = document.getElementById('bars'); if (!b) return; b.innerHTML = '';
  [{ l: 'CALM', p: 45 }, { l: 'JOY', p: 30 }, { l: 'HOPE', p: 25 }].forEach(s => {
    const r = document.createElement('div'); r.style.marginBottom = "8px";
    r.innerHTML = `<div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:3px"><span>${s.l}</span><span>${s.p}%</span></div><div style="height:1px; background:rgba(255,255,255,0.1); width:100%"><div style="height:100%; background:var(--mc); width:${s.p}%"></div></div>`;
    b.appendChild(r);
  });
}

// MAP & INTERACTION
window.zoomBy = (f) => {
  sc = Math.max(0.5, Math.min(20, sc * f));
  document.getElementById('zoom-chip').textContent = sc.toFixed(1) + '×';
  drawAll();
};
window.resetView = () => { tx = 0; ty = 0; sc = 1; document.getElementById('zoom-chip').textContent = '1.0×'; drawAll(); };
window.closeOverlay = () => document.getElementById('overlay').classList.remove('on');
window.addEventListener('mousemove', e => { mX = e.clientX; mY = e.clientY; });

cM.addEventListener('mousedown', e => { dragging = true; dx = e.clientX; dy = e.clientY; dtx = tx; dty = ty; });
window.addEventListener('mousemove', e => { if (dragging) { tx = dtx + (e.clientX - dx); ty = dty + (e.clientY - dy); drawAll(); } });
window.addEventListener('mouseup', () => dragging = false);

// SCROLL TO ZOOM
cM.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  sc = Math.max(0.5, Math.min(20, sc * factor));
  document.getElementById('zoom-chip').textContent = sc.toFixed(1) + '×';
  drawAll();
}, { passive: false });

function resize() {
  W = window.innerWidth; H = window.innerHeight;
  [cS, cM, cC].forEach(c => {
    if (!c) return;
    c.width = W * DPR; c.height = H * DPR;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(DPR, DPR);
  });
  mkStars(); drawAll();
}

function mkStars() { stars = []; for (let i = 0; i < 100; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random(), a: Math.random() }); }
function drawStars() { ctxS.clearRect(0, 0, W, H); stars.forEach(s => { ctxS.beginPath(); ctxS.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctxS.fillStyle = `rgba(255,255,255,${s.a})`; ctxS.fill(); }); }

function drawAll() {
  drawMap(); ctxC.clearRect(0, 0, W, H);
  const marsala = { n: 'Marsala', lat: 37.80, lon: 12.44 };
  const [px, py] = proj(marsala.lon, marsala.lat);
  ctxC.beginPath(); ctxC.arc(px, py, 5, 0, Math.PI * 2); ctxC.fillStyle = 'gold'; ctxC.fill();
  const d = Math.hypot(px - mX, py - mY);
  const tip = document.getElementById('tip');
  if (d < 10) {
    tip.style.left = (mX + 15) + 'px'; tip.style.top = (mY + 15) + 'px'; tip.style.opacity = 1;
    document.getElementById('tip-name').textContent = "MARSALA";
    document.getElementById('tip-pulse').textContent = "Stagnone Heartbeat.";
  } else { tip.style.opacity = 0; }
}

function drawMap() {
  if (!geoFeatures.length) return;
  ctxM.clearRect(0, 0, W, H);
  ctxM.strokeStyle = 'rgba(93,220,184,0.3)'; ctxM.lineWidth = 1 / sc;
  geoFeatures.forEach(feat => {
    const dp = (rings) => { rings.forEach(ring => { ctxM.beginPath(); ring.forEach((p, i) => { const [x, y] = proj(p[0], p[1]); if (i === 0) ctxM.moveTo(x, y); else ctxM.lineTo(x, y); }); ctxM.stroke(); }); };
    if (feat.geometry.type === 'Polygon') dp(feat.geometry.coordinates);
    else if (feat.geometry.type === 'MultiPolygon') feat.geometry.coordinates.forEach(dp);
  });
}

async function boot() {
  window.addEventListener('resize', resize); resize();
  try { const loc = await fetch('https://ipapi.co/json/').then(r => r.json()); userCity = loc.city; userCountry = loc.country_name; } catch(e) {}
  try { const res = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson'); geoFeatures = (await res.json()).features; drawAll(); } catch(e) {}
  updateBars();
  document.getElementById('ld-bar').style.width = '100%';
  setTimeout(() => { document.getElementById('loader').classList.add('fade'); setTimeout(() => document.getElementById('loader').style.display = 'none', 950); }, 500);
  setInterval(drawStars, 150); setInterval(addFeed, 4000); setInterval(drawAll, 50);
}
boot();
