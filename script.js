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
let dragging=false, dx=0, dy=0, dtx=0, dty=0, movedDist=0;
let selCity=null, curMood='calm';
let geoFeatures=[];
let stars=[];
let audioOn=false;

// 3. THEMES
const M = {
    joy: {h:'#F7C948',g:'rgba(247,201,72,0.4)'},
    love: {h:'#FF6B8A',g:'rgba(255,107,138,0.4)'},
    hope: {h:'#7EC8FF',g:'rgba(126,200,255,0.4)'},
    calm: {h:'#5DDCB8',g:'rgba(93,220,184,0.4)'},
    sad: {h:'#7B9FC4',g:'rgba(123,159,196,0.4)'},
    anxious: {h:'#E8A84A',g:'rgba(232,168,74,0.4)'},
    angry: {h:'#E85555',g:'rgba(232,85,85,0.4)'},
    numb: {h:'#8888A4',g:'rgba(136,136,164,0.4)'},
    excited: {h:'#B87FFF',g:'rgba(184,127,255,0.4)'},
    grateful:{h:'#68D480',g:'rgba(104,212,128,0.4)'}
};

const CITIES = [
    {n:'Rome',lat:41.90,lon:12.50,mood:'love'},
    {n:'Palermo',lat:38.12,lon:13.36,mood:'hope'},
    {n:'Marsala',lat:37.80,lon:12.44,mood:'grateful'},
    {n:'New York',lat:40.71,lon:-74.01,mood:'excited'},
    {n:'London',lat:51.51,lon:-.13,mood:'anxious'},
    {n:'Tokyo',lat:35.68,lon:139.69,mood:'calm'}
];

// 4. CANVAS SETUP
const cS=document.getElementById('c-stars'), cM=document.getElementById('c-map'), cC=document.getElementById('c-cities');
const ctxS=cS.getContext('2d'), ctxM=cM.getContext('2d'), ctxC=cC.getContext('2d');
const BW=960, BH=500;

function proj(lon,lat){
    lat=Math.max(-85,Math.min(85,lat));
    const x=(lon+180)/360*BW*(W/BW)*sc+tx;
    const sinL=Math.sin(lat*Math.PI/180);
    const mercN=Math.log((1+sinL)/(1-sinL))/2;
    const y=(Math.PI-mercN)/(2*Math.PI)*BH*(H/BH)*sc+ty;
    return[x,y];
}

// 5. GLOBAL FUNCTIONS (Attaching to window for HTML buttons)
window.zoomBy = (f) => { sc = Math.max(SMIN, Math.min(SMAX, sc * f)); drawAll(); };
window.resetView = () => { tx=0; ty=0; sc=1; drawAll(); };
window.setRegion = (btn, r) => { 
    document.querySelectorAll('.reg').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
};

window.shareMood = () => {
    const area = document.getElementById('capture-area');
    html2canvas(area).then(canvas => {
        const link = document.createElement('a');
        link.download = `My-Mood-${userCity}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
};

window.submitMood = async () => {
    const inp = document.getElementById('mood-in');
    const word = inp.value.trim();
    if(!word) return;
    inp.value = '';
    const mood = word.length % 2 === 0 ? 'joy' : 'hope'; // Simple placeholder logic
    
    document.getElementById('ov-mood').textContent = word.toUpperCase();
    document.getElementById('overlay').classList.add('on');
    
    try {
        await supabaseClient.from('mood_signals').insert([{ 
            word: word, 
            mood_type: mood, 
            city: userCity, 
            country: userCountry 
        }]);
    } catch(e) { console.error("Database error:", e); }
};

window.closeOverlay = () => document.getElementById('overlay').classList.remove('on');

// 6. INTERACTION (DRAGGING)
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

function mkStars(){ stars=[]; for(let i=0;i<150;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random(),a:Math.random()}); }
function drawStars(){ ctxS.clearRect(0,0,W,H); stars.forEach(s=>{ ctxS.beginPath(); ctxS.arc(s.x,s.y,s.r,0,Math.PI*2); ctxS.fillStyle=`rgba(255,255,255,${s.a})`; ctxS.fill(); }); }

function drawAll(){
    drawMap();
    ctxC.clearRect(0,0,W,H);
    CITIES.forEach(c => {
        const [px,py] = proj(c.lon, c.lat);
        ctxC.beginPath(); ctxC.arc(px,py,4,0,Math.PI*2); ctxC.fillStyle='#5DDCB8'; ctxC.fill();
    });
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

    document.getElementById('loader').classList.add('fade');
    setTimeout(()=>document.getElementById('loader').style.display='none', 950);
    
    setInterval(drawStars, 100);
}

boot();
