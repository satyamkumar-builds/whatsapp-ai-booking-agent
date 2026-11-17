// Voice-note transcription (WhatsApp sends .ogg/opus audio).
// Pluggable: uses Groq's free-tier Whisper API when GROQ_API_KEY is set.
// Without a key, returns null and the bot politely asks the user to type instead.

async function transcribe(audioBuffer, mimeType = 'audio/ogg') {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: mimeType }), 'voice.ogg');
  form.append('model', 'whisper-large-v3');
  form.append('language', 'hi'); // Hindi-first; Hinglish speech transcribes well
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.text || null;
}

module.exports = { transcribe };
