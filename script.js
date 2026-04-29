// 1. CONNECTION - Replace these with your actual Supabase keys
const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'sb_publishable_KcAegsmUshdHvwPJJoJMJg_fbOyAono';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. STATE VARIABLES
let userCity = "Global";
let userCountry = "Earth";
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

// 3. MOOD & DATA DEFINITIONS
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

// (I'm skipping the repetitive CD and CITIES lists for brevity, 
// but ensure they are in your final script!)

// 4. CORE FUNCTIONS
async function autoDetectLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userCity = data.city || "Global";
        userCountry = data.country_name || "Earth";
    } catch (e) { console.warn("Location detection failed."); }
}

function fbClass(word){
  word=word.toLowerCase();
  const mp={
    joy:['happy','joy','smile','laugh','bright','good'],
    love:['love','heart','adore','warmth','passion'],
    hope:['hope','believe','future','rise','dream'],
    calm:['calm','peace','serene','still','breathe'],
    sad:['sad','grief','lonely','hollow','hurt'],
    anxious:['anxious','worry','fear','nervous','stress'],
    angry:['angry','fury','rage','mad','frustrate'],
    numb:['numb','void','nothing','blank','frozen'],
    excited:['excited','thrill','surge','electric','rush'],
    grateful:['grateful','thankful','blessed','grace'],
  };
  for(const[m,ws] of Object.entries(mp)){if(ws.some(w=>word.includes(w)||w.includes(word)))return m;}
  return MK[Math.floor(Math.random()*MK.length)];
}

async function submitMood() {
    const inp = document.getElementById('mood-in');
    const word = inp.value.trim();
    if (!word) return;
    const finalLocation = selCity ? selCity.n : userCity;
    inp.value = '';
    if (!actx) initAudio(); 
    playClick();

    const ov = document.getElementById('overlay');
    document.getElementById('ov-mood').textContent = word.toUpperCase();
    document.getElementById('ov-ref').textContent = '';
    document.getElementById('ov-wait').textContent = 'Syncing with ' + userCity + '...';
    ov.classList.add('on');

    const mood = fbClass(word);
    const reflection = FB[mood];

    try {
        await supabaseClient.from('mood_signals').insert([
            { word: word, mood_type: mood, city: finalLocation, country: userCountry }
        ]);
    } catch (e) { console.error(e); }

    updateUI(mood, reflection);
}

function updateUI(mood, reflection) {
    const mc = M[mood];
    document.documentElement.style.setProperty('--mc', mc.h);
    document.documentElement.style.setProperty('--mg', mc.g);
    document.getElementById('ov-mood').textContent = mood.toUpperCase();
    document.getElementById('ov-ref').textContent = reflection;
    document.getElementById('ov-wait').textContent = '';
    if (audioOn) playChordSwell();
}

function closeOverlay(){document.getElementById('overlay').classList.remove('on');}

// 5. BOOTSTRAP (The Engine Start)
async function boot() {
    resize();
    await autoDetectLocation();
    setProgress(20);
    const feats = await loadGeo();
    if(!feats || !feats.length) {
        document.getElementById('ld-title').textContent='NETWORK ERROR';
        return;
    }
    geoFeatures = feats;
    setProgress(100);
    drawMap();
    
    // Hide Loader
    setTimeout(() => {
        const ld = document.getElementById('loader');
        ld.classList.add('fade');
        setTimeout(() => ld.style.display = 'none', 950);
    }, 500);

    requestAnimationFrame(loop);
}

// Ensure audio context starts on first click (Browser Policy)
document.addEventListener('click', () => { if(actx && actx.state === 'suspended') actx.resume(); }, {once: true});

// START
boot();

// (Include all original canvas drawing, projection, and zoom functions here)
