// WhatsApp AI Agent — webhook server for the Meta WhatsApp Cloud API (official).
// Zero dependencies (Node built-in http). Run: node server.js
//
// Env for going live:
//   WA_VERIFY_TOKEN   any string you also paste in the Meta app webhook config
//   WA_ACCESS_TOKEN   Meta app access token
//   WA_PHONE_ID       the bot number's phone_number_id from the Meta console
//   GROQ_API_KEY      (optional) free-tier key for voice-note transcription
//
// Local check without Meta: POST /simulate { "from": "demo", "text": "..." }

const http = require('http');
const { handleMessage } = require('./src/bot');
const { transcribe } = require('./src/stt');

const PORT = process.env.PORT || 3000;

async function sendWhatsApp(to, body) {
  const token = process.env.WA_ACCESS_TOKEN;
  const phoneId = process.env.WA_PHONE_ID;
  if (!token || !phoneId) { console.log('[dry-run reply]', to, '=>', body); return; }
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
}

async function fetchMedia(mediaId) {
  const token = process.env.WA_ACCESS_TOKEN;
  const meta = await (await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })).json();
  const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
  return Buffer.from(await res.arrayBuffer());
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // Meta webhook verification
  if (req.method === 'GET' && url.pathname === '/webhook') {
    const ok = url.searchParams.get('hub.verify_token') === process.env.WA_VERIFY_TOKEN;
    res.writeHead(ok ? 200 : 403, { 'Content-Type': 'text/plain' });
    return res.end(ok ? url.searchParams.get('hub.challenge') : 'no');
  }

  if (req.method === 'POST' && url.pathname === '/simulate') {
    let raw = ''; req.on('data', c => raw += c);
    req.on('end', () => {
      const { from = 'demo', text = '' } = JSON.parse(raw || '{}');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply: handleMessage(from, text) }));
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/webhook') {
    let raw = ''; req.on('data', c => raw += c);
    req.on('end', async () => {
      res.writeHead(200); res.end('ok');
      try {
        const data = JSON.parse(raw || '{}');
        const msg = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!msg) return;
        let text = msg.text?.body || '';
        if (msg.type === 'audio') {
          const audio = await fetchMedia(msg.audio.id);
          text = (await transcribe(audio)) || '';
          if (!text) {
            return sendWhatsApp(msg.from, 'Aawaz saaf nahi aayi 🙏 — zara dobara boliye, ya likh kar bhej dijiye.');
          }
        }
        if (text) await sendWhatsApp(msg.from, handleMessage(msg.from, text));
      } catch (e) { console.error('webhook error', e); }
    });
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => console.log(`WhatsApp AI Agent listening on :${PORT}`));
