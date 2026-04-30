/* ══════════════════════════════════════════════════════════
   CONFIG.JS — Global Mood Ring
   Central config, mood dictionary, city data, constants
   ══════════════════════════════════════════════════════════ */

window.GMR = window.GMR || {};

/* ── Supabase ── */
GMR.SB_URL  = 'https://elffxqkhihilfmbnengx.supabase.co';
GMR.SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZmZ4cWtoaWhpbGZtYm5lbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTYxNTMsImV4cCI6MjA5Mjk5MjE1M30.xXn9k752Qk3oIGqU1GkrgryXNxVOPPU9ECX2CbDMHhE';

/* ── Mood Dictionary ── */
GMR.MOODS = {
  happy:       {t:'joy',       c:'#ffd166', e:'☀️'},
  joyful:      {t:'joy',       c:'#ffd166', e:'🌟'},
  excited:     {t:'joy',       c:'#ff9f1c', e:'⚡'},
  elated:      {t:'joy',       c:'#ffbf69', e:'✨'},
  bliss:       {t:'joy',       c:'#ffd166', e:'🌈'},
  cheerful:    {t:'joy',       c:'#ffe066', e:'😄'},
  euphoric:    {t:'joy',       c:'#ffc300', e:'🎉'},
  grateful:    {t:'joy',       c:'#ffaa44', e:'🙏'},
  hopeful:     {t:'joy',       c:'#ffc966', e:'🌅'},
  proud:       {t:'joy',       c:'#ffa500', e:'🦁'},
  hope:        {t:'joy',       c:'#7ec8e3', e:'🌅'},
  sad:         {t:'sadness',   c:'#4895ef', e:'🌊'},
  lonely:      {t:'sadness',   c:'#3a86ff', e:'🌙'},
  melancholy:  {t:'sadness',   c:'#4361ee', e:'💙'},
  grief:       {t:'sadness',   c:'#2d3a8c', e:'🫧'},
  nostalgic:   {t:'sadness',   c:'#5577dd', e:'🕯️'},
  heartbroken: {t:'sadness',   c:'#3a6bd6', e:'💔'},
  lost:        {t:'sadness',   c:'#3060cc', e:'🌫️'},
  angry:       {t:'anger',     c:'#ef233c', e:'🔥'},
  rage:        {t:'anger',     c:'#d62828', e:'💢'},
  frustrated:  {t:'anger',     c:'#f4433c', e:'😤'},
  furious:     {t:'anger',     c:'#c1121f', e:'🌋'},
  bitter:      {t:'anger',     c:'#e63946', e:'😠'},
  anxious:     {t:'fear',      c:'#9b5de5', e:'🌀'},
  scared:      {t:'fear',      c:'#7b2d8b', e:'👁️'},
  nervous:     {t:'fear',      c:'#b57bee', e:'🌪️'},
  paranoid:    {t:'fear',      c:'#6a0dad', e:'🕷️'},
  overwhelmed: {t:'fear',      c:'#8338ec', e:'💫'},
  calm:        {t:'serenity',  c:'#4af0c8', e:'🌿'},
  peaceful:    {t:'serenity',  c:'#56cfe1', e:'🍃'},
  zen:         {t:'serenity',  c:'#2ec4b6', e:'☯️'},
  serene:      {t:'serenity',  c:'#80ffdb', e:'🌊'},
  content:     {t:'serenity',  c:'#48cae4', e:'😌'},
  balanced:    {t:'serenity',  c:'#4cc9f0', e:'⚖️'},
  love:        {t:'love',      c:'#ff6b9d', e:'💗'},
  romantic:    {t:'love',      c:'#ff4d8d', e:'🌹'},
  tender:      {t:'love',      c:'#ff85a1', e:'🫶'},
  adoration:   {t:'love',      c:'#ff5c8a', e:'💖'},
  surprised:   {t:'surprise',  c:'#f77f00', e:'🎆'},
  amazed:      {t:'surprise',  c:'#fcbf49', e:'🌠'},
  shocked:     {t:'surprise',  c:'#f4a261', e:'😲'},
  awestruck:   {t:'surprise',  c:'#e9c46a', e:'🤩'},
  bored:       {t:'neutral',   c:'#7a8fb5', e:'😐'},
  confused:    {t:'neutral',   c:'#a8b2cc', e:'🤔'},
  tired:       {t:'neutral',   c:'#6c7a9c', e:'😴'},
  neutral:     {t:'neutral',   c:'#4af0c8', e:'◌'},
  numb:        {t:'neutral',   c:'#8e8c99', e:'😶'},
};

/* ── Type Colors ── */
GMR.TYPE_COLOR = {
  joy:      '#ffd166',
  sadness:  '#4895ef',
  anger:    '#ef233c',
  fear:     '#9b5de5',
  serenity: '#4af0c8',
  love:     '#ff6b9d',
  surprise: '#f77f00',
  neutral:  '#7a8fb5',
};

/* ── Audio Frequencies ── */
GMR.AUDIO_FREQS = {
  joy:      [261.63, 329.63, 392.00, 523.25],
  sadness:  [55.00,  110.00, 146.83, 174.61],
  anger:    [65.41,  130.81, 155.56, 207.65],
  fear:     [73.42,  110.00, 164.81, 196.00],
  serenity: [174.61, 220.00, 261.63, 349.23],
  love:     [196.00, 246.94, 293.66, 392.00],
  surprise: [293.66, 369.99, 440.00, 587.33],
  neutral:  [55.00,  110.00, 146.83, 220.00],
};

/* ── Poetic Sentences per type ── */
GMR.POETIC_MAP = {
  joy:      'The world exhales in golden frequencies today.',
  sadness:  'Rain falls everywhere at once, and no one is alone.',
  anger:    'The earth remembers every injustice, and hums low.',
  fear:     'The atmosphere crackles with ten thousand unspoken questions.',
  serenity: 'The planet holds its breath between heartbeats.',
  love:     'Seven billion hearts tuning to the same frequency.',
  surprise: 'Every clock runs fast today; no one minds.',
  neutral:  'Silence between stations, the signal searching.',
};

/* ── World Cities ── */
GMR.WORLD_CITIES = [
  {name:'Rome',       lat:41.90,  lon:12.50,  country:'Italy',     mood:'serenity', moodKey:'serene',   sentence:'The eternal stones remember what the living dare to dream.',           keywords:'speranza, rinnovamento, storia, passeggiata'},
  {name:'Milan',      lat:45.47,  lon:9.19,   country:'Italy',     mood:'joy',      moodKey:'excited',  sentence:'Steel towers catch the morning light like a city mid-breath.',           keywords:'moda, finanza, innovazione, design, aperitivo'},
  {name:'Naples',     lat:40.85,  lon:14.27,  country:'Italy',     mood:'love',     moodKey:'love',     sentence:'Love here is louder than the sea, older than the volcano.',              keywords:'amore, famiglia, pizza, vesuvio, musica'},
  {name:'Florence',   lat:43.77,  lon:11.25,  country:'Italy',     mood:'joy',      moodKey:'grateful', sentence:'Beauty made stone teaches the heart a slower kind of joy.',              keywords:'arte, ringraziamento, bellezza, cultura, vino'},
  {name:'Venice',     lat:45.44,  lon:12.32,  country:'Italy',     mood:'serenity', moodKey:'calm',     sentence:'The water forgives the city everything, quietly, twice a day.',          keywords:'silenzio, acqua, laguna, carnevale, pace'},
  {name:'New York',   lat:40.71,  lon:-74.01, country:'USA',       mood:'joy',      moodKey:'excited',  sentence:'Eight million frequencies playing the same restless chord.',             keywords:'hustle, dreams, pizza, subway, ambition'},
  {name:'Los Angeles',lat:34.05,  lon:-118.24,country:'USA',       mood:'joy',      moodKey:'hopeful',  sentence:'The sun sets on ten thousand auditions, daily.',                         keywords:'dreams, sun, traffic, culture, optimism'},
  {name:'London',     lat:51.51,  lon:-0.13,  country:'UK',        mood:'serenity', moodKey:'calm',     sentence:'Grey drizzle, underground rumble, a nation in patient queue.',           keywords:'resilience, tea, underground, irony, rain'},
  {name:'Paris',      lat:48.86,  lon:2.35,   country:'France',    mood:'love',     moodKey:'romantic', sentence:'Every boulevard an argument, every bridge a love letter.',               keywords:'amour, café, grève, lumière, métro'},
  {name:'Berlin',     lat:52.52,  lon:13.40,  country:'Germany',   mood:'joy',      moodKey:'excited',  sentence:'History and techno in the same breath, every weekend.',                  keywords:'Techno, Geschichte, Freiheit, Wandel'},
  {name:'Madrid',     lat:40.42,  lon:-3.70,  country:'Spain',     mood:'joy',      moodKey:'joyful',   sentence:'Midnight dinner is not late here — it is liturgy.',                     keywords:'fiesta, fútbol, alegría, sol, noche'},
  {name:'Tokyo',      lat:35.68,  lon:139.69, country:'Japan',     mood:'serenity', moodKey:'zen',      sentence:'Ten million people moving in synchronized silence.',                     keywords:'静寂, 電車, 礼儀, 桜, 秩序'},
  {name:'Beijing',    lat:39.91,  lon:116.39, country:'China',     mood:'joy',      moodKey:'excited',  sentence:'A capital building its next century on top of the last.',                keywords:'创新, 历史, 发展, 文化, 进步'},
  {name:'Mumbai',     lat:19.08,  lon:72.88,  country:'India',     mood:'joy',      moodKey:'excited',  sentence:'Heat, chai, and ambition steaming from every window.',                   keywords:'Bollywood, सपने, रफ्तार'},
  {name:'São Paulo',  lat:-23.55, lon:-46.63, country:'Brazil',    mood:'joy',      moodKey:'excited',  sentence:'The city that never declared a speed limit on anything.',                keywords:'correria, samba, negócios, trânsito'},
  {name:'Cairo',      lat:30.04,  lon:31.24,  country:'Egypt',     mood:'fear',     moodKey:'anxious',  sentence:'Ancient river, modern current — both refuse to slow down.',              keywords:'تاريخ, نيل, حضارة, تحول'},
  {name:'Lagos',      lat:6.52,   lon:3.38,   country:'Nigeria',   mood:'joy',      moodKey:'excited',  sentence:'The energy here has never considered being quiet.',                       keywords:'hustle, Afrobeats, resilience, color'},
  {name:'Istanbul',   lat:41.01,  lon:28.98,  country:'Turkey',    mood:'fear',     moodKey:'nervous',  sentence:'Two continents hold their breath and press together.',                   keywords:'Boğaz, tarih, doğu, batı, köprü'},
  {name:'Sydney',     lat:-33.87, lon:151.21, country:'Australia', mood:'serenity', moodKey:'serene',   sentence:'The harbour teaches the art of the unhurried morning.',                  keywords:'surf, mate, sun, nature, easy'},
  {name:'Seoul',      lat:37.57,  lon:126.98, country:'S. Korea',  mood:'joy',      moodKey:'excited',  sentence:'Sunrise smells like coffee and firmware updates.',                       keywords:'K-pop, 기술, 희망, 야망'},
  {name:'Mexico City',lat:19.43,  lon:-99.13, country:'Mexico',    mood:'love',     moodKey:'love',     sentence:'Twelve million people cooking love into the altitude.',                  keywords:'familia, tacos, amor, cultura, altura'},
  {name:'Nairobi',    lat:-1.29,  lon:36.82,  country:'Kenya',     mood:'joy',      moodKey:'hopeful',  sentence:'Silicon Savannah: where innovation and acacia trees grow together.',    keywords:'matumaini, teknolojia, nguvu, safari'},
  {name:'Bangkok',    lat:13.76,  lon:100.50, country:'Thailand',  mood:'serenity', moodKey:'peaceful', sentence:'Traffic and temple bells are not opposites here.',                       keywords:'สงบ, วัด, อาหาร, รอยยิ้ม'},
  {name:'Buenos Aires',lat:-34.60,lon:-58.38, country:'Argentina', mood:'fear',     moodKey:'anxious',  sentence:'The economy trembles; the tango does not.',                             keywords:'tango, crisis, orgullo, familia'},
  {name:'Amsterdam',  lat:52.37,  lon:4.90,   country:'Netherlands',mood:'serenity',moodKey:'peaceful', sentence:'Practical beauty has always been their national religion.',               keywords:'tolerantie, fietsen, water, vrijheid'},
  {name:'Kyoto',      lat:35.01,  lon:135.77, country:'Japan',     mood:'serenity', moodKey:'serene',   sentence:'Ancient light teaches patience to everything it touches.',               keywords:'静寂, 庭, 禅, 桜, 茶'},
  {name:'Dubai',      lat:25.20,  lon:55.27,  country:'UAE',       mood:'surprise', moodKey:'amazed',   sentence:'The desert built a city from sheer will and glass.',                    keywords:'ambition, luxury, future, sky'},
  {name:'Cape Town',  lat:-33.93, lon:18.42,  country:'S. Africa', mood:'joy',      moodKey:'hopeful',  sentence:'Where two oceans meet, hope insists on a third direction.',              keywords:'ubuntu, beauty, mountains, sea'},
  {name:'Toronto',    lat:43.65,  lon:-79.38, country:'Canada',    mood:'serenity', moodKey:'calm',     sentence:'Politeness here is not passivity — it is a philosophy.',                keywords:'kindness, diversity, winter, hockey'},
  {name:'Singapore',  lat:1.35,   lon:103.82, country:'Singapore', mood:'serenity', moodKey:'balanced', sentence:'Order and heat — an unlikely partnership that works.',                  keywords:'efficiency, gardens, hawker, future'},
];

/* ── Map Dimensions ── */
GMR.MAP_W = 1400;
GMR.MAP_H = 700;

GMR.mX = (lon) => (lon + 180) * (GMR.MAP_W / 360);
GMR.mY = (lat) => {
  const r = Math.PI / 180, latR = lat * r;
  const y = Math.log(Math.tan(Math.PI / 4 + latR / 2));
  return (GMR.MAP_H / 2) - (GMR.MAP_W * y / (2 * Math.PI));
};

/* ── Country Shapes ── */
GMR.COUNTRY_SHAPES = {
  USA: {pts:[[235,140],[310,140],[330,155],[335,175],[310,195],[295,190],[280,185],[265,185],[245,175],[230,170],[230,155]], mood:'joy',     sentence:'The engine roars in every direction at once.',           keywords:'freedom, hustle, innovation, anxiety'},
  CAN: {pts:[[225,70],[330,70],[335,110],[325,125],[310,140],[295,130],[280,130],[250,135],[235,140],[230,120],[225,90]],   mood:'serenity',sentence:'Apologies and gratitude are the national currencies.',   keywords:'kindness, nature, winter, hockey'},
  MEX: {pts:[[235,175],[280,185],[285,200],[270,215],[255,220],[240,210],[230,195],[235,180]],                              mood:'love',    sentence:'Love here is cooked into everything, slowly.',           keywords:'familia, amor, cultura, color'},
  BRA: {pts:[[330,220],[390,205],[420,230],[415,260],[395,290],[370,295],[345,280],[330,260],[320,245],[325,225]],          mood:'joy',     sentence:'Even sorrow here eventually joins the samba.',           keywords:'alegria, samba, futebol, natureza'},
  ARG: {pts:[[330,280],[355,280],[360,310],[345,345],[330,355],[315,340],[315,310],[320,290]],                              mood:'fear',    sentence:'The economy trembles; the tango does not.',              keywords:'tango, crisis, orgullo, familia'},
  GBR: {pts:[[490,100],[503,95],[508,108],[500,120],[490,125],[483,115],[486,103]],                                         mood:'serenity',sentence:'Grey skies teach patience; tea teaches everything else.',keywords:'resilience, tradition, irony, rain'},
  FRA: {pts:[[488,125],[505,120],[515,130],[510,145],[495,150],[484,142],[484,130]],                                        mood:'love',    sentence:'Paris exhales romance even through its arguments.',       keywords:'amour, grève, culture, vin, liberté'},
  ESP: {pts:[[478,145],[510,142],[515,158],[495,165],[478,162],[472,153]],                                                  mood:'joy',     sentence:'The evening lasts forever, and no one minds.',           keywords:'alegría, siesta, fútbol, fiesta'},
  DEU: {pts:[[505,112],[525,110],[530,125],[520,135],[505,135],[498,125],[500,115]],                                        mood:'neutral', sentence:'Order is its own kind of comfort, worn smooth with use.',keywords:'Ordnung, Arbeit, Effizienz, Ruhe'},
  ITA: {pts:[[510,135],[525,133],[530,145],[528,160],[518,170],[510,160],[507,148],[508,138]],                              mood:'joy',     sentence:'Between ruins and renaissance, Italians choose both.',   keywords:'speranza, arte, famiglia, bellezza'},
  POL: {pts:[[525,105],[550,102],[555,115],[540,122],[525,120],[518,112]],                                                  mood:'joy',     sentence:'History taught them to rebuild; they became experts.',   keywords:'nadzieja, pamięć, kultura'},
  SWE: {pts:[[510,75],[525,70],[530,85],[525,100],[515,108],[505,100],[505,80]],                                            mood:'serenity',sentence:'Silence here is not loneliness — it is interior design.',keywords:'lugn, natur, frihet, design, lagom'},
  UKR: {pts:[[545,112],[575,108],[580,125],[560,132],[540,130],[535,118]],                                                  mood:'sadness', sentence:'Courage is not the absence of sorrow, but its navigator.',keywords:'сила, смуток, надія, боротьба'},
  RUS: {pts:[[545,65],[720,55],[740,80],[730,105],[710,115],[680,120],[620,115],[580,108],[545,112],[538,90],[540,70]],      mood:'neutral', sentence:'Winter teaches the soul to wait for things that may not come.',keywords:'терпение, зима, история, сила'},
  TUR: {pts:[[555,148],[595,143],[605,155],[595,165],[565,168],[550,160],[550,150]],                                        mood:'fear',    sentence:'East and west pull at each other gently, always.',       keywords:'köprü, tarih, değişim'},
  EGY: {pts:[[545,165],[575,162],[580,185],[565,195],[542,193],[535,178],[538,167]],                                        mood:'fear',    sentence:'Ancient stones stand calm while the present negotiates.',keywords:'تاريخ, قلق, أمل, حضارة'},
  NGA: {pts:[[500,205],[530,200],[535,220],[520,235],[498,232],[490,218]],                                                  mood:'joy',     sentence:'Energy so dense it generates its own gravity.',          keywords:'hustle, music, Afrobeats, resilience'},
  ZAF: {pts:[[530,270],[570,265],[575,295],[555,310],[530,305],[515,288],[520,272]],                                        mood:'joy',     sentence:'A nation learning to hold its own contradictions.',      keywords:'ubuntu, change, beauty, resilience'},
  CHN: {pts:[[720,120],[790,115],[810,140],[800,170],[775,185],[745,190],[720,175],[705,155],[705,135],[715,122]],           mood:'joy',     sentence:'A billion futures are being written simultaneously.',    keywords:'创新, 发展, 家庭, 梦想, 速度'},
  JPN: {pts:[[800,120],[818,115],[825,128],[820,140],[808,145],[798,138],[795,125]],                                        mood:'serenity',sentence:'Silence here is not emptiness — it is craft.',         keywords:'静寂, 礼儀, 桜, 革新, 調和'},
  IND: {pts:[[660,158],[695,152],[705,172],[695,205],[675,220],[655,215],[638,195],[638,170],[648,158]],                    mood:'joy',     sentence:'Chaos and color conspire toward something magnificent.',  keywords:'आशा, परिवार, विविधता, संस्कृति'},
  KOR: {pts:[[788,130],[800,128],[803,140],[795,145],[785,142],[782,133]],                                                  mood:'joy',     sentence:'The future arrives here first, always slightly out of breath.',keywords:'혁신, 빠름, 문화, K-pop'},
  AUS: {pts:[[760,255],[830,250],[850,275],[845,310],[820,325],[785,325],[755,305],[745,280],[750,260]],                    mood:'serenity',sentence:'The continent breathes in geological time.',             keywords:'mate, nature, surf, space, easy'},
};

/* ── Continent strokes for globe ── */
GMR.CONTINENT_STROKES = [
  [[70,-140],[60,-140],[55,-130],[50,-125],[45,-124],[40,-124],[35,-120],[30,-117],[25,-110],[20,-105],[15,-92],[10,-85],[8,-77],[10,-75],[15,-83],[20,-87],[25,-90],[30,-90],[35,-88],[40,-76],[45,-64],[50,-55],[55,-60],[60,-65],[65,-70],[70,-75],[72,-80],[70,-95],[70,-110],[70,-125],[70,-140]],
  [[10,-75],[5,-77],[0,-78],[-5,-80],[-10,-75],[-15,-75],[-20,-70],[-25,-70],[-30,-72],[-35,-72],[-40,-65],[-45,-65],[-50,-69],[-55,-68],[-55,-64],[-50,-58],[-45,-52],[-40,-50],[-35,-54],[-30,-50],[-25,-48],[-20,-40],[-15,-38],[-10,-37],[-5,-35],[0,-50],[5,-52],[10,-62],[10,-75]],
  [[36,36],[38,27],[40,22],[42,18],[44,14],[46,12],[44,8],[42,3],[44,-1],[44,-8],[42,-9],[38,-9],[36,-6],[36,0],[36,10],[36,25],[36,36]],
  [[55,14],[58,8],[58,5],[58,7],[60,5],[62,6],[64,8],[65,14],[65,22],[60,22],[58,18],[55,14]],
  [[57,8],[58,7],[60,5],[62,6],[64,8],[65,15],[68,15],[70,24],[72,26],[70,28],[68,20],[65,16],[62,6]],
  [[37,10],[35,10],[30,32],[25,37],[20,38],[15,42],[10,44],[5,42],[0,42],[-5,40],[-10,38],[-15,35],[-20,35],[-25,33],[-30,30],[-34,26],[-34,18],[-28,16],[-20,13],[-15,12],[-10,16],[-5,10],[0,8],[5,2],[10,-1],[15,-17],[20,-17],[25,-15],[30,-10],[37,10]],
  [[36,36],[40,36],[42,42],[45,50],[50,60],[55,68],[60,72],[65,72],[70,68],[72,100],[68,140],[60,140],[55,130],[50,140],[45,135],[40,128],[35,120],[30,122],[25,120],[20,110],[15,108],[10,104],[5,100],[5,95],[10,80],[15,73],[20,72],[22,68],[25,62],[25,58],[30,48],[35,36],[36,36]],
  [[-15,130],[-12,136],[-14,136],[-20,148],[-25,153],[-30,153],[-35,150],[-38,146],[-38,140],[-34,136],[-30,114],[-22,114],[-18,122],[-15,128],[-15,130]],
  [[31,130],[34,132],[36,136],[38,140],[42,140],[44,145],[42,142],[40,140],[36,136],[34,130],[31,130]],
];

/* ── Live feed simulation words ── */
GMR.FEED_WORDS = [
  ['speranza','joy'],['amore','love'],['paura','fear'],['bellezza','joy'],['silenzio','serenity'],
  ['rabbia','anger'],['pace','serenity'],['eccitazione','joy'],['hope','joy'],['love','love'],
  ['fear','fear'],['joy','joy'],['peace','serenity'],['rage','anger'],['beauty','joy'],
  ['numb','neutral'],['fire','anger'],['amour','love'],['espoir','joy'],['tristesse','sadness'],
  ['vida','joy'],['家族','love'],['平和','serenity'],['希望','joy'],['怒り','anger'],
  ['Liebe','love'],['Hoffnung','joy'],['Angst','fear'],['Freude','joy'],['сила','anger'],
  ['надежда','joy'],['тишина','serenity'],['радость','joy'],['حب','love'],['أمل','joy'],
  ['shukrani','joy'],['upole','serenity'],['hasira','anger'],['furaha','joy'],
];

/* ── Helper: escape HTML ── */
GMR.esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ── Helper: detect mood fallback ── */
GMR.detectFallback = (w) => {
  w = w.toLowerCase();
  if (/happ|joy|glad|cheer/.test(w)) return 'joy';
  if (/sad|cry|lone|griev/.test(w))  return 'sadness';
  if (/ang|rage|mad|furi/.test(w))   return 'anger';
  if (/fear|scar|anxi|nerv/.test(w)) return 'fear';
  if (/love|care|warm|kis/.test(w))  return 'love';
  if (/calm|peace|zen|stil/.test(w)) return 'serenity';
  if (/wow|amaz|surp|shock/.test(w)) return 'surprise';
  return 'neutral';
};

GMR.inferMood = (key) => {
  if (!key || key.length < 3) return null;
  const match = Object.keys(GMR.MOODS).find(w => w.includes(key));
  return match ? GMR.MOODS[match] : null;
};

console.log('[GMR] Config loaded');
