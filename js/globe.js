/* ══════════════════════════════════════════════════════════
   GLOBE.JS — Three.js Globe Engine
   - Rotating globe with continent strokes
   - Mood-reactive color system
   - Signal dots with fade animation
   - Emotion arcs between mood-matched cities
   - Heat blobs at signal density zones
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const G = {};
  GMR.globe = G;

  /* ── State ── */
  G.scene = null; G.camera = null; G.renderer = null;
  G.globeMesh = null; G.wireMesh = null; G.rimMesh = null;
  G.glowLight = null; G.continentGroup = null; G.arcGroup = null;
  G.signalDots = []; G.heatBlobs = []; G.arcs = [];
  G.isDragging = false; G.prevMouse = { x: 0, y: 0 };
  G.autoRotate = true; G.pulseT = 0; G.mouseParallax = { x: 0, y: 0 };
  G.recentSignals = []; // {lat, lng, type, time}

  /* ── Helpers ── */
  function latLngToVec3(lat, lng, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lng + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  function buildContinentLines(r) {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x4af0c8, transparent: true, opacity: 0.55 });
    GMR.CONTINENT_STROKES.forEach(stroke => {
      const pts = stroke.map(([lat, lng]) => latLngToVec3(lat, lng, r));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, mat.clone()));
    });
    return group;
  }

  /* ── Init ── */
  G.init = function () {
    const canvas = document.getElementById('globe-canvas');
    const W = window.innerWidth, H = window.innerHeight;

    G.scene = new THREE.Scene();
    G.camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 1000);
    G.camera.position.z = 2.9;

    G.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    G.renderer.setSize(W, H);
    G.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    G.renderer.setClearColor(0x000000, 0);

    /* Solid globe */
    const solidMat = new THREE.MeshPhongMaterial({ color: 0x030810, emissive: 0x010408, transparent: true, opacity: 0.97 });
    G.globeMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), solidMat);
    G.scene.add(G.globeMesh);

    /* Wireframe */
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x4af0c8, wireframe: true, transparent: true, opacity: 0.10 });
    G.wireMesh = new THREE.Mesh(new THREE.SphereGeometry(1.003, 24, 24), wireMat);
    G.scene.add(G.wireMesh);

    /* Continent strokes */
    G.continentGroup = buildContinentLines(1.005);
    G.scene.add(G.continentGroup);

    /* Rim glow */
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x4af0c8, transparent: true, opacity: 0.06, side: THREE.BackSide });
    G.rimMesh = new THREE.Mesh(new THREE.SphereGeometry(1.08, 32, 32), rimMat);
    G.scene.add(G.rimMesh);

    /* Halo */
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x4af0c8, transparent: true, opacity: 0.02, side: THREE.BackSide });
    G.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.18, 24, 24), haloMat));

    /* Arc group */
    G.arcGroup = new THREE.Group();
    G.scene.add(G.arcGroup);

    /* Lights */
    G.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    G.glowLight = new THREE.DirectionalLight(0x4af0c8, 1.4);
    G.glowLight.position.set(3, 2, 3);
    G.scene.add(G.glowLight);
    const back = new THREE.DirectionalLight(0x7b5ef8, 0.5);
    back.position.set(-3, -2, -3);
    G.scene.add(back);

    G._buildStars();
    G._setupDrag(canvas);

    window.addEventListener('mousemove', e => {
      G.mouseParallax.x = (e.clientX / window.innerWidth - 0.5) * 2;
      G.mouseParallax.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener('resize', () => {
      G.camera.aspect = window.innerWidth / window.innerHeight;
      G.camera.updateProjectionMatrix();
      G.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    G._animate();
    console.log('[GMR Globe] Initialized');
  };

  G._buildStars = function () {
    const n = 2400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 7 + Math.random() * 8;
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    G.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.022, transparent: true, opacity: 0.75 })));
  };

  G._setupDrag = function (canvas) {
    const start = (x, y) => { G.isDragging = true; G.autoRotate = false; G.prevMouse = { x, y }; };
    const move  = (x, y) => {
      if (!G.isDragging) return;
      G._rotate((x - G.prevMouse.x) * 0.005, (y - G.prevMouse.y) * 0.005);
      G.prevMouse = { x, y };
    };
    const end = () => { G.isDragging = false; setTimeout(() => { G.autoRotate = true; }, 2200); };
    canvas.addEventListener('mousedown', e => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    canvas.addEventListener('touchmove',  e => move(e.touches[0].clientX, e.touches[0].clientY),  { passive: true });
    canvas.addEventListener('touchend', end);
  };

  G._rotate = function (dx, dy) {
    [G.globeMesh, G.wireMesh, G.rimMesh, G.continentGroup, G.arcGroup].forEach(o => {
      if (o) { o.rotation.y += dx; o.rotation.x += dy; }
    });
  };

  /* ── Set mood color ── */
  G.setColor = function (hex) {
    const col = new THREE.Color(hex);
    if (G.wireMesh)       G.wireMesh.material.color.copy(col);
    if (G.rimMesh)        G.rimMesh.material.color.copy(col);
    if (G.glowLight)      G.glowLight.color.copy(col);
    if (G.continentGroup) G.continentGroup.children.forEach(l => l.material.color.copy(col));
  };

  /* ── Add signal dot ── */
  G.addSignalDot = function (lat, lng, color) {
    const pos = latLngToVec3(lat, lng, 1.015);
    const geo = new THREE.SphereGeometry(0.018, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 });
    const dot = new THREE.Mesh(geo, mat);

    // Apply current globe rotation so dot appears at correct position
    const euler = new THREE.Euler().copy(G.globeMesh.rotation);
    pos.applyEuler(euler);
    dot.position.copy(pos);
    G.scene.add(dot);
    G.signalDots.push({ mesh: dot, life: 1.0 });

    // Track for arc building
    G.recentSignals.push({ lat, lng, color, time: Date.now() });
    if (G.recentSignals.length > 20) G.recentSignals.shift();

    // Try to draw an arc to a matching city
    G._tryDrawArc(lat, lng, color);

    // Pulse
    G.pulseT = 1.0;
  };

  /* ── Emotion arcs ── */
  G._tryDrawArc = function (lat, lng, color) {
    // Find a world city with similar mood color
    const cities = GMR.WORLD_CITIES;
    const target = cities[Math.floor(Math.random() * cities.length)];
    if (!target) return;

    const start = latLngToVec3(lat, lng, 1.015);
    const end   = latLngToVec3(target.lat, target.lon, 1.015);
    const mid   = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.4);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts   = curve.getPoints(60);
    const geo   = new THREE.BufferGeometry().setFromPoints(pts);
    const mat   = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
    const line  = new THREE.Line(geo, mat);

    // Match globe rotation
    line.rotation.copy(G.globeMesh.rotation);
    G.arcGroup.add(line);
    G.arcs.push({ line, life: 1.0, maxLife: 1.0 });

    // Remove excess arcs
    if (G.arcs.length > 12) {
      const old = G.arcs.shift();
      G.arcGroup.remove(old.line);
      old.line.geometry.dispose();
      old.line.material.dispose();
    }
  };

  /* ── Pulse burst ── */
  G.pulse = function () { G.pulseT = 1.0; };

  /* ── Animate loop ── */
  G._animate = function () {
    requestAnimationFrame(G._animate);

    if (G.autoRotate) {
      const dr = 0.0013;
      [G.globeMesh, G.wireMesh, G.rimMesh, G.continentGroup, G.arcGroup].forEach(o => { if (o) o.rotation.y += dr; });
    }

    if (!G.isDragging) {
      G.globeMesh.rotation.x += (G.mouseParallax.y * 0.04 - G.globeMesh.rotation.x) * 0.02;
      [G.wireMesh, G.rimMesh, G.continentGroup, G.arcGroup].forEach(o => {
        if (o) o.rotation.x = G.globeMesh.rotation.x;
      });
    }

    // Pulse scale
    if (G.pulseT > 0) {
      const s = 1 + Math.sin(G.pulseT * Math.PI) * 0.07;
      [G.globeMesh, G.wireMesh, G.rimMesh, G.continentGroup].forEach(o => { if (o) o.scale.setScalar(s); });
      G.pulseT = Math.max(0, G.pulseT - 0.035);
    } else {
      [G.globeMesh, G.wireMesh, G.rimMesh, G.continentGroup].forEach(o => { if (o) o.scale.setScalar(1); });
    }

    // Fade signal dots
    G.signalDots = G.signalDots.filter(d => {
      d.life -= 0.008;
      d.mesh.material.opacity = Math.max(0, d.life);
      d.mesh.scale.setScalar(1 + (1 - d.life) * 0.8);
      if (d.life <= 0) {
        G.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        return false;
      }
      return true;
    });

    // Fade and dispose dead arcs
    G.arcs = G.arcs.filter(a => {
      a.life -= 0.003;
      a.line.material.opacity = Math.max(0, a.life * 0.6);
      if (a.life <= 0) {
        G.arcGroup.remove(a.line);
        a.line.geometry.dispose();
        a.line.material.dispose();
        return false;
      }
      return true;
    });

    G.renderer.render(G.scene, G.camera);
  };

})();