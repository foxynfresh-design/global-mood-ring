'use strict';

const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// ── STATE ─────────────────────────────────────────────────────
let userCity = "Global", userCountry = "Earth";
let actx, mGain, drones = [], audioOn = false, curMood = 'calm';
let globeScene, globeCamera, globeRenderer, globeMesh, glowMesh;
let globeRotating = true;
let moodCounts = { joy: 0, love: 0, hope: 0, calm: 0, sad: 0, grateful: 0, angry: 0, fear: 0 };

const MOODS = {
  joy:      { h: '#F7C948', g: 'rgba(247,201,72,0.5)',   note: 261.63, poetic: "Joy ripples outward like light on still water..." },
  love:     { h: '#FF6B8A', g: 'rgba(255,107,138,0.5)',  note: 293.66, poetic: "Hearts beating in quiet unison across the globe..." },
  hope:     { h: '#7EC8FF', g: 'rgba(126,200,255,0.5)',  note: 329.63, poetic: "A silver thread of hope weaves through the dark..." },
  calm:     { h: '#5DDCB8', g: 'rgba(93,220,184,0.5)',   note: 349.23, poetic: "The world holds its breath between heartbeats..." },
  sad:      { h: '#7B9FC4', g: 'rgba(123,159,196,0.5)',  note: 220.00, poetic: "Even grief is a kind of love for what once was..." },
  grateful: { h: '#68D480', g: 'rgba(104,212,128,0.5)',  note: 311.13, poetic: "Gratitude blooms in the smallest moments of light..." }
};

// ── SMART DETECTION ───────────────────────────────────────────
// Detects mood AS THEY TYPE to change globe color in real-time
function detectMood(text) {
    const w = text.toLowerCase().trim();
    const map = {
        joy: ['happy', 'fun', 'sun', 'great', 'wow', 'good'],
        love: ['love', 'heart', 'miss', 'baby', 'sweet'],
        sad: ['sad', 'hurt', 'cry', 'dark', 'alone'],
        hope: ['hope', 'will', 'future', 'dream'],
        grateful: ['thanks', 'bless', 'kind']
    };
    for (const [m, keywords] of Object.entries(map)) {
        if (keywords.some(k => w.includes(k))) return m;
    }
    return 'calm';
}

// Add this to your input field in index.html later: oninput="handleTyping(this.value)"
window.handleTyping = (val) => {
    const detected = detectMood(val);
    updateGlobeColor(detected);
};

// ── REAL DATABASE SYNC ────────────────────────────────────────
async function fetchGlobalStats() {
    const { data, error } = await db.from('mood_signals').select('mood_type');
    if (data) {
        // Reset counts
        Object.keys(moodCounts).forEach(k => moodCounts[k] = 0);
        data.forEach(row => {
            if (moodCounts[row.mood_type] !== undefined) moodCounts[row.mood_type]++;
        });
        updateBars();
    }
}

// ── GLOBE (Simplified for space, use your existing initGlobe) ──
function initGlobe() {
    // ... (Keep your existing Three.js code here) ...
}

function updateGlobeColor(mood) {
    if (!glowMesh) return;
    const col = new THREE.Color(MOODS[mood].h);
    glowMesh.material.color = col;
    // Also update the UI color for instant feedback
    document.getElementById('send-btn').style.background = MOODS[mood].h;
}

window.submitMood = async () => {
    const inp = document.getElementById('mood-in');
    const word = inp.value.trim();
    if (!word) return;

    // Use the detected mood
    const mood = detectMood(word);
    
    // UI Update
    document.getElementById('ov-mood').textContent = mood.toUpperCase();
    document.getElementById('ov-mood').style.color = MOODS[mood].h;
    document.getElementById('overlay').classList.add('on');

    // Supabase Insert
    try {
        await db.from('mood_signals').insert([{ 
            word, 
            mood_type: mood, 
            city: userCity, 
            country: userCountry 
        }]);
        fetchGlobalStats(); // Refresh the bars immediately
    } catch(e) {}
    
    inp.value = '';
};

// ── BOOT ──────────────────────────────────────────────────────
async function boot() {
  // 1. Immediate Visual Prep
  resizeStars();
  
  // 2. Try Globe Init (Wrap in try/catch to prevent blocking)
  try {
    initGlobe();
  } catch(e) {
    console.error("Globe failed, but continuing...", e);
  }

  // 3. Try Data Fetching (Non-blocking)
  fetchGlobalStats().catch(e => console.warn("Stats failed"));

  // 4. THE LOADER BYPASS
  // This ensures the loader disappears even if the database is slow
  document.getElementById('ld-bar').style.width = '100%';
  
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('fade');
      setTimeout(() => loader.style.display = 'none', 900);
    }
  }, 500); // 0.5 second delay max

  // 5. Background Tasks
  try {
    const loc = await fetch('https://ipapi.co/json/').then(r => r.json());
    userCity = loc.city || 'Global';
    userCountry = loc.country_name || 'Earth';
  } catch(e) {
    console.warn("Location check timed out.");
  }

  setInterval(simulateFeed, 5000);
}
