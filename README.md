# WhatsApp AI Agent — "Bolke Book Karo" (V1 demo)

Voice/text WhatsApp assistant for parents & elders who live on WhatsApp but
struggle with Uber / Zomato / BookMyShow apps. Inspired by @why_singh_why's
concept reel (Nov 2026). Founder: Satyam Kumar. Budget: ₹0.

## What it does (V1)
- Parent sends a WhatsApp message (text now, voice notes once STT key is set):
  "mujhe kal subah station ke liye cab chahiye", "ek biryani order kar do",
  "kal movie ke 2 ticket chahiye", "doctor ka token le do"
- Bot understands Hinglish, asks for any missing detail (one question at a
  time), and replies with ONE pre-filled link — Uber / Zomato+Swiggy /
  BookMyShow — or straight into Line Free India for clinic/salon tokens.
- The user only taps the final Confirm in the app. No new app to learn.

## Honest limits (by design — told to the founder upfront)
- Uber/Zomato/BookMyShow give NO public booking APIs to indie builders, and
  payment/OTP always belong to the user's own account. So no bot can complete
  those bookings end-to-end. V1 removes ~90% of the friction (one tap left).
- Line Free India is our own platform — tokens there CAN become fully
  in-chat bookings in V2 via the Firebase backend.

## Tech
- Node.js (zero dependencies), WhatsApp Cloud API (Meta official, free tier:
  1,000 free service conversations/month)
- src/intents.js — Hinglish intent + slot parser (rule-based, no API cost)
- src/bot.js — conversation state machine, Hinglish replies
- src/links.js — deep-link builders
- src/stt.js — voice-note transcription via Groq free-tier Whisper
  (set GROQ_API_KEY; without it the bot politely asks the user to type)
- server.js — webhook (GET verify + POST messages) + /simulate for local tests

## Run the demo (no WhatsApp needed)
    node test/simulate.js          # scripted parent conversations
    node server.js                 # then POST localhost:3000/simulate

## Going live (one founder step)
1. Create a Meta developer app (developers.facebook.com) -> add WhatsApp.
2. Use the free TEST number Meta gives, or register a dedicated number.
3. Add the user's own number as a test recipient — Meta sends ONE
   verification code to that phone (this is the only step needing the
   founder's phone, ~2 minutes).
4. Set env: WA_VERIFY_TOKEN, WA_ACCESS_TOKEN, WA_PHONE_ID, GROQ_API_KEY.
5. Point the webhook at this server (public URL via deploy/tunnel).

## V2 ideas
- Line Free India direct token booking inside chat (Firebase API)
- Medicine / appointment reminders for parents
- LLM intent layer (free-tier) for messier sentences
