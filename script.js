(function () {
'use strict';

const SB_URL  = 'https://elffxqkhihilfmbnengx.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

let db, scene, camera, renderer, controls, globeMesh, signalDots = [];
let audioCtx, masterGain, audioOn = false;
let userLat = 33.57, userLng = -117.73, userCity = 'Aliso Viejo', userCountry = 'USA';

/* ── Audio ── */
window.toggleAudio = function() {
    if (!audioOn) {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);
        }
        audioCtx.resume();
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        const lg = audioCtx.createGain(); lg.gain.value = 0.05;
        osc.connect(lg); lg.connect(masterGain);
        osc.start(); window.activeOsc = osc;
        audioOn = true;
        document.getElementById('audio-icon-glyph').textContent = '◉';
    } else {
        if (window.activeOsc) window.activeOsc.stop();
        audioOn = false;
        document.getElementById('audio-icon-glyph').textContent = '◎';
    }
};

/* ── Globe ── */
function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;

    const loader = new THREE.TextureLoader();
    const dayTex = loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const bumpTex = loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');

    const globeGeo = new THREE.SphereGeometry(1, 128, 128); 
    const globeMat = new THREE.MeshStandardMaterial({ map: dayTex, bumpMap: bumpTex, bumpScale: 0.05, roughness: 0.8 });
    globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    scene.add(new THREE.AmbientLight(0x404040, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    signalDots.forEach(d => {
        d.life -= 0.005;
        d.mesh.material.opacity = d.life;
        if (d.life <= 0) scene.remove(d.mesh);
    });
    renderer.render(scene, camera);
}

/* ── Logic ── */
window.submitMood = async function() {
    const word = document.getElementById('mood-input').value.trim();
    if (!word) return;

    addSignalDot(userLat, userLng, '#4af0c8');
    document.getElementById('aura-word').textContent = word.toUpperCase();
    document.getElementById('aura-loc').textContent = `${userCity}, ${userCountry}`;
    document.getElementById('aura-overlay').classList.remove('hidden');

    if (db) await db.from('mood_signals').insert([{ word, city: userCity, country: userCountry, mood_type: 'neutral' }]);
    document.getElementById('mood-input').value = '';
};

window.closeAura = function() { document.getElementById('aura-overlay').classList.add('hidden'); };

function addSignalDot(lat, lng, color) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const pos = new THREE.Vector3(-1.02 * Math.sin(phi) * Math.cos(theta), 1.02 * Math.cos(phi), 1.02 * Math.sin(phi) * Math.sin(theta));
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
    m.position.copy(pos);
    scene.add(m);
    signalDots.push({ mesh: m, life: 1.0 });
}

window.addEventListener('DOMContentLoaded', () => {
    initGlobe();
    db = supabase.createClient(SB_URL, SB_ANON);
    
    // Geolocation Fallback
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
        userCity = d.city || userCity; userLat = d.latitude || userLat; userLng = d.longitude || userLng;
    }).catch(() => console.log("CORS block: Using Aliso Viejo coordinates."))
    .finally(() => {
        setTimeout(() => {
            document.getElementById('loader').classList.add('fade-out');
            document.getElementById('app').classList.remove('hidden');
        }, 1000);
    });
});

})();
