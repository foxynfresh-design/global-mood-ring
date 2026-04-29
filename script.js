(function () {
'use strict';

const SB_URL = 'https://elffxqkhihilfmbnengx.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

let db, scene, camera, renderer, controls, composer, globeMesh, cloudMesh, signalDots = [];
let userLat = 33.57, userLng = -117.73, userCity = 'Aliso Viejo';

/* ── Cinematic Globe Initialization ── */
function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 1. Post-Processing (BLOOM)
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.2; // Epic Glow Strength
    bloomPass.radius = 0.5;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;

    const loader = new THREE.TextureLoader();
    const dayTex = loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const bumpTex = loader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');
    const cloudTex = loader.load('https://unpkg.com/three-globe/example/img/earth-clouds.png');

    // 2. High-Res Earth
    const globeGeo = new THREE.SphereGeometry(1, 128, 128); 
    const globeMat = new THREE.MeshStandardMaterial({ map: dayTex, bumpMap: bumpTex, bumpScale: 0.05, roughness: 0.9 });
    globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    // 3. Moving Clouds (Epicness Layer)
    const cloudGeo = new THREE.SphereGeometry(1.03, 128, 128);
    const cloudMat = new THREE.MeshPhongMaterial({ map: cloudTex, transparent: true, opacity: 0.4 });
    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.PointLight(0xffffff, 2, 100);
    sun.position.set(5, 5, 5);
    scene.add(sun);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (cloudMesh) cloudMesh.rotation.y += 0.0005; // Slow cloud drift

    signalDots = signalDots.filter(d => {
        d.life -= 0.005;
        d.mesh.material.opacity = d.life;
        d.mesh.scale.setScalar(1 + (1 - d.life) * 5); // Massive ripple expansion
        if (d.life <= 0) { globeMesh.remove(d.mesh); return false; }
        return true;
    });

    composer.render(); // Using composer instead of renderer for Bloom
}

/* ── PERSISTENCE: Loading existing signals ── */
async function loadHistory() {
    if (!db) return;
    const { data, error } = await db.from('mood_signals').select('*').order('id', { ascending: false }).limit(8);
    if (data) data.forEach(s => addTickerItem(s));
}

function subscribeRealtime() {
    db.channel('public:mood_signals').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_signals' }, payload => {
        addTickerItem(payload.new);
        addSignalDot(payload.new.lat || userLat, payload.new.lng || userLng, '#4af0c8');
    }).subscribe();
}

function addTickerItem(s) {
    const list = document.getElementById('ticker-list');
    const li = document.createElement('li');
    li.className = 'ticker-item';
    li.textContent = `${s.word.toUpperCase()} · ${s.city || 'Earth'}`;
    list.prepend(li);
    if (list.children.length > 8) list.lastChild.remove();
}

function addSignalDot(lat, lng, color) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const pos = new THREE.Vector3(-1.02 * Math.sin(phi) * Math.cos(theta), 1.02 * Math.cos(phi), 1.02 * Math.sin(phi) * Math.sin(theta));
    
    // Ripple Effect Mesh
    const m = new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.04, 32), 
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, side: THREE.DoubleSide })
    );
    m.position.copy(pos);
    m.lookAt(0,0,0); // Orient ripple toward center
    globeMesh.add(m);
    signalDots.push({ mesh: m, life: 1.0 });
}

window.submitMood = async function() {
    const word = document.getElementById('mood-input').value.trim();
    if (!word) return;

    document.getElementById('aura-word').textContent = word.toUpperCase();
    document.getElementById('aura-loc').textContent = `${userCity}`;
    document.getElementById('aura-overlay').classList.remove('hidden');

    await db.from('mood_signals').insert([{ word, city: userCity, lat: userLat, lng: userLng }]);
    document.getElementById('mood-input').value = '';
};

window.closeAura = () => document.getElementById('aura-overlay').classList.add('hidden');

window.addEventListener('DOMContentLoaded', () => {
    initGlobe();
    db = supabase.createClient(SB_URL, SB_ANON);
    loadHistory(); // Fetch past signals so ticker isn't empty
    subscribeRealtime();
    
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
        userCity = d.city || userCity; userLat = d.latitude || userLat; userLng = d.longitude || userLng;
    }).finally(() => {
        setTimeout(() => {
            document.getElementById('loader').classList.add('fade-out');
            document.getElementById('app').classList.remove('hidden');
        }, 1200);
    });
});
})();
