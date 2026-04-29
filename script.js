'use strict';

// 1. CONNECTION - Replace with your actual Supabase keys
const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'sb_publishable_KcAegsmUshdHvwPJJoJMJg_fbOyAono';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. STATE
let userCity = "Global", userCountry = "Earth";
let W=0, H=0, DPR=window.devicePixelRatio||1;
let tx=0, ty=0, sc=1;
const SMIN=0.5, SMAX=22;
let dragging=false, dx=0, dy=0, dtx=0, dty=0;
let curMood='calm';
let geoFeatures=[];
let stars=[];
let actx=null, mGain=null;
let drones=[];
let audioOn=false;

// 3. MOOD DEFINITIONS
const M = {
    joy: {h:'#F7C948',g:'rgba(247,201,72,0.4)', note:261.63},
    love: {h:'#FF6B8A',g:'rgba(255,107,138,0.4)', note:293.66},
    hope: {h:'#7EC8FF',g:'rgba(126,200,255,0.4)', note:329.63},
    calm: {h:'#5DDCB8',g:'rgba(93,220,184,0.4)', note:349.23},
    sad: {h:'#7B9FC4',g:'rgba(123,159,196,0.4)', note:220.00},
    anxious: {h:'#E8A84A',g:'rgba(232,168,74,0.4)', note:246.94},
    angry: {h:'#E85555',g:'rgba(232,85,85,0.4)', note:185.00},
    numb: {h:'#8888A4',g:'rgba(136,136,164,0.4)', note:196.00},
    excited: {h:'#B87FFF',g:'rgba(184,127,255,0.4)', note:392.00},
    grateful:{h:'#68D480',g:'rgba(104,212,128,0.4)', note:311.13}
};

const FB = {
    joy: "The light you carry turns every room into a sunrise.",
    love: "To love is to agree to be undone, again and again.",
    hope: "Hope is a decision made in the dark before dawn.",
    calm: "There is a frequency the world cannot reach when you are still.",
    sad: "Grief is just love with nowhere left to go.",
    anxious: "Every storm has a center, and you are in it.",
    angry: "Something in you still believes it matters.",
    numb: "Numbness is the body saying it has held too much.",
    excited: "You are vibrating at a frequency the world hasn't calibrated for yet.",
    grateful: "Gratitude is the only prayer that already contains its answer."
};

// 4. AUDIO (The Soundscape)
function initAudio(){
    if(actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    mGain = actx.createGain();
    mGain.gain.value = 0;
    mGain.connect(actx.destination);
}

function startDrone(mood){
    if(!actx) return;
    drones.forEach(o => { try{ o.stop(); } catch(e){} });
    drones = [];
    const mc = M[mood];
    [1, 0.5, 0.75].forEach(mult => {
        const osc = actx.createOscillator();
        const g = actx.createGain();
        osc.frequency.value = mc.note * mult;
        osc.type = 'sine';
        g.gain.value = 0.04;
        osc.connect(g);
        g.connect(mGain);
        osc.start();
        drones.push(osc);
    });
}

// 5. GLOBAL FUNCTIONS
window.toggleAudio = () => {
    if(!actx) initAudio();
    audioOn = !audioOn;
    if(audioOn){
        actx.resume();
        mGain.gain.setTargetAtTime(0.6, actx.currentTime, 2);
        startDrone(curMood);
    } else {
        mGain.gain.setTargetAtTime(0, actx.currentTime, 1);
    }
    document.getElementById('snd-btn').classList.toggle('on', audioOn);
};

window.submitMood = async () => {
    const inp = document.getElementById('mood-in');
    const word = inp.value.trim();
    if(!word) return;
    
    const mood = fbClass(word);
    curMood = mood;
    if(audioOn) startDrone(mood);

    document.getElementById('ov-mood').textContent = mood.toUpperCase();
    document.getElementById('ov-mood').style.color = M[mood].h;
    document.getElementById('ov-ref').textContent = FB[mood];
    document.getElementById('overlay').classList.add('on');
    
    try {
        await supabaseClient.from('mood_signals').insert([{ 
            word, mood_type: mood, city: userCity, country: userCountry 
        }]);
    } catch(e) { console.error(e); }
    inp.value = '';
};

window.shareMood = () => {
    const area = document.getElementById('capture-area');
    html2canvas(area).then(canvas => {
        const link = document.createElement('a');
        link.download = `My-Aura-${userCity}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
};

window.zoomBy = (f) => { sc = Math.max(SMIN, Math.min(SMAX, sc * f)); drawAll(); };
window.resetView = () => { tx=0; ty=0; sc=1; drawAll(); };
window.closeOverlay = () => document.getElementById('overlay').classList.remove('on');
window.setRegion = (btn) => {
    document.querySelectorAll('.reg').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
};

function fbClass(word){
    const wordLower = word.toLowerCase();
    const mp = {
        joy: ['happy','joy','smile','laugh','bright'],
        love: ['love','heart','adore','cherish','warmth'],
        hope: ['hope','believe','future','rise'],
        calm: ['calm','peace','serene','still','breathe'],
        sad: ['sad','grief','miss','lonely','hollow'],
        anxious: ['anxious','worry','fear','nervous','stress'],
        angry: ['angry','fury','rage','mad'],
        numb: ['numb','void','nothing','blank'],
        excited: ['excited','thrill','surge','electric'],
        grateful: ['grateful','thankful','blessed','grace']
    };
    for(const[m,ws] of Object.entries(mp)){
        if(ws.some(w => wordLower.includes(w))) return m;
    }
    return Object.keys(M)[Math.floor(Math.random()*10)];
}

// 6. INTERACTION
cM.addEventListener('mousedown', e => { dragging=true; dx=e.clientX; dy=e.clientY; dtx=tx; dty=ty; });
window.addEventListener('mousemove', e => {
    if(dragging){
        tx = dtx + (e.clientX - dx);
        ty = dty + (e.clientY - dy);
        drawAll();
    }
});
window.addEventListener('mouseup', () => dragging=false);

// 7. DRAWING ENGINE
function resize(){
    W=window.innerWidth; H=window.innerHeight;
    [cS,cM,cC].forEach(c => {
        c.width=W*DPR; c.height=H*DPR; 
        c.style.width=W+'px'; c.style.height=H+'px'; 
        c.getContext('2d').scale(DPR,DPR);
    });
    mkStars(); drawAll();
}

function mkStars(){ stars=[]; for(let i=0;i<100;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random(),a:Math.random()}); }
function drawStars(){ ctxS.clearRect(0,0,W,H); stars.forEach(s=>{ ctxS.beginPath(); ctxS.arc(s.x,s.y,s.r,0,Math.PI*2); ctxS.fillStyle=`rgba(255,255,255,${s.a})`; ctxS.fill(); }); }

function drawAll(){
    drawMap();
    ctxC.clearRect(0,0,W,H);
    
    // THE SPONSOR NODE (Your brand/Sicily)
    const sicilyNode = {n:'Marsala', lat:37.80, lon:12.44};
    const [px,py] = proj(sicilyNode.lon, sicilyNode.lat);
    
    ctxC.beginPath(); 
    ctxC.arc(px,py,6,0,Math.PI*2); 
    ctxC.fillStyle='#FFD700'; // Gold color
    ctxC.fill();
    ctxC.shadowBlur = 15;
    ctxC.shadowColor = 'gold';
    
    // Label for the sponsor
    ctxC.fillStyle = "white";
    ctxC.font = "10px Bebas Neue";
    ctxC.fillText("FEATURED: MARSALA", px + 10, py + 3);
}

function drawMap(){
    if(!geoFeatures.length) return;
    ctxM.clearRect(0,0,W,H);
    ctxM.strokeStyle='rgba(93,220,184,0.3)'; ctxM.lineWidth=1/sc;
    geoFeatures.forEach(feat => {
        const drawPoly = (rings) => {
            rings.forEach(ring => {
                ctxM.beginPath();
                ring.forEach((p, i) => {
                    const [x, y] = proj(p[0], p[1]);
                    if(i===0) ctxM.moveTo(x, y); else ctxM.lineTo(x, y);
                });
                ctxM.stroke();
            });
        };
        if(feat.geometry.type === 'Polygon') drawPoly(feat.geometry.coordinates);
        else if(feat.geometry.type === 'MultiPolygon') feat.geometry.coordinates.forEach(drawPoly);
    });
}

// 8. BOOT
async function boot(){
    window.addEventListener('resize', resize);
    resize();
    
    try {
        const loc = await fetch('https://ipapi.co/json/').then(r => r.json());
        userCity = loc.city; userCountry = loc.country_name;
    } catch(e) {}

    try {
        const mapData = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson').then(r => r.json());
        geoFeatures = mapData.features;
        drawAll();
    } catch(e) {}

    document.getElementById('ld-bar').style.width = '100%';
    setTimeout(()=>{
        document.getElementById('loader').classList.add('fade');
        setTimeout(()=>document.getElementById('loader').style.display='none', 950);
    }, 500);
    
    setInterval(drawStars, 150);
}

boot();

// ═══════════════════════════════════════
// LIVE TICKER LOGIC
// ═══════════════════════════════════════
function addFeed() {
    const list = document.getElementById('feed-list');
    if (!list) return;

    const moods = Object.keys(M);
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const words = ["Radiant", "Still", "Rising", "Tender", "Ache", "Surge"]; // Example variety
    const word = words[Math.floor(Math.random() * words.length)];
    
    const fi = document.createElement('div');
    fi.className = 'fi'; // This matches the CSS animation in style.css
    fi.style.borderLeft = `2px solid ${M[randomMood].h}`;
    fi.innerHTML = `<div class="fi-w">${word.toUpperCase()}</div><div class="fi-c">${userCity}</div>`;
    
    list.insertBefore(fi, list.firstChild);
    if (list.children.length > 5) list.removeChild(list.lastChild);
    
    // Increment the counter in the top right
    const cnt = document.getElementById('feed-cnt');
    if (cnt) cnt.textContent = parseInt(cnt.textContent) + 1;
}

// Start the ticker after the page loads
setInterval(addFeed, 4000);
