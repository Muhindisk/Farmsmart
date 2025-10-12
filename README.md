# FarmSmart — Sustainable Farming Assistant

TL;DR
FarmSmart is a compact starter app for building an LLM-backed farming assistant. It includes a Vite + React frontend, a Node.js + Express backend that proxies LLM requests and talks to Supabase, plus a SQL schema for the database. Use this repo to prototype crop recommendations, pest identification helpers, irrigation scheduling guidance, and simple record-keeping.

Tech stack
- Frontend: Vite + React
- Backend: Node.js + Express
- Database: Supabase (Postgres)
- LLM: OpenAI / Gemini (proxied via the server)

Repository layout
- `client/` — Vite + React single-page app (UI and dev server)
- `server/` — Node.js + Express API (LLM proxy, Supabase server-side operations)
- `supabase/` — SQL schema for creating tables/roles
- `LICENSE` — MIT
- `.env.example` files inside `server/` and `client/` showing required environment variables

Quick start (PowerShell)

Prerequisites
- Node.js (v16+ recommended)
- A Supabase project
- An OpenAI (or compatible) API key

1) Create database schema
- Open your Supabase project → SQL editor → run the SQL in `supabase/schema.sql`.

2) Server (PowerShell)
```powershell
cd server
npm install
Copy-Item .env.example .env
# Edit server/.env and set these values:
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY (or other LLM key)
node index.js
```

3) Client (PowerShell)
```powershell
cd client
npm install
Copy-Item .env.example .env
# Edit client/.env with any public keys required by the frontend (do NOT add secret service keys here)
npm run dev
```

Default ports
- Frontend (Vite): http://localhost:5173
- Backend: check `server/index.js` (commonly http://localhost:8080)

Environment variables (high level)
- `server/.env.example` contains the variables the server needs. Typical values:
  - SUPABASE_URL — your Supabase project URL
  - SUPABASE_ANON_KEY — public anon key for client-side usage (if needed)
  - SUPABASE_SERVICE_ROLE_KEY — server-only service role key (keep secret)
  - OPENAI_API_KEY — LLM API key used by the server proxy
- `client/.env.example` contains public keys for frontend usage (never include secrets)

Security & production notes
- Never expose secret keys (service role keys, LLM private keys) in the frontend. Store secrets server-side only.
- This repository is a demo/starter template and not production-ready. For production:
  - Add authentication (Supabase auth or other)
  - Validate and sanitize user input before sending to an LLM
  - Add rate-limiting and request controls for LLM usage
  - Configure CORS and HTTPS
  - Rotate keys regularly and use secure secret storage

Development notes & ideas
- Add more prompt templates on the server to extend assistant capabilities.
- Add image-upload and lightweight CV pipeline for pest/disease detection.
- Turn common server operations into Supabase functions for clearer separation.

License
- MIT — see `LICENSE`.

Contributing / questions
- Open an issue or PR on this repository.
- If you'd like, I can commit this README change for you. Reply "commit" and I'll create a git commit on `main` with the message: "docs: polish README".


1. Create a Supabase project and run `supabase/schema.sql` in the Supabase SQL editor to create the tables.
