// Conversation brain: per-user sessions, slot filling, Hinglish replies.
// Speaks the simple Hindi-Roman parents use. One question at a time.

const { detectIntent, extractNumber, extractTime, extractRoute } = require('./intents');
const links = require('./links');

const sessions = new Map(); // wa_id -> { flow, slots, step }

const WELCOME =
  'Namaste! 🙏 Main aapka WhatsApp sahayak hoon.\n\n' +
  'Bas boliye ya likhiye, jaise:\n' +
  '🚕 "Mujhe kal subah station ke liye cab chahiye"\n' +
  '🍛 "Ek biryani order kar do"\n' +
  '🎬 "Kal movie ke 2 ticket chahiye"\n' +
  '🏥 "Doctor ka token le do"\n\n' +
  'Main sab taiyaari karke dunga — aapko bas aakhir me ek baar tap karna hai.';

function getSession(id) {
  if (!sessions.has(id)) sessions.set(id, { flow: null, slots: {}, step: 0 });
  return sessions.get(id);
}

function reset(s) { s.flow = null; s.slots = {}; s.step = 0; }

function handleMessage(waId, text) {
  const s = getSession(waId);
  const t = String(text || '').trim();

  if (/^(cancel|band karo|rehne do|stop|nahi chahiye)$/i.test(t) && s.flow) {
    reset(s);
    return 'Theek hai, band kar diya. Kuch aur chahiye ho to bas bol dijiye. 🙏';
  }

  // Continuing an active flow beats starting a new one.
  if (s.flow) return continueFlow(s, t);

  const { name } = detectIntent(t);
  switch (name) {
    case 'greeting': return WELCOME;
    case 'help': return WELCOME;
    case 'cab': return startCab(s, t);
    case 'food': return startFood(s, t);
    case 'movie': return startMovie(s, t);
    case 'token': return startToken(s, t);
    default:
      return 'Samajh nahi aaya 🙏 — zara dusre shabdon me boliye.\n\n' +
        'Main cab 🚕, khana 🍛, movie ticket 🎬 aur doctor ka token 🏥 — in chaar kaam me madad kar sakta hoon.';
  }
}

// ---------------- CAB ----------------
function startCab(s, t) {
  s.flow = 'cab';
  const route = extractRoute(t);
  s.slots.pickup = route.pickup;
  s.slots.drop = route.drop;
  s.slots.time = extractTime(t);
  return continueFlow(s, null);
}

function continueFlow(s, t) {
  if (s.flow === 'cab') {
    if (t && s.step === 1 && !s.slots.drop) s.slots.drop = t;
    if (t && s.step === 2 && !s.slots.time) s.slots.time = t;
    if (!s.slots.drop) { s.step = 1; return 'Kahan jana hai? Jagah ka naam boliye (jaise: Gaya Station, Bodh Gaya, Patna).'; }
    if (!s.slots.time) { s.step = 2; return 'Kab chahiye cab? (abhi / aaj sham / kal subah — aise boliye)'; }
    const url = links.uberLink(s.slots);
    const done =
      `Ho gaya taiyaar! 🚕\n\n` +
      (s.slots.pickup ? `📍 Pickup: ${s.slots.pickup}\n` : '📍 Pickup: aapki maujooda jagah\n') +
      `🏁 Drop: ${s.slots.drop}\n🕐 Samay: ${s.slots.time}\n\n` +
      `Neeche wale link par ek baar tap kijiye — Uber khul jayega, sab bhara hua milega. Bas "Confirm" dabana hai:\n${url}`;
    reset(s);
    return done;
  }

  if (s.flow === 'food') {
    if (t && s.step === 1 && !s.slots.item) s.slots.item = t;
    if (!s.slots.item) { s.step = 1; return 'Kya khana hai? Khane ka naam boliye (jaise: biryani, pizza, dosa, thali).'; }
    const done =
      `Ho gaya taiyaar! 🍛\n\n🔎 "${s.slots.item}" ke best options in dono apps me khule milenge — jo pasand aaye, tap karke order kar dijiye:\n\n` +
      `Zomato: ${links.zomatoLink(s.slots)}\nSwiggy: ${links.swiggyLink(s.slots)}`;
    reset(s);
    return done;
  }

  if (s.flow === 'movie') {
    if (t && s.step === 1) { const n = extractNumber(t); if (n) s.slots.tickets = n; }
    if (t && s.step === 2 && !s.slots.when) s.slots.when = t;
    if (!s.slots.tickets) { s.step = 1; return 'Kitne ticket chahiye? (1, 2, 3... boliye)'; }
    if (!s.slots.when) { s.step = 2; return 'Kab ki movie dekhni hai? (aaj / kal / sham ko — aise boliye)'; }
    const done =
      `Ho gaya taiyaar! 🎬\n\n🎟️ Ticket: ${s.slots.tickets} · Samay: ${s.slots.when}\n\n` +
      `Is link par tap kijiye — BookMyShow khul jayega, show chun kar seat book kar dijiye:\n${links.bookMyShowLink({})}`;
    reset(s);
    return done;
  }

  if (s.flow === 'token') {
    if (t && s.step === 1 && !s.slots.place) s.slots.place = t;
    if (!s.slots.place) { s.step = 1; return 'Kis doctor/clinic ya salon ka token chahiye? Naam boliye.'; }
    const done =
      `Ho gaya taiyaar! 🏥\n\nLine Free India par "${s.slots.place}" search karke token le lijiye — ghar baithe number lagega, baari aane par hi jana padega, line me khada nahi hona padega:\n${links.lineFreeIndiaLink()}`;
    reset(s);
    return done;
  }

  return WELCOME;
}

function startFood(s, t) {
  s.flow = 'food';
  const m = t.match(/(?:ek|ek plate|order kar do|mangwa do|chahiye)\s+(.+)/i) || t.match(/(.+?)\s+(?:order|mangwa|chahiye)/i);
  // light cleanup: keep the dish words, drop filler verbs
  let item = null;
  const known = ['biryani', 'pizza', 'burger', 'dosa', 'thali', 'cake', 'paneer', 'chicken', 'momos', 'chowmein', 'samosa', 'idli', 'pav bhaji'];
  for (const k of known) if (t.toLowerCase().includes(k)) { item = k; break; }
  if (!item && m) item = m[1].trim();
  s.slots.item = item;
  return continueFlow(s, null);
}

function startMovie(s, t) {
  s.flow = 'movie';
  s.slots.tickets = extractNumber(t);
  s.slots.when = extractTime(t);
  return continueFlow(s, null);
}

function startToken(s, t) {
  s.flow = 'token';
  s.slots.place = null;
  return continueFlow(s, null);
}

module.exports = { handleMessage };
