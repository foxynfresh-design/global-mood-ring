'use strict';

const supabaseUrl = 'https://elffxqkhihilfmbnengx.supabase.co';
const supabaseKey = 'sb_publishable_KcAegsmUshdHvwPJJoJMJg_fbOyAono';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let userCity = "Global";
let userCountry = "Earth";

// ═══════════════════════════════════════
// VIRAL: AUTO-DETECT LOCATION
// ═══════════════════════════════════════
async function autoDetectLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userCity = data.city || "Global";
        userCountry = data.country_name || "Earth";
        console.log(`Detected location: ${userCity}, ${userCountry}`);
    } catch (e) {
        console.warn("Location detection failed.");
    }
}

// ═══════════════════════════════════════
// VIRAL: SHARE MOOD CARD (IMAGE GENERATION)
// ═══════════════════════════════════════
function shareMood() {
    const captureArea = document.getElementById('capture-area');
    html2canvas(captureArea).then(canvas => {
        const link = document.createElement('a');
        link.download = `Global-Mood-${userCity}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

// ... Paste the rest of the original logic (M, MK, CD, CITIES, drawMap, etc.) here.
// I have updated the submitMood function below to use the detection.

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
    document.getElementById('ov-wait').textContent = 'Syncing pulse with ' + userCity + '...';
    ov.classList.add('on');

    const mood = fbClass(word);
    const reflection = FB[mood];

    try {
        await supabaseClient.from('mood_signals').insert([
            { word: word, mood_type: mood, city: finalLocation, country: userCountry }
        ]);
    } catch (e) { console.error(e); }

    const mc = M[mood];
    document.documentElement.style.setProperty('--mc', mc.h);
    document.documentElement.style.setProperty('--mg', mc.g);
    document.getElementById('ov-mood').textContent = mood.toUpperCase();
    document.getElementById('ov-ref').textContent = reflection;
    document.getElementById('ov-wait').textContent = '';
    if (audioOn) playChordSwell();
}

// ... Rest of original map/canvas functions go here ...
