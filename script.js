'use strict';

// ─────────────────────────────────────────────────
// SUPABASE  (replace keys if needed)
// ─────────────────────────────────────────────────
const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'sb_publishable_KcAegsmUshdHvwPJJoJMJg_fbOyAono';
let sb = null;
try { sb = supabase.createClient(supabaseUrl, supabaseKey); } catch(e) {}

// ─────────────────────────────────────────────────
// MOOD SYSTEM  (10 moods)
// ─────────────────────────────────────────────────
const M = {
  joy:      { h:'#F7C948', g:'rgba(247,201,72,0.4)',  note:261.63, sc:[0,2,4,7,9]  },
  love:     { h:'#FF6B8A', g:'rgba(255,107,138,0.4)', note:293.66, sc:[0,3,5,7,10] },
  hope:     { h:'#7EC8FF', g:'rgba(126,200,255,0.4)', note:329.63, sc:[0,2,5,7,9]  },
  calm:     { h:'#5DDCB8', g:'rgba(93,220,184,0.4)',  note:349.23, sc:[0,2,4,7,11] },
  sad:      { h:'#7B9FC4', g:'rgba(123,159,196,0.4)', note:220.00, sc:[0,2,3,7,8]  },
  anxious:  { h:'#E8A84A', g:'rgba(232,168,74,0.4)',  note:246.94, sc:[0,1,4,6,10] },
  angry:    { h:'#E85555', g:'rgba(232,85,85,0.4)',   note:185.00, sc:[0,1,3,6,8]  },
  numb:     { h:'#8888A4', g:'rgba(136,136,164,0.4)', note:196.00, sc:[0,2,4,6,8]  },
  excited:  { h:'#B87FFF', g:'rgba(184,127,255,0.4)', note:392.00, sc:[0,2,4,6,9]  },
  grateful: { h:'#68D480', g:'rgba(104,212,128,0.4)', note:311.13, sc:[0,2,4,7,9]  },
};
const MK = Object.keys(M);

// ─────────────────────────────────────────────────
// COUNTRY DATA
// ─────────────────────────────────────────────────
const CD = {
  ITA:{ name:'Italy',        r:'eu', mood:'love',    s:{love:.72,calm:.48,joy:.61,hope:.55,sad:.22,anxious:.31,angry:.18,numb:.12,excited:.44,grateful:.58} },
  FRA:{ name:'France',       r:'eu', mood:'joy',     s:{joy:.68,love:.55,calm:.52,hope:.48,sad:.25,anxious:.38,angry:.22,numb:.14,excited:.41,grateful:.45} },
  DEU:{ name:'Germany',      r:'eu', mood:'calm',    s:{calm:.70,hope:.58,joy:.42,love:.38,sad:.28,anxious:.42,angry:.26,numb:.20,excited:.35,grateful:.40} },
  ESP:{ name:'Spain',        r:'eu', mood:'joy',     s:{joy:.75,love:.65,excited:.55,calm:.42,hope:.50,sad:.20,anxious:.28,angry:.18,numb:.10,grateful:.52} },
  GBR:{ name:'UK',           r:'eu', mood:'anxious', s:{anxious:.58,calm:.45,sad:.38,hope:.42,joy:.35,love:.32,angry:.28,numb:.25,excited:.30,grateful:.28} },
  RUS:{ name:'Russia',       r:'eu', mood:'numb',    s:{numb:.55,sad:.48,anxious:.42,angry:.38,calm:.28,hope:.20,joy:.15,love:.12,excited:.18,grateful:.10} },
  POL:{ name:'Poland',       r:'eu', mood:'hope',    s:{hope:.58,calm:.48,joy:.42,love:.38,anxious:.35,sad:.30,angry:.22,numb:.18,excited:.32,grateful:.40} },
  SWE:{ name:'Sweden',       r:'eu', mood:'calm',    s:{calm:.70,hope:.60,grateful:.55,joy:.48,love:.45,numb:.28,sad:.25,anxious:.22,angry:.15,excited:.35} },
  NOR:{ name:'Norway',       r:'eu', mood:'grateful',s:{grateful:.68,calm:.65,hope:.58,joy:.52,love:.48,numb:.20,sad:.22,anxious:.18,angry:.12,excited:.38} },
  UKR:{ name:'Ukraine',      r:'eu', mood:'sad',     s:{sad:.65,angry:.55,hope:.50,anxious:.48,numb:.40,love:.35,calm:.25,joy:.20,excited:.18,grateful:.28} },
  GRC:{ name:'Greece',       r:'eu', mood:'sad',     s:{sad:.52,hope:.48,love:.50,joy:.42,calm:.35,anxious:.40,angry:.32,numb:.28,excited:.25,grateful:.38} },
  PRT:{ name:'Portugal',     r:'eu', mood:'calm',    s:{calm:.65,joy:.60,love:.58,hope:.52,grateful:.55,sad:.28,anxious:.25,angry:.15,numb:.12,excited:.42} },
  NLD:{ name:'Netherlands',  r:'eu', mood:'calm',    s:{calm:.62,hope:.55,joy:.50,love:.45,grateful:.48,anxious:.35,sad:.28,angry:.20,numb:.18,excited:.40} },
  USA:{ name:'United States',r:'am', mood:'excited', s:{excited:.62,anxious:.55,joy:.50,angry:.42,hope:.45,love:.38,calm:.30,sad:.35,numb:.22,grateful:.48} },
  CAN:{ name:'Canada',       r:'am', mood:'calm',    s:{calm:.62,hope:.55,grateful:.58,joy:.50,love:.45,excited:.38,sad:.28,anxious:.30,angry:.18,numb:.15} },
  BRA:{ name:'Brazil',       r:'am', mood:'excited', s:{excited:.72,joy:.68,love:.62,hope:.55,calm:.35,sad:.25,anxious:.30,angry:.22,numb:.12,grateful:.50} },
  MEX:{ name:'Mexico',       r:'am', mood:'joy',     s:{joy:.65,love:.60,excited:.52,hope:.48,calm:.35,sad:.28,anxious:.32,angry:.20,numb:.14,grateful:.55} },
  ARG:{ name:'Argentina',    r:'am', mood:'sad',     s:{sad:.55,hope:.42,joy:.38,love:.40,anxious:.38,calm:.32,angry:.25,numb:.28,excited:.30,grateful:.35} },
  CHN:{ name:'China',        r:'as', mood:'hope',    s:{hope:.60,calm:.52,excited:.48,joy:.42,grateful:.45,sad:.25,anxious:.38,angry:.30,numb:.20,love:.35} },
  JPN:{ name:'Japan',        r:'as', mood:'calm',    s:{calm:.68,hope:.55,grateful:.60,sad:.38,joy:.45,love:.42,numb:.32,anxious:.35,excited:.30,angry:.15} },
  IND:{ name:'India',        r:'as', mood:'hope',    s:{hope:.70,joy:.62,love:.58,excited:.55,grateful:.60,calm:.35,sad:.28,anxious:.32,angry:.20,numb:.10} },
  IDN:{ name:'Indonesia',    r:'as', mood:'joy',     s:{joy:.65,love:.58,hope:.55,excited:.50,grateful:.52,calm:.40,sad:.22,anxious:.25,angry:.15,numb:.08} },
  KOR:{ name:'South Korea',  r:'as', mood:'anxious', s:{anxious:.50,excited:.48,hope:.45,calm:.42,sad:.38,joy:.35,love:.32,numb:.28,angry:.20,grateful:.35} },
  TUR:{ name:'Turkey',       r:'as', mood:'anxious', s:{anxious:.52,hope:.45,sad:.40,calm:.35,angry:.38,joy:.30,love:.28,numb:.25,excited:.22,grateful:.20} },
  IRN:{ name:'Iran',         r:'as', mood:'angry',   s:{angry:.55,sad:.48,numb:.42,anxious:.50,hope:.30,calm:.22,joy:.18,love:.15,excited:.12,grateful:.10} },
  SAU:{ name:'Saudi Arabia', r:'as', mood:'calm',    s:{calm:.55,hope:.50,grateful:.48,joy:.42,love:.35,anxious:.30,sad:.22,angry:.18,numb:.15,excited:.38} },
  PAK:{ name:'Pakistan',     r:'as', mood:'anxious', s:{anxious:.58,sad:.48,hope:.42,angry:.38,numb:.35,calm:.28,joy:.22,love:.20,excited:.15,grateful:.18} },
  AUS:{ name:'Australia',    r:'as', mood:'calm',    s:{calm:.65,joy:.62,hope:.55,love:.50,grateful:.52,excited:.45,sad:.22,anxious:.25,angry:.18,numb:.10} },
  NGA:{ name:'Nigeria',      r:'af', mood:'excited', s:{excited:.70,hope:.65,joy:.60,love:.55,grateful:.58,calm:.30,sad:.25,anxious:.28,angry:.18,numb:.10} },
  ZAF:{ name:'S. Africa',    r:'af', mood:'hope',    s:{hope:.58,joy:.50,love:.45,grateful:.52,calm:.40,sad:.35,anxious:.38,angry:.28,numb:.20,excited:.42} },
  EGY:{ name:'Egypt',        r:'af', mood:'anxious', s:{anxious:.55,hope:.48,calm:.38,sad:.35,joy:.32,love:.28,angry:.30,numb:.25,excited:.20,grateful:.30} },
  KEN:{ name:'Kenya',        r:'af', mood:'hope',    s:{hope:.65,joy:.58,love:.52,excited:.48,grateful:.55,calm:.38,sad:.25,anxious:.22,angry:.15,numb:.08} },
  ETH:{ name:'Ethiopia',     r:'af', mood:'hope',    s:{hope:.62,joy:.52,love:.48,excited:.45,grateful:.50,calm:.35,sad:.28,anxious:.25,angry:.18,numb:.10} },
  COD:{ name:'DR Congo',     r:'af', mood:'sad',     s:{sad:.55,hope:.45,angry:.40,anxious:.38,numb:.32,calm:.28,joy:.22,love:.20,excited:.15,grateful:.18} },
  MAR:{ name:'Morocco',      r:'af', mood:'hope',    s:{hope:.55,calm:.48,joy:.45,love:.40,grateful:.42,sad:.28,anxious:.30,angry:.22,numb:.15,excited:.35} },
  THA:{ name:'Thailand',     r:'as', mood:'joy',     s:{joy:.70,love:.62,grateful:.58,calm:.48,hope:.52,excited:.45,sad:.20,anxious:.22,angry:.15,numb:.08} },
};

// ISO numeric → alpha-3
const ISO = {
  4:'AFG',8:'ALB',12:'DZA',24:'AGO',32:'ARG',36:'AUS',40:'AUT',50:'BGD',56:'BEL',
  68:'BOL',76:'BRA',100:'BGR',104:'MMR',116:'KHM',120:'CMR',124:'CAN',140:'CAF',
  144:'LKA',152:'CHL',156:'CHN',170:'COL',178:'COG',180:'COD',191:'HRV',192:'CUB',
  203:'CZE',208:'DNK',218:'ECU',818:'EGY',231:'ETH',246:'FIN',250:'FRA',276:'DEU',
  288:'GHA',300:'GRC',332:'HTI',348:'HUN',356:'IND',360:'IDN',364:'IRN',368:'IRQ',
  372:'IRL',376:'ISR',380:'ITA',392:'JPN',398:'KAZ',404:'KEN',408:'PRK',410:'KOR',
  418:'LAO',430:'LBR',434:'LBY',458:'MYS',466:'MLI',484:'MEX',504:'MAR',508:'MOZ',
  516:'NAM',524:'NPL',528:'NLD',558:'NIC',562:'NER',566:'NGA',578:'NOR',586:'PAK',
  604:'PER',608:'PHL',616:'POL',620:'PRT',642:'ROU',643:'RUS',646:'RWA',682:'SAU',
  686:'SEN',706:'SOM',710:'ZAF',724:'ESP',752:'SWE',756:'CHE',760:'SYR',764:'THA',
  792:'TUR',800:'UGA',804:'UKR',784:'ARE',826:'GBR',840:'USA',858:'URY',862:'VEN',
  704:'VNM',887:'YEM',894:'ZMB',716:'ZWE',
};

// ─────────────────────────────────────────────────
// CITY DATA
// ─────────────────────────────────────────────────
const CITIES = [
  { n:'Rome',      lat:41.90, lon:12.50, cid:'ITA', mood:'love',    kw:'amore · eterno · passione',   pulse:'The eternal city breathes in burgundy — love older than stone.' },
  { n:'Milan',     lat:45.46, lon:9.19,  cid:'ITA', mood:'excited', kw:'moda · velocità · ambizione', pulse:'Milan pulses like an engine, ambition dressed in silk.' },
  { n:'Naples',    lat:40.85, lon:14.27, cid:'ITA', mood:'joy',     kw:'sole · pizza · calore',       pulse:'Naples erupts in laughter louder than Vesuvio.' },
  { n:'Florence',  lat:43.77, lon:11.25, cid:'ITA', mood:'grateful',kw:'arte · bellezza · grazia',    pulse:'Florence kneels before beauty with Renaissance reverence.' },
  { n:'Venice',    lat:45.44, lon:12.33, cid:'ITA', mood:'calm',    kw:'acqua · silenzio · gondola',  pulse:'Venice drifts on silence, dissolving into its own reflection.' },
  { n:'Turin',     lat:45.07, lon:7.69,  cid:'ITA', mood:'calm',    kw:'caffè · eleganza · montagna', pulse:'Turin stirs its espresso slowly, dignity in every motion.' },
  { n:'Bologna',   lat:44.49, lon:11.34, cid:'ITA', mood:'joy',     kw:'cibo · rosso · università',   pulse:'Bologna laughs with a full belly, generous as its red rooftops.' },
  { n:'Palermo',   lat:38.12, lon:13.36, cid:'ITA', mood:'hope',    kw:'mare · storia · speranza',    pulse:'Palermo reaches toward the Mediterranean sun with salt-stained hands.' },
  { n:'Catania',   lat:37.50, lon:15.09, cid:'ITA', mood:'anxious', kw:'vulcano · fuoco · coraggio',  pulse:'Catania lives in Etna\'s shadow, beautiful and breathlessly uncertain.' },
  { n:'Marsala',   lat:37.80, lon:12.44, cid:'ITA', mood:'grateful',kw:'vino · tramonto · pace',      pulse:'Marsala tastes of wine and gratitude — a golden afternoon that refuses to end.' },
  { n:'New York',  lat:40.71, lon:-74.01,cid:'USA', mood:'excited', kw:'hustle · ambition · scale',   pulse:'New York never exhales — even its silence buzzes with becoming.' },
  { n:'London',    lat:51.51, lon:-.13,  cid:'GBR', mood:'anxious', kw:'fog · resolve · grey',        pulse:'London speaks in understatement while the fog absorbs its worries.' },
  { n:'Paris',     lat:48.85, lon:2.35,  cid:'FRA', mood:'love',    kw:'amour · lumière · liberté',   pulse:'Paris is a love letter that rewrites itself each morning.' },
  { n:'Tokyo',     lat:35.68, lon:139.69,cid:'JPN', mood:'calm',    kw:'静寂 · 規律 · 礼儀',          pulse:'Tokyo breathes in perfect intervals, synchronized by ritual.' },
  { n:'Berlin',    lat:52.52, lon:13.40, cid:'DEU', mood:'hope',    kw:'Freiheit · Hoffnung · Wandel',pulse:'Berlin rebuilds from memory into monument, scar tissue turned cathedral.' },
  { n:'Madrid',    lat:40.42, lon:-3.70, cid:'ESP', mood:'joy',     kw:'fiesta · pasión · sol',       pulse:'Madrid lives until 3am because beauty should not have a bedtime.' },
  { n:'Mumbai',    lat:19.07, lon:72.88, cid:'IND', mood:'excited', kw:'सपना · रंग · ऊर्जा',        pulse:'Mumbai dreams in widescreen, Bollywood colors bleeding into every gutter.' },
  { n:'Lagos',     lat:6.52,  lon:3.38,  cid:'NGA', mood:'excited', kw:'hustle · vibes · rise',       pulse:'Lagos roars with the ambition of a continent refusing to wait.' },
  { n:'São Paulo', lat:-23.55,lon:-46.63,cid:'BRA', mood:'excited', kw:'samba · urgência · favela',   pulse:'São Paulo is concrete singing carnival on a Monday.' },
  { n:'Istanbul',  lat:41.01, lon:28.95, cid:'TUR', mood:'anxious', kw:'köprü · eski · yeni',         pulse:'Istanbul sits between two worlds, learning to love the vertigo.' },
  { n:'Cairo',     lat:30.04, lon:31.24, cid:'EGY', mood:'anxious', kw:'نيل · تاريخ · أمل',          pulse:'Cairo reads its future in the Nile silt — ancient and uncertain.' },
  { n:'Moscow',    lat:55.75, lon:37.62, cid:'RUS', mood:'numb',    kw:'холод · тишина · судьба',     pulse:'Moscow stares into frozen rivers and sees nothing, then everything.' },
  { n:'Sydney',    lat:-33.87,lon:151.21,cid:'AUS', mood:'joy',     kw:'surf · mateship · golden',    pulse:'Sydney greets the sun like an old friend — warmly, without ceremony.' },
  { n:'Beijing',   lat:39.91, lon:116.39,cid:'CHN', mood:'hope',    kw:'希望 · 力量 · 未来',          pulse:'Beijing looks forward with ten thousand years of patience.' },
  { n:'Buenos Aires',lat:-34.60,lon:-58.38,cid:'ARG',mood:'sad',   kw:'tango · melancolía · pasión', pulse:'Buenos Aires tangos with melancholy, making sadness magnificent.' },
  { n:'Toronto',   lat:43.65, lon:-79.38,cid:'CAN', mood:'calm',    kw:'mosaic · peace · grace',      pulse:'Toronto is politely extraordinary — a symphony that never raises its voice.' },
  { n:'Nairobi',   lat:-1.29, lon:36.82, cid:'KEN', mood:'hope',    kw:'ubuntu · rise · resilience',  pulse:'Nairobi stands where the savanna meets tomorrow — restless and radiant.' },
  { n:'Bangkok',   lat:13.75, lon:100.52,cid:'THA', mood:'joy',     kw:'สุข · สีสัน · ชีวิต',       pulse:'Bangkok smiles through everything — the heat, the traffic, the grace.' },
];

const WORDS = {
  joy:      ['radiant','alive','gleaming','golden','beaming','dancing','luminous','vibrant'],
  love:     ['tender','adore','cherish','embrace','warmth','devotion','longing','forever'],
  hope:     ['rising','tomorrow','belief','forward','renewal','possible','dawn','bright'],
  calm:     ['still','breathe','serene','gentle','quiet','ease','drifting','peaceful'],
  sad:      ['hollow','grey','missing','distant','heavy','ache','fading','lost'],
  anxious:  ['racing','breathless','trembling','uncertain','edge','tense','spiral'],
  angry:    ['fury','burning','rupture','resist','shatter','fierce','blazing','raw'],
  numb:     ['empty','frozen','glass','static','absent','fading','hollow','gone'],
  excited:  ['surge','electric','pulse','velocity','ignite','rush','alive','thrilling'],
  grateful: ['thank','blessed','enough','precious','grace','abundance','given','whole'],
};

// ─────────────────────────────────────────────────
// CANVAS SETUP
// ─────────────────────────────────────────────────
const cS  = document.getElementById('c-stars');
const cM  = document.getElementById('c-map');
const cC  = document.getElementById('c-cities');
const cFX = document.getElementById('c-fx');

const ctxS  = cS.getContext('2d');
const ctxM  = cM.getContext('2d');
const ctxC  = cC.getContext('2d');
const ctxFX = cFX.getContext('2d');

let W = 0, H = 0;
const DPR = Math.min(window.devicePixelRatio || 1, 2);  // cap at 2× for performance

const BW = 960, BH = 500;

// ─────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────
let tx = 0, ty = 0, sc = 1;
const SMIN = 0.5, SMAX = 22;
let dragging = false, dragX = 0, dragY = 0, dtx = 0, dty = 0, moved = 0;
let mX = 0, mY = 0;
let geoFeatures = [];
let stars = [];
let cityT  = 0;
let ripples = [];
let curMood = 'calm';
let curRegion = 'all';
let selCid = null, selCity = null;
let feedCount = 0;
let userCity = 'Global', userCountry = 'Earth';

// aggregate global scores
const gS = {};
MK.forEach(m => gS[m] = 0);
Object.values(CD).forEach(c => MK.forEach(m => gS[m] += (c.s[m] || 0)));

// ─────────────────────────────────────────────────
// RESIZE  — sets DPR-aware canvas size ONCE per call
// ─────────────────────────────────────────────────
function resize() {
  W = window.innerWidth;
  H = window.innerHeight;

  [cS, cM, cC, cFX].forEach(canvas => {
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    // reset transform then apply DPR scale once
    const ctx = canvas.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  });

  mkStars();
  if (geoFeatures.length) drawMap();
}
window.addEventListener('resize', resize);

// ─────────────────────────────────────────────────
// STARS
// ─────────────────────────────────────────────────
function mkStars() {
  stars = [];
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.9 + 0.15,
      a: Math.random(), da: (Math.random() - 0.5) * 0.004
    });
  }
}

function drawStars() {
  ctxS.clearRect(0, 0, W, H);
  stars.forEach(s => {
    s.a = Math.max(0.04, Math.min(0.95, s.a + s.da));
    if (s.a <= 0.05 || s.a >= 0.94) s.da *= -1;
    ctxS.beginPath();
    ctxS.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctxS.fillStyle = `rgba(185,205,255,${s.a * 0.6})`;
    ctxS.fill();
  });
}

// ─────────────────────────────────────────────────
// MERCATOR PROJECTION
// ─────────────────────────────────────────────────
function proj(lon, lat) {
  lat = Math.max(-85, Math.min(85, lat));
  const x = (lon + 180) / 360 * BW * (W / BW) * sc + tx;
  const sinL = Math.sin(lat * Math.PI / 180);
  const mercN = Math.log((1 + sinL) / (1 - sinL)) / 2;
  const y = (Math.PI - mercN) / (2 * Math.PI) * BH * (H / BH) * sc + ty;
  return [x, y];
}

function projRaw(lon, lat) {
  lat = Math.max(-85, Math.min(85, lat));
  const x = (lon + 180) / 360 * BW * (W / BW);
  const sinL = Math.sin(lat * Math.PI / 180);
  const mercN = Math.log((1 + sinL) / (1 - sinL)) / 2;
  const y = (Math.PI - mercN) / (2 * Math.PI) * BH * (H / BH);
  return [x, y];
}

function unproj(px, py) {
  const rx = (px - tx) / (sc * (W / BW));
  const ry = (py - ty) / (sc * (H / BH));
  const lon = rx / BW * 360 - 180;
  const mercN = Math.PI - ry / BH * 2 * Math.PI;
  const lat = Math.atan(Math.sinh(mercN)) * 180 / Math.PI;
  return [lon, lat];
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────
function h2r(hex, a) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function globalDom() {
  let best = 'calm', bv = 0;
  MK.forEach(m => { if (gS[m] > bv) { bv = gS[m]; best = m; } });
  return best;
}

function getCD(feat) {
  const id = feat.id || feat.properties?.id;
  const iso = ISO[+id] || feat.properties?.ISO_A3 || feat.properties?.ADM0_A3;
  return iso ? CD[iso] : null;
}

// ─────────────────────────────────────────────────
// MAP DRAWING
// ─────────────────────────────────────────────────
function drawMap() {
  if (!geoFeatures.length) return;
  ctxM.clearRect(0, 0, W, H);

  // Ocean
  ctxM.fillStyle = '#030f22';
  ctxM.fillRect(0, 0, W, H);

  // Graticule
  ctxM.save();
  ctxM.strokeStyle = 'rgba(100,140,200,0.05)';
  ctxM.lineWidth = 0.5;
  for (let lat = -60; lat <= 80; lat += 30) {
    ctxM.beginPath(); let f = true;
    for (let lon = -180; lon <= 180; lon += 3) {
      const [px, py] = proj(lon, lat);
      f ? ctxM.moveTo(px, py) : ctxM.lineTo(px, py); f = false;
    }
    ctxM.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    ctxM.beginPath(); let f = true;
    for (let lat = -80; lat <= 82; lat += 3) {
      const [px, py] = proj(lon, lat);
      f ? ctxM.moveTo(px, py) : ctxM.lineTo(px, py); f = false;
    }
    ctxM.stroke();
  }
  ctxM.restore();

  // Countries
  for (const feat of geoFeatures) {
    const cd = getCD(feat);
    const mood = cd ? cd.mood : 'calm';
    const mc = M[mood];
    const inRegion = curRegion === 'all' || (cd && cd.r === curRegion);
    const isSelected = selCid && cd && CD[selCid] === cd;

    ctxM.globalAlpha = inRegion ? 1 : 0.22;
    drawFeat(feat, mc.h, isSelected ? 0.44 : 0.20, isSelected ? 1.3 : 0.55, isSelected ? mc.h : null);
    ctxM.globalAlpha = 1;
  }
}

function drawFeat(feat, color, fillA, strokeW, glowColor) {
  const geo = feat.geometry;
  if (!geo) return;
  const polys = geo.type === 'MultiPolygon' ? geo.coordinates :
                geo.type === 'Polygon'      ? [geo.coordinates] : [];

  ctxM.fillStyle   = h2r(color, fillA);
  ctxM.strokeStyle = color;
  ctxM.lineWidth   = strokeW / sc;
  ctxM.lineJoin    = 'round';
  ctxM.lineCap     = 'round';
  ctxM.shadowColor = glowColor || 'transparent';
  ctxM.shadowBlur  = glowColor ? 18 / sc : 0;

  for (const poly of polys) {
    for (const ring of poly) {
      if (ring.length < 3) continue;
      ctxM.beginPath();
      let first = true;
      for (const [lon, lat] of ring) {
        if (lat > 85.05 || lat < -85.05) continue;
        const [px, py] = proj(lon, lat);
        first ? ctxM.moveTo(px, py) : ctxM.lineTo(px, py);
        first = false;
      }
      ctxM.closePath();
      ctxM.fill();
      ctxM.stroke();
    }
  }
  ctxM.shadowBlur = 0;
}

// ─────────────────────────────────────────────────
// CITY DOTS
// ─────────────────────────────────────────────────
function drawCities() {
  ctxC.clearRect(0, 0, W, H);
  const showLabels = sc > 3.5;

  for (const city of CITIES) {
    const [px, py] = proj(city.lon, city.lat);
    if (px < -40 || px > W + 40 || py < -40 || py > H + 40) continue;
    if (sc < 1.4 && city.cid !== 'ITA') continue; // only Italian cities at world zoom

    const mc   = M[city.mood];
    const pulse = 0.7 + 0.3 * Math.sin(cityT * 1.4 + city.lat * 0.35 + city.lon * 0.08);
    const dotR  = Math.max(3.5, Math.min(6, 4.5 * Math.min(sc * 0.4, 1)));
    const haloR = dotR * 4.5 * pulse;

    // halo
    const g = ctxC.createRadialGradient(px, py, 0, px, py, haloR);
    g.addColorStop(0,    h2r(mc.h, 0.65));
    g.addColorStop(0.35, h2r(mc.h, 0.18));
    g.addColorStop(1,    h2r(mc.h, 0));
    ctxC.beginPath(); ctxC.arc(px, py, haloR, 0, Math.PI * 2);
    ctxC.fillStyle = g; ctxC.fill();

    // pulse ring
    ctxC.beginPath(); ctxC.arc(px, py, dotR + 3.5 * pulse, 0, Math.PI * 2);
    ctxC.strokeStyle = h2r(mc.h, 0.35 * pulse); ctxC.lineWidth = 1; ctxC.stroke();

    // core
    ctxC.beginPath(); ctxC.arc(px, py, dotR, 0, Math.PI * 2);
    ctxC.fillStyle = mc.h; ctxC.fill();
    ctxC.strokeStyle = 'rgba(255,255,255,0.4)'; ctxC.lineWidth = 0.8; ctxC.stroke();

    // label
    if (showLabels) {
      ctxC.font = `bold ${Math.round(11 + sc * 0.5)}px Bebas Neue`;
      ctxC.fillStyle = 'rgba(220,232,252,0.92)';
      ctxC.shadowColor = mc.h; ctxC.shadowBlur = 6;
      ctxC.fillText(city.n, px + dotR + 5, py + 4);
      ctxC.shadowBlur = 0;
    }
  }
  cityT += 0.018;
}

// ─────────────────────────────────────────────────
// RIPPLE FX
// ─────────────────────────────────────────────────
function drawFX() {
  ctxFX.clearRect(0, 0, W, H);
  ripples = ripples.filter(r => r.life > 0);
  for (const r of ripples) {
    const mc = M[r.mood];
    ctxFX.beginPath(); ctxFX.arc(r.x, r.y, r.rad, 0, Math.PI * 2);
    ctxFX.strokeStyle = h2r(mc.h, r.life * 0.65);
    ctxFX.lineWidth = 1.5; ctxFX.stroke();
    r.rad += 5.5; r.life -= 0.024;
  }
}

function addRipple(x, y, mood) {
  for (let i = 0; i < 3; i++) {
    ripples.push({ x, y, rad: i * 12, life: 1 - i * 0.22, mood: mood || curMood });
  }
}

// ─────────────────────────────────────────────────
// AURORA + RIM
// ─────────────────────────────────────────────────
function setAurora(mood) {
  const mc = M[mood] || M.calm;
  document.getElementById('aurora').style.background =
    `radial-gradient(ellipse 110% 55% at 50% -8%, ${h2r(mc.h, 0.20)} 0%, transparent 62%),` +
    `radial-gradient(ellipse 60% 42% at 10% 95%, ${h2r(mc.h, 0.12)} 0%, transparent 55%),` +
    `radial-gradient(ellipse 55% 35% at 90% 88%, ${h2r(mc.h, 0.09)} 0%, transparent 50%)`;
  document.getElementById('rim').style.boxShadow =
    `inset 0 0 140px ${mc.g}`;
}

// ─────────────────────────────────────────────────
// CSS VAR UPDATE
// ─────────────────────────────────────────────────
function applyMoodColor(mood) {
  const mc = M[mood] || M.calm;
  document.documentElement.style.setProperty('--mc', mc.h);
  document.documentElement.style.setProperty('--mg', mc.g);
  const lm = document.getElementById('logo-mood');
  if (lm) { lm.style.color = mc.h; lm.style.textShadow = `0 0 50px ${mc.g}`; }
}

// ─────────────────────────────────────────────────
// MOOD PANEL
// ─────────────────────────────────────────────────
function setPanel(mood, country, city) {
  curMood = mood;
  applyMoodColor(mood);
  setAurora(mood);

  const bm = document.getElementById('big-mood');
  if (bm) bm.textContent = mood.toUpperCase();

  let pulse = 'The world exhales in ' + mood + ' — a frequency beyond all language.';
  if (city && city.pulse) pulse = city.pulse;
  else if (country) pulse = 'A nation breathes in ' + mood + ' — collective, invisible, immense.';
  const po = document.getElementById('poetic');
  if (po) po.textContent = pulse;

  const scores = country ? country.s : (city ? (CD[city.cid] || {}).s || gS : gS);
  renderBars(scores);
  if (audioOn) shiftDrone(mood);
}

function renderBars(scores) {
  const sorted = MK.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0)).slice(0, 6);
  const mv = scores[sorted[0]] || 1;
  const el = document.getElementById('bars');
  if (!el) return;
  el.innerHTML = '';
  sorted.forEach(m => {
    const pct = Math.round((scores[m] || 0) / mv * 100);
    const row = document.createElement('div');
    row.className = 'br-row';
    row.innerHTML =
      `<div class="br-label">${m.toUpperCase()}</div>` +
      `<div class="br-track"><div class="br-fill" style="width:${pct}%;background:${M[m].h}"></div></div>` +
      `<div class="br-pct">${pct}%</div>`;
    el.appendChild(row);
  });
}

// ─────────────────────────────────────────────────
// BREADCRUMB
// ─────────────────────────────────────────────────
function setBc(crumbs) {
  const el = document.getElementById('bc');
  if (!el) return;
  let h = '<span onclick="resetView()">World</span>';
  crumbs.forEach(c => h += '<span class="sep">›</span><span>' + c + '</span>');
  el.innerHTML = h;
}

// ─────────────────────────────────────────────────
// PAN / ZOOM
// ─────────────────────────────────────────────────
function applyTransform() {
  const chip = document.getElementById('zoom-chip');
  if (chip) chip.textContent = sc.toFixed(1) + '×';
  drawMap();
}

function zoomTo(s, cx, cy) {
  s = Math.max(SMIN, Math.min(SMAX, s));
  if (cx === undefined) { cx = W / 2; cy = H / 2; }
  const ratio = s / sc;
  tx = cx - (cx - tx) * ratio;
  ty = cy - (cy - ty) * ratio;
  sc = s;
  applyTransform();
}

window.zoomBy = function(f, cx, cy) { zoomTo(sc * f, cx, cy); };

window.resetView = function() {
  tx = 0; ty = 0; sc = 1;
  selCid = null; selCity = null;
  applyTransform(); drawCities();
  setBc([]);
  setPanel(globalDom(), null, null);
};

// Mouse wheel zoom (centered on cursor)
cM.addEventListener('wheel', e => {
  e.preventDefault();
  zoomTo(sc * (e.deltaY < 0 ? 1.12 : 0.89), e.offsetX, e.offsetY);
}, { passive: false });

// Drag
cM.addEventListener('mousedown', e => {
  dragging = true; moved = 0;
  dragX = e.clientX; dragY = e.clientY;
  dtx = tx; dty = ty;
  cM.classList.add('drag');
});
window.addEventListener('mousemove', e => {
  if (dragging) {
    moved += Math.abs(e.clientX - dragX) + Math.abs(e.clientY - dragY);
    tx = dtx + (e.clientX - dragX);
    ty = dty + (e.clientY - dragY);
    applyTransform();
  }
  mX = e.clientX; mY = e.clientY;
  hoverTest(e.clientX, e.clientY);
});
window.addEventListener('mouseup', () => { dragging = false; cM.classList.remove('drag'); });

// Click (only if barely moved)
cM.addEventListener('click', e => { if (moved < 6) handleClick(e.clientX, e.clientY); });

// Touch pinch + pan
let lastPinch = 0;
cM.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    lastPinch = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  } else {
    dragging = true; moved = 0;
    dragX = e.touches[0].clientX; dragY = e.touches[0].clientY;
    dtx = tx; dty = ty;
  }
}, { passive: true });

cM.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    zoomBy(d / lastPinch, mx, my);
    lastPinch = d;
  } else if (dragging && e.touches.length === 1) {
    moved += 1;
    tx = dtx + (e.touches[0].clientX - dragX);
    ty = dty + (e.touches[0].clientY - dragY);
    applyTransform();
  }
}, { passive: true });

cM.addEventListener('touchend', e => {
  dragging = false;
  if (moved < 8 && e.changedTouches.length) {
    handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }
});

// ─────────────────────────────────────────────────
// HIT TESTING
// ─────────────────────────────────────────────────
function hoverTest(mx, my) {
  // Cities first
  for (const city of CITIES) {
    const [px, py] = proj(city.lon, city.lat);
    if (Math.hypot(mx - px, my - py) < 14) {
      showTip(city.n, city.mood, city.kw, city.pulse, mx, my);
      return;
    }
  }
  // Countries
  const feat = hitCountry(mx, my);
  if (feat) {
    const cd = getCD(feat);
    if (cd) { showTip(cd.name, cd.mood, '', 'A collective breath caught between memory and morning.', mx, my); return; }
  }
  hideTip();
}

function handleClick(mx, my) {
  for (const city of CITIES) {
    const [px, py] = proj(city.lon, city.lat);
    if (Math.hypot(mx - px, my - py) < 16) { clickCity(city, mx, my); return; }
  }
  const feat = hitCountry(mx, my);
  if (feat) { const cd = getCD(feat); if (cd) clickCountry(feat, cd, mx, my); }
}

function hitCountry(mx, my) {
  const [lon, lat] = unproj(mx, my);
  for (const feat of geoFeatures) {
    if (ptInFeat(lon, lat, feat)) return feat;
  }
  return null;
}

function ptInPoly(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function ptInFeat(lon, lat, feat) {
  const geo = feat.geometry; if (!geo) return false;
  const polys = geo.type === 'MultiPolygon' ? geo.coordinates : geo.type === 'Polygon' ? [geo.coordinates] : [];
  for (const poly of polys) { if (poly[0] && ptInPoly(lon, lat, poly[0])) return true; }
  return false;
}

// ─────────────────────────────────────────────────
// SELECT COUNTRY / CITY
// ─────────────────────────────────────────────────
function clickCountry(feat, cd, mx, my) {
  selCid = Object.keys(CD).find(k => CD[k] === cd) || null;
  selCity = null;
  addRipple(mx, my, cd.mood);
  playClick();
  setBc([cd.name]);
  setPanel(cd.mood, cd, null);
  zoomFeat(feat);
  drawMap(); drawCities();
}

function clickCity(city, mx, my) {
  selCity = city; selCid = city.cid;
  addRipple(mx, my, city.mood);
  playClick();
  const cd = CD[city.cid];
  setBc(cd ? [cd.name, city.n] : [city.n]);
  setPanel(city.mood, null, city);
  const [px, py] = projRaw(city.lon, city.lat);
  const ts = 10;
  tx = W / 2 - px * ts; ty = H / 2 - py * ts; sc = ts;
  applyTransform(); drawCities();
}

function zoomFeat(feat) {
  const geo = feat.geometry; if (!geo) return;
  const polys = geo.type === 'MultiPolygon' ? geo.coordinates : geo.type === 'Polygon' ? [geo.coordinates] : [];
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const poly of polys) {
    for (const ring of poly) {
      for (const [lon, lat] of ring) {
        if (lat > 85 || lat < -85) continue;
        const [px, py] = projRaw(lon, lat);
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
    }
  }
  const pw = x1 - x0, ph = y1 - y0;
  if (!pw || !ph) return;
  const ts = Math.min((W * 0.72) / pw, (H * 0.72) / ph, 18);
  sc = Math.max(SMIN, Math.min(SMAX, ts));
  tx = W / 2 - (x0 + x1) / 2 * sc;
  ty = H / 2 - (y0 + y1) / 2 * sc;
  applyTransform();
}

// ─────────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────────
function showTip(name, mood, kw, pulse, mx, my) {
  const mc = M[mood] || M.calm;
  document.getElementById('tip-name').textContent  = name;
  document.getElementById('tip-mood').textContent  = mood.toUpperCase();
  document.getElementById('tip-kw').textContent    = kw || '';
  document.getElementById('tip-pulse').textContent = pulse || '';
  const tip = document.getElementById('tip');
  tip.style.borderColor = mc.h;
  let x = mx + 16, y = my - 8;
  if (x + 270 > W) x = mx - 280;
  if (y + 170 > H) y = H - 180;
  if (y < 0) y = 8;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
  tip.classList.add('on');
}
function hideTip() { document.getElementById('tip').classList.remove('on'); }

// ─────────────────────────────────────────────────
// REGION FILTER
// ─────────────────────────────────────────────────
window.setRegion = function(btn, r) {
  document.querySelectorAll('.reg').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curRegion = r;
  drawMap();
};

// ─────────────────────────────────────────────────
// LIVE FEED
// ─────────────────────────────────────────────────
function addFeed() {
  const mood = MK[Math.floor(Math.random() * MK.length)];
  const ws   = WORDS[mood];
  const word = ws[Math.floor(Math.random() * ws.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const mc   = M[mood];

  const list = document.getElementById('feed-list');
  if (!list) return;
  const fi = document.createElement('div');
  fi.className = 'fi';
  fi.style.borderLeftColor = mc.h;
  fi.innerHTML = `<div class="fi-w">${word.toUpperCase()}</div><div class="fi-c">${city.n}</div>`;
  list.insertBefore(fi, list.firstChild);
  if (list.children.length > 8) list.removeChild(list.lastChild);

  feedCount++;
  ['feed-cnt', 'feed-cnt-right'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = feedCount;
  });

  // nudge global score
  gS[mood] = (gS[mood] || 0) + 0.25;
  if (!selCid) {
    const nd = globalDom();
    if (nd !== curMood) setPanel(nd, null, null);
  }
  if (audioOn) playMotif(mood);
}

// ─────────────────────────────────────────────────
// AUDIO ENGINE
// ─────────────────────────────────────────────────
let actx = null, mGain = null, verb = null, comp = null;
let drones = [], audioOn = false;

function initAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  comp = actx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 8;
  comp.connect(actx.destination);
  mGain = actx.createGain(); mGain.gain.value = 0; mGain.connect(comp);

  // Reverb impulse response
  const len = actx.sampleRate * 4;
  const buf = actx.createBuffer(2, len, actx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5) * 0.85;
  }
  verb = actx.createConvolver(); verb.buffer = buf; verb.connect(mGain);
}

function mkPad(freq, type, detune, vol) {
  const o = actx.createOscillator(); const g = actx.createGain();
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800;
  const lfo = actx.createOscillator(); const lg = actx.createGain();
  lfo.frequency.value = 0.07 + Math.random() * 0.05; lg.gain.value = 380;
  lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  o.type = type; o.frequency.value = freq;
  if (detune) o.detune.value = detune;
  g.gain.setValueAtTime(0, actx.currentTime);
  g.gain.linearRampToValueAtTime(vol, actx.currentTime + 3.5);
  o.connect(g); g.connect(f); f.connect(verb); o.start();
  return { o, g, lfo };
}

function startDrone(mood) {
  drones.forEach(({ o, g, lfo }) => {
    try { g.gain.linearRampToValueAtTime(0, actx.currentTime + 2.5); setTimeout(() => { try { o.stop(); lfo && lfo.stop(); } catch(e) {} }, 2600); } catch(e) {}
  });
  drones = [];
  const mc   = M[mood] || M.calm;
  const root = mc.note * 0.5;
  drones = [
    mkPad(root,     'sawtooth',  0,  0.032),
    mkPad(root,     'sine',      8,  0.055),
    mkPad(root*1.5, 'triangle', -6,  0.028),
    mkPad(root*2,   'sine',     13,  0.018),
  ];
}

function shiftDrone(mood) { if (!actx || !audioOn) return; startDrone(mood); }

function playMotif(mood) {
  if (!actx || !audioOn) return;
  const mc = M[mood] || M.calm;
  const t  = actx.currentTime;
  const n  = 3 + Math.floor(Math.random() * 3);
  const g  = actx.createGain(); g.gain.value = 0.1; g.connect(verb);
  let dt = t;
  for (let i = 0; i < n; i++) {
    const step = mc.sc[Math.floor(Math.random() * mc.sc.length)];
    const freq = mc.note * Math.pow(2, step / 12) * (Math.random() > 0.5 ? 2 : 1);
    const o = actx.createOscillator(); const og = actx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    og.gain.setValueAtTime(0, dt); og.gain.linearRampToValueAtTime(0.14, dt + 0.04);
    og.gain.linearRampToValueAtTime(0, dt + 0.6);
    o.connect(og); og.connect(g); o.start(dt); o.stop(dt + 0.65);
    dt += 0.13 + Math.random() * 0.18;
  }
}

function playChordSwell() {
  if (!actx || !audioOn) return;
  const mc = M[curMood] || M.calm; const t = actx.currentTime;
  const g  = actx.createGain(); g.gain.value = 0.07; g.connect(verb);
  mc.sc.forEach((step, i) => {
    const freq = mc.note * Math.pow(2, step / 12);
    ['sawtooth', 'sine', 'triangle'].forEach((type, j) => {
      const o = actx.createOscillator(); const og = actx.createGain();
      o.type = type; o.frequency.value = freq * (j === 2 ? 2 : 1);
      o.detune.value = (Math.random() - 0.5) * 14;
      og.gain.setValueAtTime(0, t + i * 0.45);
      og.gain.linearRampToValueAtTime(0.038, t + i * 0.45 + 3);
      og.gain.linearRampToValueAtTime(0, t + i * 0.45 + 10);
      o.connect(og); og.connect(g); o.start(t + i * 0.45); o.stop(t + i * 0.45 + 11);
    });
  });
}

function playClick() {
  if (!actx || !audioOn) return;
  const t = actx.currentTime;
  // Sub bass drop
  const sub = actx.createOscillator(); const sg = actx.createGain();
  sub.frequency.setValueAtTime(75, t);
  sub.frequency.exponentialRampToValueAtTime(25, t + 0.5);
  sg.gain.setValueAtTime(0.42, t); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  sub.connect(sg); sg.connect(comp); sub.start(t); sub.stop(t + 0.52);
  // Metallic partials
  [337, 613, 887, 1253, 1817].forEach((f, i) => {
    const o = actx.createOscillator(); const og = actx.createGain();
    o.frequency.value = f;
    og.gain.setValueAtTime(0.065, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + i * 0.025);
    o.connect(og); og.connect(verb); o.start(t); o.stop(t + 0.4);
  });
  // Noise whoosh
  const ns = actx.createBuffer(1, Math.round(actx.sampleRate * 0.3), actx.sampleRate);
  const nd = ns.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const nb = actx.createBufferSource(); nb.buffer = ns;
  const nf = actx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 2600;
  const ng = actx.createGain(); ng.gain.setValueAtTime(0.11, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  nb.connect(nf); nf.connect(ng); ng.connect(comp); nb.start(t);
}

window.toggleAudio = function() {
  if (!actx) initAudio();
  audioOn = !audioOn;
  const btn = document.getElementById('snd-btn');
  if (btn) btn.classList.toggle('on', audioOn);
  const lbl = document.getElementById('snd-lbl');
  if (lbl) lbl.textContent = audioOn ? 'Soundscape On' : 'Enable Soundscape';
  if (audioOn) {
    actx.resume();
    mGain.gain.cancelScheduledValues(actx.currentTime);
    mGain.gain.linearRampToValueAtTime(0.72, actx.currentTime + 2.5);
    startDrone(curMood);
  } else {
    mGain.gain.linearRampToValueAtTime(0, actx.currentTime + 1.5);
  }
};

// ─────────────────────────────────────────────────
// MOOD CLASSIFICATION  (fallback — no API call)
// ─────────────────────────────────────────────────
const MOOD_MAP = {
  joy:      ['happy','joy','smile','laugh','bright','sunny','cheerful','bliss','delight','wonderful','amazing','good','great'],
  love:     ['love','heart','adore','cherish','tender','affection','warmth','care','passion','romantic','miss','longing'],
  hope:     ['hope','believe','forward','future','rise','aspire','dream','faith','light','wish','possible'],
  calm:     ['calm','peace','serene','quiet','still','gentle','ease','breathe','tranquil','relax','zen','chill'],
  sad:      ['sad','grief','miss','lonely','hollow','hurt','loss','sorrow','cry','tears','depressed','blue','heavy'],
  anxious:  ['anxious','worry','fear','nervous','dread','tense','scared','panic','stress','overwhelm','restless'],
  angry:    ['angry','fury','rage','mad','frustrate','hate','burn','bitter','resentment','furious'],
  numb:     ['numb','void','nothing','blank','frozen','disconnected','apathy','gone','flat','empty'],
  excited:  ['excited','thrill','surge','electric','rush','hyped','buzz','energy','wild','ecstatic','pumped'],
  grateful: ['grateful','thankful','blessed','appreciate','grace','lucky','abundance','fortune','gift','thank'],
};

function classifyFallback(word) {
  const w = word.toLowerCase();
  for (const [mood, words] of Object.entries(MOOD_MAP)) {
    if (words.some(k => w.includes(k) || k.includes(w))) return mood;
  }
  return MK[Math.floor(Math.random() * MK.length)];
}

const FALLBACK_REF = {
  joy:      'The light you carry turns every room into a sunrise. Hold it carefully — it is rarer than you know.',
  love:     'To love is to agree to be undone, again and again, with full consent. You chose the bravest thing.',
  hope:     'Hope is not a feeling — it is a decision made in the dark before dawn has confirmed itself.',
  calm:     'There is a frequency the world cannot reach when you are this still. Stay here a moment longer.',
  sad:      'Grief is just love with nowhere left to go — it pools, it waits, it becomes something else in time.',
  anxious:  'The storm inside you is louder than the one outside. But every storm has a center, and you are in it.',
  angry:    'Anger at its root is a boundary that was crossed. Something in you still believes it matters.',
  numb:     'Numbness is the body saying it has held too much. Rest now. The feeling will return with the light.',
  excited:  'You are vibrating at a frequency the world has not calibrated for yet. This is what beginning feels like.',
  grateful: 'Gratitude is the only prayer that already contains its answer. You are exactly where you need to be.',
};

// ─────────────────────────────────────────────────
// SUBMIT MOOD  — calls Claude API
// ─────────────────────────────────────────────────
window.submitMood = async function() {
  const inp  = document.getElementById('mood-in');
  const word = inp.value.trim();
  if (!word) return;
  inp.value = '';
  if (!actx) initAudio();
  playClick();

  // Show overlay in loading state
  const ov = document.getElementById('overlay');
  document.getElementById('ov-mood').textContent = word.toUpperCase();
  document.getElementById('ov-ref').textContent  = '';
  document.getElementById('ov-wait').textContent = 'Reading your signal…';
  ov.classList.add('on');

  let mood, reflection;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content:
`You are the poetic heart of Global Mood Ring.
User word: "${word}"
Classify into ONE of: joy, love, hope, calm, sad, anxious, angry, numb, excited, grateful
Write exactly 2 cinematic sentences — Hans Zimmer translated to words. Atmospheric, universal, deeply human.
Reply ONLY with valid JSON (no markdown):
{"mood":"<mood>","reflection":"<sentence one>. <sentence two>."}`
        }]
      })
    });
    const data = await res.json();
    const txt  = (data.content || []).map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const p    = JSON.parse(txt);
    mood       = MK.includes(p.mood) ? p.mood : classifyFallback(word);
    reflection = p.reflection;
  } catch(e) {
    mood       = classifyFallback(word);
    reflection = FALLBACK_REF[mood];
  }

  // Update overlay with result
  const mc = M[mood];
  document.documentElement.style.setProperty('--mc', mc.h);
  document.documentElement.style.setProperty('--mg', mc.g);
  document.getElementById('ov-mood').textContent  = mood.toUpperCase();
  document.getElementById('ov-mood').style.color  = mc.h;
  document.getElementById('ov-mood').style.textShadow = `0 0 80px ${mc.g}`;
  document.getElementById('ov-ref').textContent   = reflection;
  document.getElementById('ov-wait').textContent  = '';

  // Save to Supabase (non-blocking)
  if (sb) {
    try {
      await sb.from('mood_signals').insert([{
        word, mood_type: mood, city: userCity, country: userCountry
      }]);
    } catch(e) {}
  }

  if (audioOn) playChordSwell();
};

// ─────────────────────────────────────────────────
// OVERLAY ACTIONS
// ─────────────────────────────────────────────────
window.shareMood = function() {
  const area = document.getElementById('capture-area');
  if (!area || typeof html2canvas === 'undefined') return;
  html2canvas(area).then(canvas => {
    const link = document.createElement('a');
    link.download = `Aura-${userCity}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
};

window.closeOverlay = function() {
  document.getElementById('overlay').classList.remove('on');
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') window.closeOverlay();
});

document.getElementById('mood-in').addEventListener('keydown', e => {
  if (e.key === 'Enter') window.submitMood();
});

// ─────────────────────────────────────────────────
// MAIN ANIMATION LOOP
// ─────────────────────────────────────────────────
let lastSwell = 0;
function loop(ts) {
  drawStars();
  drawCities();
  drawFX();
  if (audioOn && ts - lastSwell > 13500) { playChordSwell(); lastSwell = ts; }
  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────
// GEO LOAD  (TopoJSON from world-atlas CDN)
// ─────────────────────────────────────────────────
function topoToGeoFeatures(topo) {
  const objs = topo.objects;
  const key  = objs.countries ? 'countries' : objs.land ? 'land' : Object.keys(objs)[0];
  const obj  = objs[key];
  const arcs = topo.arcs;
  const ts   = topo.transform ? topo.transform.scale     : [1, 1];
  const tr   = topo.transform ? topo.transform.translate : [0, 0];

  function decArc(i) {
    const rev = i < 0; const arc = arcs[rev ? ~i : i];
    const pts = []; let x = 0, y = 0;
    for (const p of arc) { x += p[0]; y += p[1]; pts.push([x * ts[0] + tr[0], y * ts[1] + tr[1]]); }
    if (rev) pts.reverse(); return pts;
  }
  function decRing(ring) { let p = []; for (const i of ring) p = p.concat(decArc(i)); return p; }
  function geom(g) {
    if (!g) return null;
    if (g.type === 'Polygon') return { type:'Feature', id:g.id, geometry:{ type:'Polygon', coordinates:g.arcs.map(decRing) } };
    if (g.type === 'MultiPolygon') return { type:'Feature', id:g.id, geometry:{ type:'MultiPolygon', coordinates:g.arcs.map(r => r.map(decRing)) } };
    return null;
  }
  if (obj.type === 'GeometryCollection') return obj.geometries.map(geom).filter(Boolean);
  return [geom(obj)].filter(Boolean);
}

function setProgress(v) {
  const bar = document.getElementById('ld-bar');
  if (bar) bar.style.width = v + '%';
}

async function loadGeo() {
  const sources = [
    { url: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json', type: 'topo' },
    { url: 'https://unpkg.com/world-atlas@2/countries-110m.json',           type: 'topo' },
    { url: 'https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson', type: 'geo' },
  ];
  for (const src of sources) {
    try {
      const r = await fetch(src.url); if (!r.ok) continue;
      const data = await r.json();
      const feats = src.type === 'topo' ? topoToGeoFeatures(data) : data.features;
      if (feats && feats.length > 10) return feats;
    } catch(e) { console.warn('Geo source failed:', src.url); }
  }
  return [];
}

// ─────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────
async function boot() {
  resize();
  setProgress(8);

  // Try to get user location for Supabase entries
  try {
    const loc = await fetch('https://ipapi.co/json/').then(r => r.json());
    userCity    = loc.city    || 'Global';
    userCountry = loc.country_name || 'Earth';
  } catch(e) {}

  setProgress(30);

  const feats = await loadGeo();
  if (!feats.length) {
    const ld = document.getElementById('loader');
    if (ld) { ld.querySelector('#ld-title').textContent = 'NETWORK ERROR'; ld.querySelector('#ld-sub').textContent = 'Could not load map data'; }
    return;
  }
  geoFeatures = feats;
  setProgress(90);
  drawMap();

  // Initial mood panel
  setPanel(globalDom(), null, null);

  // Seed live feed
  for (let i = 0; i < 5; i++) setTimeout(addFeed, i * 280);
  setInterval(addFeed, 4000);

  setProgress(100);

  setTimeout(() => {
    const ld = document.getElementById('loader');
    if (ld) {
      ld.classList.add('fade');
      setTimeout(() => ld.style.display = 'none', 950);
    }
  }, 600);

  requestAnimationFrame(loop);
}

boot();
