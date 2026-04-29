'use strict';

// 1. CONNECTION - Replace with your actual Supabase keys
const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'sb_publishable_KcAegsmUshdHvwPJJoJMJg_fbOyAono';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. GLOBAL STATE
let userCity = "Global", userCountry = "Earth";
let W=0, H=0, DPR=window.devicePixelRatio||1;
let tx=0, ty=0, sc=1;
const SMIN=0.5, SMAX=22;
let dragging=false, dx=0, dy=0, dtx=0, dty=0, movedDist=0;
let selCid=null, selCity=null, curMood='calm', curRegion='all';
let geoFeatures=[];
let stars=[]; let cityT=0; let ripples=[];
let actx=null, mGain=null, verb=null, comp=null;
let drones=[]; let audioOn=false;

const M={
  joy: {h:'#F7C948',g:'rgba(247,201,72,0.4)', note:261.63,sc:[0,2,4,7,9]},
  love: {h:'#FF6B8A',g:'rgba(255,107,138,0.4)',note:293.66,sc:[0,3,5,7,10]},
  hope: {h:'#7EC8FF',g:'rgba(126,200,255,0.4)',note:329.63,sc:[0,2,5,7,9]},
  calm: {h:'#5DDCB8',g:'rgba(93,220,184,0.4)', note:349.23,sc:[0,2,4,7,11]},
  sad: {h:'#7B9FC4',g:'rgba(123,159,196,0.4)',note:220.00,sc:[0,2,3,7,8]},
  anxious: {h:'#E8A84A',g:'rgba(232,168,74,0.4)', note:246.94,sc:[0,1,4,6,10]},
  angry: {h:'#E85555',g:'rgba(232,85,85,0.4)', note:185.00,sc:[0,1,3,6,8]},
  numb: {h:'#8888A4',g:'rgba(136,136,164,0.4)',note:196.00,sc:[0,2,4,6,8]},
  excited: {h:'#B87FFF',g:'rgba(184,127,255,0.4)',note:392.00,sc:[0,2,4,6,9]},
  grateful:{h:'#68D480',g:'rgba(104,212,128,0.4)',note:311.13,sc:[0,2,4,7,9]},
};
const MK=Object.keys(M);

const CITIES=[
  {n:'Rome',lat:41.90,lon:12.50,cid:'ITA',mood:'love'},
  {n:'New York',lat:40.71,lon:-74.01,cid:'USA',mood:'excited'},
  {n:'Palermo',lat:38.12,lon:13.36,cid:'ITA',mood:'hope'},
  {n:'London',lat:51.51,lon:-.13,cid:'GBR',mood:'anxious'},
  {n:'Tokyo',lat:35.68,lon:139.69,cid:'JPN',mood:'calm'},
  {n:'Sydney',lat:-33.87,lon:151.21,cid:'AUS',mood:'joy'}
];

// 3. CANVAS & PROJECTION
const cS=document.getElementById('c-stars'), cM=document.getElementById('c-map'), cC=document.getElementById('c-cities'), cX=document.getElementById('c-fx');
const ctxS=cS.getContext('2d'), ctxM=cM.getContext('2d'), ctxC=cC.getContext('2d'), ctxX=cX.getContext('2d');
const BW=960, BH=500;

function proj(lon,lat){
  lat=Math.max(-85,Math.min(85,lat));
  const x=(lon+180)/360*BW*(W/BW)*sc+tx;
  const sinL=Math.sin(lat*Math.PI/180);
  const mercN=Math.log((1+sinL)/(1-sinL))/2;
  const y=(Math.PI-mercN)/(2*Math.PI)*BH*(H/BH)*sc+ty;
  return[x,y];
}

// 4. DRAWING & RESIZE
function resize(){
  W=window.innerWidth; H=window.innerHeight;
  [cS,cM,cC,cX].forEach(c=>{ c.width=W*DPR; c.height=H*DPR; c.style.width=W+'px'; c.style.height=H+'px'; });
  [ctxS,ctxM,ctxC,ctxX].forEach(ctx=>ctx.scale(DPR,DPR));
  mkStars(); drawMap();
}

function mkStars(){ stars=[]; for(let i=0;i<350;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*.9+.15,a:Math.random(),da:(Math.random()-.5)*.004}); }
function drawStars(){ ctxS.clearRect(0,0,W,H); stars.forEach(s=>{ s.a=Math.max(.04,Math.min(.95,s.a+s.da)); if(s.a<.05||s.a>.94)s.da*=-1; ctxS.beginPath(); ctxS.arc(s.x,s.y,s.r,0,Math.PI*2); ctxS.fillStyle=`rgba(185,205,255,${s.a*.55})`; ctxS.fill(); }); }

function drawMap(){
  ctxM.clearRect(0,0,W,H); ctxM.fillStyle='#030f22'; ctxM.fillRect(0,0,W,H);
  ctxM.strokeStyle='rgba(93,220,184,0.4)'; ctxM.lineWidth=1/sc;
  geoFeatures.forEach(feat=>{
    const coords = feat.geometry.coordinates;
    ctxM.beginPath();
    coords.forEach(polygon => {
        polygon.forEach(ring => {
            ring.forEach((p, i) => {
                const [x, y] = proj(p[0], p[1]);
                if(i===0) ctxM.moveTo(x, y); else ctxM.lineTo(x, y);
            });
        });
    });
    ctxM.stroke();
  });
}

function drawCities(){
  ctxC.clearRect(0,0,W,H);
  CITIES.forEach(city=>{
    const[px,py]=proj(city.lon,city.lat);
    const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 500);
    ctxC.beginPath(); ctxC.arc(px,py,4 * pulse,0,Math.PI*2); 
    ctxC.fillStyle='#5DDCB8'; ctxC.fill();
    ctxC.shadowBlur = 10; ctxC.shadowColor = '#5DDCB8';
  });
}

// 5. BUTTON LOGIC (FIXES THE RED ERRORS)
function setRegion(btn, r) {
    document.querySelectorAll('.reg').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    curRegion = r;
    // For now, let's just log it - we can add actual filtering later
    console.log("Region switched to:", r);
}

function resetView() {
    tx=0; ty=0; sc=1;
    resize();
}

async function submitMood() {
    const inp = document.getElementById('mood-in');
    const word = inp.value.trim(); if(!word) return;
    inp.value = '';
    document.getElementById('ov-mood').textContent = word.toUpperCase();
    document.getElementById('ov-ref').textContent = "Your pulse has been recorded.";
    document.getElementById('overlay').classList.add('on');
    // Database save
    try { await supabaseClient.from('mood_signals').insert([{ word, city: userCity, country: userCountry }]); } catch(e) {}
}

function closeOverlay() { document.getElementById('overlay').classList.remove('on'); }

// 6. BOOTSTRAP
async function boot(){
  window.addEventListener('resize', resize);
  // IP Detection
  try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      userCity = data.city; userCountry = data.country_name;
  } catch(e) {}
  
  // High-Quality Map Data
  const res = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson');
  const data = await res.json();
  geoFeatures = data.features;
  
  resize();
  document.getElementById('loader').classList.add('fade');
  setTimeout(()=>document.getElementById('loader').style.display='none', 950);
  
  requestAnimationFrame(function loop(){
    drawStars(); drawCities(); drawMap();
    requestAnimationFrame(loop);
  });
}

boot();
