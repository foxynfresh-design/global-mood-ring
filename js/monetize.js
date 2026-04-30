/* ══════════════════════════════════════════════════════════
   MONETIZE.JS — Revenue & Pro Tier Engine
   - Pro tier gate (localStorage unlock)
   - Print shop with 4 product types
   - Sponsored event banners
   - Feature gating system
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const MN = {};
  GMR.monetize = MN;

  const KEY_PRO = 'gmr_pro';

  /* ══════════════════════════════════════════════════════
     PRODUCTS
     ══════════════════════════════════════════════════════ */
  MN.PRODUCTS = [
    {
      id:       'aura-8x10',
      name:     'Aura Print 8×10"',
      desc:     'Your mood, rendered as a luminous aura on archival matte.',
      price:    24,
      emoji:    '🎴',
      dims:     '8 × 10 inches',
      material: 'Archival Matte',
    },
    {
      id:       'aura-12x18',
      name:     'Aura Print 12×18"',
      desc:     'The full-scale statement piece. Deep black, ink-dense glows.',
      price:    38,
      emoji:    '🖼',
      dims:     '12 × 18 inches',
      material: 'Satin Photo Paper',
    },
    {
      id:       'mood-journal',
      name:     'Mood Journal',
      desc:     'A 90-day hand-bound journal seeded with your mood history.',
      price:    28,
      emoji:    '📓',
      dims:     'A5 Hardcover',
      material: 'Vegan Leather Cover',
    },
    {
      id:       'globe-a2',
      name:     'Globe Poster A2',
      desc:     'The Globe Mood Ring rendered at A2 — your signals marked.',
      price:    55,
      emoji:    '🌍',
      dims:     'A2 (16.5 × 23.4")',
      material: 'Premium Satin 200gsm',
    },
  ];

  /* ══════════════════════════════════════════════════════
     SPONSORED EVENTS
     ══════════════════════════════════════════════════════ */
  MN.EVENTS = [
    {
      id:      'calm-app',
      sponsor: 'Calm',
      msg:     'When the world feels loud, Calm finds the frequency.',
      cta:     'Free 7-day trial',
      url:     'https://calm.com',
      mood:    'serenity',
      color:   '#4af0c8',
    },
    {
      id:      'headspace',
      sponsor: 'Headspace',
      msg:     'The world is feeling a lot right now. Headspace helps.',
      cta:     'Start free',
      url:     'https://headspace.com',
      mood:    'neutral',
      color:   '#ff9f1c',
    },
    {
      id:      'nyt',
      sponsor: 'NYT',
      msg:     "The world's mood — and its stories — in one place.",
      cta:     'Read today',
      url:     'https://nytimes.com',
      mood:    'surprise',
      color:   '#e0e0e0',
    },
  ];

  /* ══════════════════════════════════════════════════════
     PRO TIER GATE
     ══════════════════════════════════════════════════════ */
  MN.isPro = function () {
    try { return localStorage.getItem(KEY_PRO) === 'true'; } catch (_) { return false; }
  };

  MN.PRO_FEATURES = {
    forecast:   { name: 'Mood Forecast',   desc: 'See tomorrow\'s predicted emotional weather.' },
    wrapped:    { name: 'Mood Wrapped',     desc: 'Your personal annual emotional report.' },
    aura:       { name: 'Aura Card',        desc: 'Download your mood as art.' },
    journalist: { name: 'Live Journalist',  desc: 'Real-time AI narration of global mood.' },
    waveform:   { name: '24h Waveform',     desc: 'Full 24-hour mood timeline visualization.' },
  };

  /* Check gate — returns true if allowed */
  MN.checkGate = function (featureId) {
    if (MN.isPro()) return true;
    MN.showProGate(featureId);
    return false;
  };

  MN.showProGate = function (featureId) {
    const overlay = document.getElementById('pro-overlay');
    if (!overlay) return;

    const feature = MN.PRO_FEATURES[featureId] || { name: 'Pro Feature', desc: 'Unlock all features.' };
    const nameEl = document.getElementById('pro-feature-name');
    if (nameEl) nameEl.textContent = feature.name.toUpperCase();

    const listEl = document.getElementById('pro-feature-list');
    if (listEl) {
      listEl.innerHTML = Object.values(MN.PRO_FEATURES).map(f =>
        `<div class="pro-feature-item">
          <span class="pro-feat-check">✦</span>
          <div>
            <div class="pro-feat-name">${f.name}</div>
            <div class="pro-feat-desc">${f.desc}</div>
          </div>
        </div>`
      ).join('');
    }

    overlay.classList.add('visible');
  };

  MN.closeProGate = function () {
    const overlay = document.getElementById('pro-overlay');
    if (overlay) overlay.classList.remove('visible');
  };

  MN.upgradeToPro = function () {
    /* In production: Stripe checkout. For demo: unlock immediately. */
    try { localStorage.setItem(KEY_PRO, 'true'); } catch (_) {}
    MN.closeProGate();
    if (GMR.ui) GMR.ui.toast('✦ Pro unlocked — all signals are now yours.');
    /* Re-init journalist + waveform if they were waiting */
    if (GMR.ai && GMR.ai.startJournalist) GMR.ai.startJournalist();
    if (GMR.viral && GMR.viral.initWaveform) GMR.viral.initWaveform();
  };

  /* ══════════════════════════════════════════════════════
     PRINT SHOP
     ══════════════════════════════════════════════════════ */
  MN.showPrintShop = function () {
    const overlay = document.getElementById('print-overlay');
    if (!overlay) return;

    const grid = document.getElementById('print-grid');
    if (grid) {
      grid.innerHTML = MN.PRODUCTS.map(p => `
        <div class="print-card" onclick="GMR.monetize.orderPrint('${p.id}')">
          <div class="print-card-emoji">${p.emoji}</div>
          <div class="print-card-name">${p.name}</div>
          <div class="print-card-desc">${p.desc}</div>
          <div class="print-card-meta">
            <span class="print-dims">${p.dims}</span>
            <span class="print-material">${p.material}</span>
          </div>
          <div class="print-card-price">$${p.price}</div>
          <button class="print-order-btn">Order Print</button>
        </div>
      `).join('');
    }

    overlay.classList.add('visible');
  };

  MN.closePrintShop = function () {
    const overlay = document.getElementById('print-overlay');
    if (overlay) overlay.classList.remove('visible');
  };

  MN.orderPrint = function (productId) {
    const product = MN.PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    /* In production: open Stripe checkout with product ID */
    if (GMR.ui) GMR.ui.toast(`🖨 Opening checkout for ${product.name}…`);
    /* Demo: open a mailto or Stripe link */
    setTimeout(() => {
      alert(`In production this would open Stripe checkout for:\n${product.name} — $${product.price}\n\nYour aura card data would be sent with the order.`);
    }, 400);
  };

  /* ══════════════════════════════════════════════════════
     SPONSORED EVENTS
     ══════════════════════════════════════════════════════ */
  MN._eventTimer = null;
  MN._lastEventIdx = -1;

  MN.triggerSponsoredEvent = function (idOrRandom) {
    let ev;
    if (typeof idOrRandom === 'string') {
      ev = MN.EVENTS.find(e => e.id === idOrRandom);
    } else {
      /* Rotate through events, don't repeat */
      let idx;
      do { idx = Math.floor(Math.random() * MN.EVENTS.length); }
      while (idx === MN._lastEventIdx && MN.EVENTS.length > 1);
      MN._lastEventIdx = idx;
      ev = MN.EVENTS[idx];
    }
    if (!ev) return;

    const banner = document.getElementById('event-banner');
    if (!banner) return;

    banner.innerHTML = `
      <div class="event-inner" style="border-color:${ev.color}44">
        <span class="event-sponsor" style="color:${ev.color}">${ev.sponsor}</span>
        <span class="event-msg">${ev.msg}</span>
        <a class="event-cta" href="${ev.url}" target="_blank" rel="noopener" style="color:${ev.color};border-color:${ev.color}66">${ev.cta} →</a>
        <button class="event-close" onclick="document.getElementById('event-banner').classList.remove('visible')">✕</button>
      </div>
    `;
    banner.classList.add('visible');

    clearTimeout(MN._eventTimer);
    MN._eventTimer = setTimeout(() => {
      banner.classList.remove('visible');
    }, 12000);
  };

  /* Schedule random sponsored events every ~3 minutes */
  MN._scheduleEvents = function () {
    const next = () => {
      setTimeout(() => {
        if (Math.random() < 0.4) MN.triggerSponsoredEvent();
        next();
      }, 180000 + Math.random() * 120000);
    };
    /* First event after 2 minutes */
    setTimeout(() => MN.triggerSponsoredEvent(), 120000);
    next();
  };

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */
  MN.init = function () {
    if (MN.isPro()) {
      document.body.classList.add('is-pro');
    }
    MN._scheduleEvents();
    console.log('[GMR Monetize] Init. Pro:', MN.isPro());
  };

  /* ── Expose ── */
  window.closeProGate  = () => GMR.monetize.closeProGate();
  window.upgradeToPro  = () => GMR.monetize.upgradeToPro();
  window.showPrintShop = () => GMR.monetize.showPrintShop();
  window.closePrintShop = () => GMR.monetize.closePrintShop();

})();
