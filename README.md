# ❄️ ARCTIC v2 — Production HVAC Diagnostic System

AI-powered HVAC diagnostic tool for field technicians. Built on Claude (Anthropic) + Supabase.

---

## What's New in v2

| Feature | How it works |
|---|---|
| **Offline P/T charts** | R-410A, R-22, R-32, R-407C, R-134a, R-454B — all bundled in JS, no network needed |
| **Photo intake** | Claude Vision analyzes nameplates, capacitors, wiring, frost patterns |
| **Parts lookup** | Keyword-matched to mock catalog; swap to Grainger API with one env var |
| **Job history** | Supabase cloud storage + IndexedDB offline fallback + sync queue |
| **Brand fault codes** | Carrier, Trane, Lennox, York, Mitsubishi, Daikin — injected as RAG context |
| **Voice input** | Web Speech API — dictate readings or chat messages hands-free |

---

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key
VITE_SUPABASE_URL=https://your-project.supabase.co   # optional
VITE_SUPABASE_ANON_KEY=your-anon-key                 # optional
VITE_PARTS_PROVIDER=demo                              # or grainger
```

### 3. Run
```bash
npm run dev
# Opens at http://localhost:5173
```

---

## Supabase Setup (optional but recommended)

1. Create a free project at https://supabase.com
2. Go to **SQL Editor** and run this schema:

```sql
create table public.jobs (
  id               text primary key,
  tech_id          text not null,
  tech_name        text,
  customer_name    text,
  customer_address text,
  equipment_type   text,
  brand            text,
  model_num        text,
  refrigerant      text,
  symptoms         text[],
  readings         jsonb,
  tech_notes       text,
  diagnosis        jsonb,
  parts            jsonb,
  chat_summary     text,
  warranty_until   date,
  job_status       text default 'open',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.jobs enable row level security;
create policy "allow all" on public.jobs for all using (true);
create index on public.jobs(tech_id);
create index on public.jobs(created_at desc);
create index on public.jobs(warranty_until) where warranty_until is not null;
```

3. Copy **Project URL** and **anon/public key** from Settings → API into your `.env`

---

## Grainger API Setup (optional)

1. Contact Grainger at https://www.grainger.com/content/supplylink-punchout-catalog
2. Set in `.env`:
```
VITE_PARTS_PROVIDER=grainger
VITE_GRAINGER_API_KEY=your-key
VITE_GRAINGER_ACCOUNT=your-account-number
```

> **Note**: Grainger requires a business account. Ferguson: contact developer@ferguson.com

---

## Voice Input

Uses browser's **Web Speech API** — works in Chrome and Edge.
- On the readings form: tap the microphone and say **"suction pressure 118, discharge 380, superheat 12"**
- In the chat: tap mic and speak your question naturally

---

## Offline Mode

The following work with zero network connection:
- P/T chart lookups (pressure ↔ temperature for all 6 refrigerants)
- Fault code search (Carrier, Trane, Lennox, York, Mitsubishi, Daikin)
- Job history browsing (from IndexedDB)
- Report viewing

AI diagnosis, photo analysis, and chat require internet.

---

## Project Structure

```
src/
├── App.jsx                    # Main orchestrator
├── main.jsx                   # React entry
├── api.js                     # Claude API + vision + RAG prompt builder
├── constants.js               # System prompt, configs
├── data/
│   ├── pt-charts.js           # P/T saturation data (offline)
│   ├── fault-codes.js         # Brand fault code database (offline)
│   └── parts-catalog.js       # Mock + Grainger parts lookup
├── db/
│   ├── indexedDB.js           # Offline storage (idb)
│   └── supabase.js            # Cloud storage + warranty queries
├── hooks/
│   ├── useVoiceInput.js       # Web Speech API
│   └── useOnlineStatus.js     # Network detection
├── components/
│   ├── PhaseIndicator.jsx
│   ├── PhotoCapture.jsx       # Vision photo upload + analysis
│   ├── PTChartWidget.jsx      # Offline P/T calculator
│   ├── FaultCodeSearch.jsx    # Brand fault code browser
│   ├── PartsLookup.jsx        # Parts pricing UI
│   └── VoiceButton.jsx        # Mic toggle button
└── phases/
    ├── Phase1Intake.jsx       # Intake + Field Tools tab
    ├── Phase2Diagnosis.jsx    # AI results + parts
    ├── Phase3Chat.jsx         # Guided chat
    ├── Phase4Report.jsx       # Report + save to Supabase
    └── JobHistory.jsx         # History browser + warranty alerts
```

---

## Build for Production

```bash
npm run build
```

Outputs to `/dist`. The PWA plugin generates a service worker that caches assets for offline use.

### Deploy options
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Any static host**: upload `/dist`

> ⚠️ For production, move the Claude API call to a backend (Express/FastAPI) so your API key is never in the browser bundle.

---

## Roadmap

- [ ] Backend proxy (Express) to secure API key
- [ ] Supabase Auth — tech login, per-tech job isolation
- [ ] Push notifications for warranty expiry
- [ ] Export job report as branded PDF
- [ ] IDEXX / biomedical equipment fault codes
- [ ] Integration with ServiceTitan / Fieldwire for dispatch
