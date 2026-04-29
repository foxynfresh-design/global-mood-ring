(function () {
'use strict';

const SB_URL = 'https://elffxqkhihilfmbnengx.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

let db, scene, camera, renderer, controls, composer, globeMesh, cloudMesh, ripples = [];
let userLat = 33.57, userLng = -117.73, userCity = 'Aliso Viejo';

function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Cinematic Bloom
    const renderPass = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.8;
    bloomPass.radius = 1;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;

    // --- ROBUST ASSET LOADING ---
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
        console.log("All assets loaded successfully.");
        document.getElementById('loader').classList.add('fade-out');
    };
    manager.onError = (url) => {
        console.warn("Skipping failed texture:", url);
        // We trigger manual loader exit if a critical texture fails so app doesn't hang
        document.getElementById('loader').classList.add('fade-out');
    };

    const loader = new THREE.TextureLoader(manager);
    // Setting CrossOrigin explicitly to prevent the CORS errors seen in console
    loader.setCrossOrigin('anonymous'); 

    // Updated URLS to a more stable repository
    const dayTex = loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const cloudTex = loader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');

    // Earth
    globeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 128, 128),
        new THREE.MeshStandardMaterial({ map: dayTex, roughness: 0.9 })
    );
    scene.add(globeMesh);

    // Clouds
    cloudMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.015, 128, 128),
        new THREE.MeshPhongMaterial({ map: cloudTex, transparent: true, opacity: 0.3 })
    );
    scene.add(cloudMesh);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (cloudMesh) cloudMesh.rotation.y += 0.0003;

    ripples = ripples.filter(r => {
        r.life -= 0.01;
        r.mesh.scale.setScalar(1 + (1 - r.life) * 4);
        r.mesh.material.opacity = r.life;
        if (r.life <= 0) { globeMesh.remove(r.mesh); return false; }
        return true;
    });

    composer.render();
}

async function loadHistory() {
    const { data } = await db.from('mood_signals').select('*').order('id', { ascending: false }).limit(6);
    if (data) data.reverse().forEach(s => addTickerItem(s));
}

function subscribeRealtime() {
    db.channel('mood_signals').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_signals' }, payload => {
        addTickerItem(payload.new);
        triggerRipple(payload.new.lat || userLat, payload.new.lng || userLng);
    }).subscribe();
}

function addTickerItem(s) {
    const list = document.getElementById('ticker-list');
    const li = document.createElement('li');
    li.className = 'ticker-item';
    li.textContent = `${(s.word || 'MOOD').toUpperCase()} · ${(s.city || 'EARTH').toUpperCase()}`;
    list.prepend(li);
    if (list.children.length > 6) list.lastChild.remove();
}

function triggerRipple(lat, lng) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const pos = new THREE.Vector3(-1.02 * Math.sin(phi) * Math.cos(theta), 1.02 * Math.cos(phi), 1.02 * Math.sin(phi) * Math.sin(theta));
    
    const geo = new THREE.RingGeometry(0.01, 0.03, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0x4af0c8, transparent: true, opacity: 1, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.lookAt(0,0,0);
    globeMesh.add(mesh);
    ripples.push({ mesh, life: 1.0 });
}

window.submitMood = async function() {
    const word = document.getElementById('mood-input').value.trim();
    if (!word) return;

    document.getElementById('aura-word').textContent = word.toUpperCase();
    document.getElementById('aura-loc').textContent = userCity.toUpperCase();
    document.getElementById('aura-overlay').classList.remove('hidden');

    await db.from('mood_signals').insert([{ word, city: userCity, lat: userLat, lng: userLng }]);
    document.getElementById('mood-input').value = '';
};

window.closeAura = () => document.getElementById('aura-overlay').classList.add('hidden');

window.addEventListener('DOMContentLoaded', () => {
    initGlobe();
    db = supabase.createClient(SB_URL, SB_ANON);
    loadHistory();
    subscribeRealtime();
    
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
        userCity = d.city || userCity; userLat = d.latitude || userLat; userLng = d.longitude || userLng;
    }).catch(() => console.log("CORS block: Using Aliso Viejo coordinates."))
    .finally(() => {
        // Fallback loader exit in case the manager fails
        setTimeout(() => document.getElementById('loader').classList.add('fade-out'), 2000);
    });
});
})();
