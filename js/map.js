/* ══════════════════════════════════════════════════════════
   MAP.JS — SVG World Map Engine
   - Interactive SVG world map
   - Pan / zoom / mouse wheel
   - Country + city click to focus
   - Tooltip on hover
   - Ripple effects on click
   - Mood weather overlay system
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const M = {};
  GMR.map = M;

  /* ── State ── */
  M.inited   = false;
  M.zoom     = 1;
  M.panX     = 0;
  M.panY     = 0;
  M.dragging = false;
  M.lastX    = 0;
  M.lastY    = 0;
  M.breadcrumb = ['WORLD'];

  const { MAP_W, MAP_H, mX, mY, COUNTRY_SHAPES, WORLD_CITIES, TYPE_COLOR, esc } = GMR;

  /* ── Init ── */
  M.init = function () {
    if (M.inited) return;
    M.inited = true;

    const svg = document.getElementById('map-svg');
    svg.setAttribute('width',   MAP_W);
    svg.setAttribute('height',  MAP_H);
    svg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`);

    /* Ocean */
    const ocean = _el('rect');
    ocean.setAttribute('width',  MAP_W);
    ocean.setAttribute('height', MAP_H);
    ocean.setAttribute('fill', '#04111f');
    svg.appendChild(ocean);

    /* Grid lines */
    _buildGrid(svg);

    /* Countries */
    Object.entries(COUNTRY_SHAPES).forEach(([code, data]) => {
      if (!data.pts.length) return;
      const col = TYPE_COLOR[data.mood] || '#4af0c8';
      const pts = data.pts.map(([x, y]) => `${x * (MAP_W / 1400)},${y * (MAP_H / 720)}`).join(' ');

      const poly = _el('polygon');
      poly.setAttribute('points', pts);
      poly.setAttribute('fill',         col + '38');
      poly.setAttribute('stroke',       col);
      poly.setAttribute('stroke-width', '0.8');
      poly.setAttribute('data-code', code);
      poly.style.cursor     = 'pointer';
      poly.style.transition = 'fill 1.5s ease, stroke 1.5s ease';

      poly.addEventListener('mouseenter', e => M._showTooltip(e, data.mood, code, data.sentence, data.keywords));
      poly.addEventListener('mousemove',  e => M._moveTooltip(e));
      poly.addEventListener('mouseleave', M._hideTooltip);
      poly.addEventListener('click', () => M._focusCountry(code, data));
      svg.appendChild(poly);
    });

    /* Cities */
    WORLD_CITIES.forEach(city => {
      const x = mX(city.lon), y = mY(city.lat);
      const col = TYPE_COLOR[city.mood] || '#4af0c8';
      const g = _el('g');
      g.setAttribute('data-city', city.name);
      g.style.cursor = 'pointer';

      const ring = _el('circle');
      ring.setAttribute('cx', x); ring.setAttribute('cy', y); ring.setAttribute('r', 4);
      ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', col);
      ring.setAttribute('stroke-width', '1'); ring.setAttribute('opacity', '0.6');
      ring.classList.add('city-pulse');
      ring.style.animationDelay = Math.random() * 2 + 's';

      const dot = _el('circle');
      dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', '2.5');
      dot.setAttribute('fill', col); dot.setAttribute('opacity', '0.9');

      const label = _el('text');
      label.setAttribute('x', x + 5); label.setAttribute('y', y - 5);
      label.setAttribute('fill', 'rgba(255,255,255,0.65)');
      label.setAttribute('font-size', '7');
      label.setAttribute('font-family', 'Tenor Sans, sans-serif');
      label.setAttribute('letter-spacing', '1');
      label.classList.add('city-label');
      label.textContent = city.name.toUpperCase();

      g.appendChild(ring); g.appendChild(dot); g.appendChild(label);
      g.addEventListener('mouseenter', e => M._showTooltip(e, city.mood, city.name, city.sentence, city.keywords, true));
      g.addEventListener('mousemove',  e => M._moveTooltip(e));
      g.addEventListener('mouseleave', M._hideTooltip);
      g.addEventListener('click', e => { e.stopPropagation(); M._focusCity(city); });
      svg.appendChild(g);
    });

    /* Initial transform */
    M.zoom = 1;
    M.panX = (window.innerWidth  - MAP_W) / 2;
    M.panY = (window.innerHeight - MAP_H) / 2;
    M._applyTransform();
    M._initInteraction();

    console.log('[GMR Map] Initialized');
  };

  /* ── Grid lines ── */
  function _buildGrid(svg) {
    const g = _el('g');
    g.setAttribute('opacity', '0.06');
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = mX(lon);
      const line = _el('line');
      line.setAttribute('x1', x); line.setAttribute('y1', 0);
      line.setAttribute('x2', x); line.setAttribute('y2', MAP_H);
      line.setAttribute('stroke', '#4af0c8'); line.setAttribute('stroke-width', '0.5');
      g.appendChild(line);
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = mY(lat);
      const line = _el('line');
      line.setAttribute('x1', 0);    line.setAttribute('y1', y);
      line.setAttribute('x2', MAP_W); line.setAttribute('y2', y);
      line.setAttribute('stroke', '#4af0c8'); line.setAttribute('stroke-width', '0.5');
      g.appendChild(line);
    }
    svg.appendChild(g);
  }

  /* ── Transform ── */
  M._applyTransform = function () {
    const svg = document.getElementById('map-svg');
    svg.style.transform       = `translate(${M.panX}px, ${M.panY}px) scale(${M.zoom})`;
    svg.style.transformOrigin = '0 0';
    document.querySelectorAll('.city-label').forEach(l => {
      l.style.display = M.zoom >= 3 ? 'block' : 'none';
    });
  };

  /* ── Interaction ── */
  M._initInteraction = function () {
    const container = document.getElementById('map-container-inner');
    const svg = document.getElementById('map-svg');

    container.addEventListener('wheel', e => {
      e.preventDefault();
      const rect   = container.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const delta  = e.deltaY > 0 ? 0.85 : 1.18;
      const newZ   = Math.min(20, Math.max(0.5, M.zoom * delta));
      const ratio  = newZ / M.zoom;
      M.panX = mx - ratio * (mx - M.panX);
      M.panY = my - ratio * (my - M.panY);
      M.zoom = newZ;
      M._applyTransform();
    }, { passive: false });

    container.addEventListener('mousedown', e => {
      if (e.target.tagName === 'polygon' || e.target.closest('g[data-city]')) return;
      M.dragging = true; M.lastX = e.clientX; M.lastY = e.clientY;
      svg.classList.add('grabbing');
    });

    window.addEventListener('mousemove', e => {
      if (!M.dragging || GMR.state.viewMode !== 'map') return;
      M.panX += e.clientX - M.lastX;
      M.panY += e.clientY - M.lastY;
      M.lastX = e.clientX; M.lastY = e.clientY;
      M._applyTransform();
    });

    window.addEventListener('mouseup', () => {
      M.dragging = false;
      document.getElementById('map-svg').classList.remove('grabbing');
    });

    /* Touch pan */
    let lastTouch = null;
    container.addEventListener('touchstart', e => { lastTouch = e.touches[0]; }, { passive: true });
    container.addEventListener('touchmove', e => {
      if (!lastTouch) return;
      M.panX += e.touches[0].clientX - lastTouch.clientX;
      M.panY += e.touches[0].clientY - lastTouch.clientY;
      lastTouch = e.touches[0];
      M._applyTransform();
    }, { passive: true });
  };

  /* ── Focus Country ── */
  M._focusCountry = function (code, data) {
    const shape = COUNTRY_SHAPES[code];
    if (!shape || !shape.pts.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    shape.pts.forEach(([px, py]) => {
      const sx = px * (MAP_W / 1400), sy = py * (MAP_H / 720);
      minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
    });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const fw = window.innerWidth, fh = window.innerHeight;
    const cw = maxX - minX + 80, ch = maxY - minY + 80;
    M.zoom = Math.max(2, Math.min(Math.min(fw / cw, fh / ch) * 0.8, 10));
    M.panX = fw / 2 - cx * M.zoom;
    M.panY = fh / 2 - cy * M.zoom;
    M._applyTransform();

    GMR.ui.updateGiantMood(data.mood, data.sentence);
    M._spawnRipple(fw / 2, fh / 2, TYPE_COLOR[data.mood] || '#4af0c8');
    if (GMR.audio) GMR.audio.playClickBoom();

    M.breadcrumb = ['WORLD', code];
    M._updateBreadcrumb();
  };

  /* ── Focus City ── */
  M._focusCity = function (city) {
    const x = mX(city.lon), y = mY(city.lat);
    const fw = window.innerWidth, fh = window.innerHeight;
    M.zoom = 12;
    M.panX = fw / 2 - x * M.zoom;
    M.panY = fh / 2 - y * M.zoom;
    M._applyTransform();

    GMR.ui.updateGiantMood(city.mood, city.sentence);
    M._spawnRipple(fw / 2, fh / 2, TYPE_COLOR[city.mood] || '#4af0c8');
    if (GMR.audio) GMR.audio.playClickBoom();

    // Show mood twin for clicked city
    if (GMR.viral) GMR.viral.showMoodTwinForCity(city);

    M.breadcrumb = ['WORLD', city.country || '', city.name.toUpperCase()];
    M._updateBreadcrumb();
  };

  /* ── Reset ── */
  M.reset = function () {
    M.zoom = 1;
    M.panX = (window.innerWidth  - MAP_W) / 2;
    M.panY = (window.innerHeight - MAP_H) / 2;
    M._applyTransform();
    M.breadcrumb = ['WORLD'];
    M._updateBreadcrumb();
    GMR.ui.updateGiantMood(GMR.state.dominantType);
  };

  /* ── Zoom buttons ── */
  M.zoomIn  = () => { M.zoom = Math.min(20, M.zoom * 1.3); M._applyTransform(); };
  M.zoomOut = () => { M.zoom = Math.max(0.5, M.zoom / 1.3); M._applyTransform(); };

  /* ── Breadcrumb ── */
  M._updateBreadcrumb = function () {
    const el = document.getElementById('breadcrumb');
    el.innerHTML = M.breadcrumb.filter(Boolean).map((c, i) => {
      if (i === 0) return `<span class="crumb" onclick="GMR.map.reset()">${c}</span>`;
      if (i < M.breadcrumb.length - 1) return `<span class="crumb-sep">›</span><span class="crumb" onclick="GMR.map.reset()">${c}</span>`;
      return `<span class="crumb-sep">›</span><span class="crumb">${c}</span>`;
    }).join('');
  };

  /* ── Tooltip ── */
  M._showTooltip = function (e, moodType, name, sentence, keywords, isCity = false) {
    const col = TYPE_COLOR[moodType] || '#4af0c8';
    document.getElementById('tt-place').textContent  = name.toUpperCase();
    document.getElementById('tt-place').style.color  = col;
    document.getElementById('tt-mood').textContent   = moodType.toUpperCase();
    document.getElementById('tt-mood').style.color   = col;
    document.getElementById('tt-sentence').textContent = sentence || '';
    document.getElementById('tt-keywords').textContent = keywords || '';
    document.getElementById('tooltip').classList.add('visible');
    M._moveTooltip(e);
  };

  M._moveTooltip = function (e) {
    const tt = document.getElementById('tooltip');
    let x = e.clientX + 16, y = e.clientY - 20;
    if (x + 270 > window.innerWidth)  x = e.clientX - 286;
    if (y + 170 > window.innerHeight) y = e.clientY - 180;
    tt.style.left = x + 'px'; tt.style.top = y + 'px';
  };

  M._hideTooltip = function () {
    document.getElementById('tooltip').classList.remove('visible');
  };

  /* ── Ripple ── */
  M._spawnRipple = function (x, y, col) {
    const canvas = document.getElementById('ripple-canvas');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    let r = 0, op = 0.8;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `${col}${Math.floor(op * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 2; ctx.stroke();
      r += 5; op -= 0.022;
      if (op > 0) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
  };

  /* ── Update country mood colors live ── */
  M.updateCountryMood = function (code, moodType) {
    const poly = document.querySelector(`polygon[data-code="${code}"]`);
    if (!poly) return;
    const col = TYPE_COLOR[moodType] || '#4af0c8';
    poly.setAttribute('fill',   col + '38');
    poly.setAttribute('stroke', col);
  };

  /* ── Helper ── */
  function _el(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  /* ── Expose for HTML onclick ── */
  window.resetMapView = () => GMR.map.reset();
  window.zoomIn  = () => GMR.map.zoomIn();
  window.zoomOut = () => GMR.map.zoomOut();

})();
