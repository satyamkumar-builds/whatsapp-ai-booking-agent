// Hinglish intent + slot parser (rule-based V1 — no external API needed).
// Understands the way Indian parents actually speak/type:
// "mujhe kal subah station jana hai cab chahiye", "ek pizza order kar do", "doctor ka token le do"...

const INTENTS = [
  {
    name: 'cab',
    keywords: ['cab', 'taxi', 'ola', 'uber', 'auto', 'rickshaw', 'gaadi', 'gadi', 'ride'],
    verbs: ['book', 'chahiye', 'bula', 'mangwa', 'kar do', 'jana', 'jaana', 'pahuchna'],
  },
  {
    name: 'food',
    keywords: ['khana', 'pizza', 'burger', 'biryani', 'dosa', 'thali', 'order', 'bhojan',
      'nashta', 'lunch', 'dinner', 'breakfast', 'chai', 'mithaas', 'sweets', 'cake'],
    verbs: ['order', 'mangwa', 'khana hai', 'bhook', 'chahiye', 'kha', 'le aao'],
  },
  {
    name: 'movie',
    keywords: ['movie', 'film', 'ticket', 'cinema', 'show', 'picture'],
    verbs: ['book', 'chahiye', 'dekhni', 'dekhna', 'le do'],
  },
  {
    name: 'token',
    keywords: ['token', 'doctor', 'clinic', 'hospital', 'appointment', 'opd', 'dawai',
      'salon', 'queue', 'number lagana', 'parchi'],
    verbs: ['le do', 'chahiye', 'book', 'lagwa', 'dikhaana', 'dikhana'],
  },
];

function normalize(text) {
  return ' ' + String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ') + ' ';
}

function detectIntent(text) {
  const t = normalize(text);
  let best = { name: null, score: 0 };
  for (const intent of INTENTS) {
    let score = 0;
    for (const k of intent.keywords) if (t.includes(' ' + k) || t.includes(k)) score += 2;
    for (const v of intent.verbs) if (t.includes(v)) score += 1;
    if (score > best.score) best = { name: intent.name, score };
  }
  // "gaya se patna jana hai" — a route with a destination is a cab request
  if (t.includes(' se ') && /(jana|jaana)/.test(t)) return { name: 'cab', score: 3 };
  if (/\b(hi|hello|namaste|namaskar|hey)\b/.test(t) && best.score < 2) return { name: 'greeting', score: 1 };
  if (t.includes('help') || t.includes('madad') || t.includes('kya kar sakte')) return { name: 'help', score: 1 };
  return best.score >= 2 ? best : { name: null, score: 0 };
}

// --- slot extractors (best-effort, conversation asks for whatever is missing) ---

function extractNumber(text) {
  const m = String(text).match(/\b([1-9]|10)\b/);
  return m ? parseInt(m[1], 10) : null;
}

function extractTime(text) {
  const t = normalize(text);
  if (t.includes('abhi') || t.includes('turant') || t.includes('now')) return 'abhi';
  if (t.includes('kal subah')) return 'kal subah';
  if (t.includes('kal sham') || t.includes('kal shaam')) return 'kal sham';
  if (t.includes('kal')) return 'kal';
  if (t.includes('aaj sham') || t.includes('aaj shaam')) return 'aaj sham';
  if (t.includes('aaj')) return 'aaj';
  const m = t.match(/(\d{1,2})\s*(baje|am|pm)/);
  if (m) return `${m[1]} ${m[2]}`;
  if (t.includes('subah')) return 'subah';
  if (t.includes('sham') || t.includes('shaam')) return 'sham';
  return null;
}

// Very light place extraction: "X se Y jana hai", "Y ke liye cab chahiye", "Y jana hai"
function extractRoute(text) {
  const raw = String(text || '');
  const se = raw.match(/(.+?)\s+se\s+(.+?)(?:\s+jana|\s+jaana|\s+tak|\s+ke liye|$)/i);
  if (se) return { pickup: clean(se[1]), drop: clean(se[2]) };
  const keLiye = raw.match(/(.+?)\s+ke liye\s+(?:cab|taxi|ola|uber|auto|gaadi)/i);
  if (keLiye) return { pickup: null, drop: clean(keLiye[1]) };
  const dest = raw.match(/(.+?)(?:\s+jana hai|\s+jaana hai|\s+jana|\s+tak jana)/i);
  if (dest) return { pickup: null, drop: clean(dest[1]) };
  return { pickup: null, drop: null };
}

const TIME_WORDS = /^(kal subah|kal shaam|kal sham|kal|aaj shaam|aaj sham|aaj|subah|shaam|sham)\s+/i;

function clean(s) {
  if (!s) return null;
  let out = s.trim();
  out = out.replace(/^(mujhe|mere liye|please|ek|mera)\s+/i, '').trim();
  while (TIME_WORDS.test(out)) out = out.replace(TIME_WORDS, '').trim();
  out = out.replace(/^(mujhe|mere liye)\s+/i, '').trim();
  return out.length >= 2 ? out : null;
}

module.exports = { detectIntent, extractNumber, extractTime, extractRoute, normalize };
