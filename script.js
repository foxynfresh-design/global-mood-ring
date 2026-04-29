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
let feedCount=0;
let actx=null, mGain=null, verb=null, comp=null;
let drones=[]; let audioOn=false;

// 3. MOOD DEFINITIONS
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
const gS={}; MK.forEach(m=>gS[m]=0);

const FB={
  joy:'The light you carry turns every room into a sunrise.',
  love:'To love is to agree to be undone, again and again.',
  hope:'Hope is a decision made in the dark before dawn.',
  calm:'There is a frequency the world cannot reach when you are still.',
  sad:'Grief is just love with nowhere left to go.',
  anxious:'Every storm has a center, and you are in it.',
  angry:'Something in you still believes it matters.',
  numb:'Numbness is the body saying it has held too much.',
  excited:'You are vibrating at a frequency the world has not calibrated for yet.',
  grateful:'Gratitude is the only prayer that already contains its answer.'
};

// 4. MAP DATA (ISO Codes)
const ISO={4:'AFG',8:'ALB',12:'DZA',32:'ARG',36:'AUS',40:'AUT',76:'BRA',124:'CAN',156:'CHN',250:'FRA',276:'DEU',300:'GRC',356:'IND',380:'ITA',392:'JPN',484:'MEX',528:'NLD',566:'NGA',578:'NOR',616:'POL',620:'PRT',643:'RUS',682:'SAU',710:'ZAF',724:'ESP',752:'SWE',804:'UKR',826:'GBR',840:'USA'};

const CITIES=[
  {n:'Rome',lat:41.90,lon:12.50,cid:'ITA',mood:'love',kw:'amore · piazza',pulse:'The eternal city breathes in burgundy.'},
  {n:'New York',lat:40.71,lon:-74.01,cid:'USA',mood:'excited',kw:'hustle · scale',pulse:'New York never exhales.'},
  {n:'Palermo',lat:38.12,lon:13.36,cid:'ITA',mood:'hope',kw:'mare · storia',pulse:'Palermo reaches toward the sun.'},
  {n:'London',lat:51.51,lon:-.13,cid:'GBR',mood:'anxious',kw:'fog · grey',pulse:'London speaks in understatement.'},
  {n:'Tokyo',lat:35.68,lon:139.69,cid:'JPN',mood:'calm',kw:'美 · 礼儀',pulse:'Tokyo breathes in perfect intervals.'}
];

// 5. CANVAS & PROJECTION
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

function unproj(px,py){
  const rx=(px-tx)/(sc*(W/BW)), ry=(py-ty)/(sc*(H/BH));
  const lon=rx/BW*360-180;
  const mercN=Math.PI-ry/BH*2*Math.PI;
  const lat=Math.atan(Math.sinh(mercN))*180/Math.PI;
  return[lon,lat];
}

// 6. DRAWING LOGIC
function resize(){
  W=window.innerWidth; H=window.innerHeight;
  [cS,cM,cC,cX].forEach(c=>{ c.width=W*DPR; c.height=H*DPR; c.style.width=W+'px'; c.style.height=H+'px'; });
  [ctxS,ctxM,ctxC,ctxX].forEach(ctx=>ctx.scale(DPR,DPR));
  mkStars(); if(geoFeatures.length) drawMap();
}

function mkStars(){ stars=[]; for(let i=0;i<350;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*.9+.15,a:Math.random(),da:(Math.random()-.5)*.004}); }
function drawStars(){ ctxS.clearRect(0,0,W,H); stars.forEach(s=>{ s.a=Math.max(.04,Math.min(.95,s.a+s.da)); if(s.a<.05||s.a>.94)s.da*=-1; ctxS.beginPath(); ctxS.arc(s.x,s.y,s.r,0,Math.PI*2); ctxS.fillStyle=`rgba(185,205,255,${s.a*.55})`; ctxS.fill(); }); }

function drawMap(){
  ctxM.clearRect(0,0,W,H); ctxM.fillStyle='#030f22'; ctxM.fillRect(0,0,W,H);
  geoFeatures.forEach(feat=>{
    ctxM.beginPath(); ctxM.fillStyle='rgba(93,220,184,0.15)'; ctxM.strokeStyle='#5DDCB8'; ctxM.lineWidth=0.5/sc;
    const geo=feat.geometry; if(!geo)return;
    const polys=geo.type==='MultiPolygon'?geo.coordinates:geo.type==='Polygon'?[geo.coordinates]:[];
    polys.forEach(poly=>poly.forEach(ring=>{
      ring.forEach((p,i)=> i===0?ctxM.moveTo(...proj(p[0],p[1])):ctxM.lineTo(...proj(p[0],p[1])));
    }));
    ctxM.fill(); ctxM.stroke();
  });
}

function drawCities(){
  ctxC.clearRect(0,0,W,H);
  CITIES.forEach(city=>{
    const[px,py]=proj(city.lon,city.lat);
    ctxC.beginPath(); ctxC.arc(px,py,4,0,Math.PI*2); ctxC.fillStyle='#5DDCB8'; ctxC.fill();
  });
}

// 7. VIRAL FEATURES
async function autoDetectLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userCity = data.city || "Global"; userCountry = data.country_name || "Earth";
    } catch (e) { console.warn("Location detection failed."); }
}

async function submitMood() {
    const inp = document.getElementById('mood-in');
    const word = inp.value.trim(); if (!word) return;
    const finalLoc = selCity ? selCity.n : userCity;
    inp.value = '';
    const mood = word.length % 2 === 0 ? 'joy' : 'calm'; // Simple placeholder logic
    try { await supabaseClient.from('mood_signals').insert([{ word: word, mood_type: mood, city: finalLoc, country: userCountry }]); } catch (e) {}
    document.getElementById('ov-mood').textContent = word.toUpperCase();
    document.getElementById('overlay').classList.add('on');
}

function closeOverlay(){ document.getElementById('overlay').classList.remove('on'); }
function resetView(){ tx=0; ty=0; sc=1; resize(); }

// 8. BOOTSTRAP
async function boot(){
  window.addEventListener('resize', resize); resize();
  await autoDetectLocation();
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  const topo = await res.json();
  // Simplified TopoJSON to GeoJSON
  geoFeatures = topo.objects.countries.geometries.map(g=>{
    return { geometry: { type: 'Polygon', coordinates: [topo.arcs[g.arcs[0][0]]] } }; // Ultra-simplified for demo
  });
  document.getElementById('loader').classList.add('fade');
  setTimeout(()=>document.getElementById('loader').style.display='none', 950);
  requestAnimationFrame(function loop(){ drawStars(); drawCities(); requestAnimationFrame(loop); });
}

boot();
