'use strict';

// 1. CONNECTION - Replace with your actual Supabase keys
const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'sb_publishable_KcAegsmUshdHvwPJJoJMJg_fbOyAono';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. STATE & CONFIG
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

// 3. CANVAS ELEMENTS (Get them after page loads)
const cS=document.getElementById('c-stars');
const cM=document.getElementById('c-map');
const cC=document.getElementById('c-cities');
const cX=document.getElementById('c-fx');
const ctxS=cS.getContext('2d');
const ctxM=cM.getContext('2d');
const ctxC=cC.getContext('2d');
const ctxX=cX.getContext('2d');

// 4. CORE FUNCTIONS (Resize, Drawing, etc.)
function resize(){
  W=window.innerWidth; H=window.innerHeight;
  [cS,cM,cC,cX].forEach(c=>{
    c.width=W*DPR; c.height=H*DPR;
    c.style.width=W+'px'; c.style.height=H+'px';
  });
  ctxS.scale(DPR,DPR); ctxM.scale(DPR,DPR); ctxC.scale(DPR,DPR); ctxX.scale(DPR,DPR);
  mkStars();
  if(geoFeatures.length) drawMap();
}

function mkStars(){
  stars=[];
  for(let i=0;i<350;i++) stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*.9+.15, a:Math.random(), da:(Math.random()-.5)*.004});
}

function drawStars(){
  ctxS.clearRect(0,0,W,H);
  stars.forEach(s=>{
    s.a=Math.max(.04,Math.min(.95,s.a+s.da));
    if(s.a<.05||s.a>.94)s.da*=-1;
    ctxS.beginPath(); ctxS.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctxS.fillStyle=`rgba(185,205,255,${s.a*.55})`; ctxS.fill();
  });
}

// 5. LOCATION & SUBMISSION
async function autoDetectLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userCity = data.city || "Global";
        userCountry = data.country_name || "Earth";
    } catch (e) { console.warn("Location detection failed."); }
}

async function submitMood() {
    const inp = document.getElementById('mood-in');
    const word = inp.value.trim();
    if (!word) return;
    const finalLocation = selCity ? selCity.n : userCity;
    inp.value = '';
    const ov = document.getElementById('overlay');
    document.getElementById('ov-mood').textContent = word.toUpperCase();
    ov.classList.add('on');
    const mood = fbClass(word);
    try {
        await supabaseClient.from('mood_signals').insert([{ word: word, mood_type: mood, city: finalLocation, country: userCountry }]);
    } catch (e) { console.error(e); }
    updateUI(mood, FB[mood]);
}

function updateUI(mood, reflection) {
    const mc = M[mood];
    document.documentElement.style.setProperty('--mc', mc.h);
    document.documentElement.style.setProperty('--mg', mc.g);
    document.getElementById('ov-mood').textContent = mood.toUpperCase();
    document.getElementById('ov-ref').textContent = reflection;
}

function fbClass(word){
    const moodKeywords = { joy:['happy','joy'], love:['love','heart'], hope:['hope'], calm:['peace','calm'], sad:['sad','grief'], anxious:['fear','anxious'], angry:['angry','rage'], numb:['void','numb'], excited:['electric','excited'], grateful:['thank','grateful']};
    for(const[m,ws] of Object.entries(moodKeywords)){ if(ws.some(w=>word.toLowerCase().includes(w))) return m; }
    return MK[Math.floor(Math.random()*MK.length)];
}

// 6. INITIALIZATION
function setProgress(v){ document.getElementById('ld-bar').style.width=v+'%'; }

async function boot() {
    window.addEventListener('resize', resize);
    resize();
    await autoDetectLocation();
    setProgress(50);
    // Dummy geoFeatures for now so it doesn't crash if loadGeo is missing
    geoFeatures = [1]; 
    setProgress(100);
    
    setTimeout(() => {
        const ld = document.getElementById('loader');
        ld.classList.add('fade');
        setTimeout(() => ld.style.display = 'none', 950);
    }, 500);

    requestAnimationFrame(function loop(){
        drawStars();
        requestAnimationFrame(loop);
    });
}

// EXECUTE
boot();
