/* ══════════════════════════════════════════════════════════
   SUPABASE-CONFIG.JS — Credentials & Table Mapping
   !! ADD THIS FILE TO .gitignore !!
   Load this BEFORE main.js in index.html
   ══════════════════════════════════════════════════════════ */

window.GMR = window.GMR || {};

GMR.SUPABASE_URL = 'https://elffxqkhihilfmbnengx.supabase.co';
GMR.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

/* Table configuration — matches your mood_signals schema */
GMR.DB = {
  table:   'mood_signals',
  columns: {
    word:       'word',
    mood_type:  'mood_type',
    city:       'city',
    country:    'country',
    created_at: 'created_at',
  },
};