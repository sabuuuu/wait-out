# 🎀 Pausy — *do you actually want that?*

> The app that makes you wait before you buy. Because your bank account deserves a bestie too.

---

## what is this

Pausy is a **wishlist app with a conscience**. You add something you want to buy, and Pausy makes you wait it out — a cooling-off timer that separates the *"omg I need this"* from the *"why did I buy this"*.

**V1** gives you a regret score based on time of day, price, and category — because yes, adding five things at 1am from TikTok is a pattern.

**V2** goes full main character: it trains a **personal ML model on your own purchase history** and tells you *"there's a 78% chance you'll regret this"* — with receipts. It learns which categories you always abandon, whether you're a weekend impulse buyer, and if TikTok is genuinely your villain origin story.

---

## the vibe

| you | pausy |
|---|---|
| adds $200 boots at midnight | 🌙 "late-night vibes detected" |
| screenshots 4 things in 10 mins | 🛒 "on a shopping spree, bestie?" |
| buys tech she never uses | 🖥️ "tech = danger zone for you" |
| forgets she even wanted it | 🪦 "you usually forget these" |

---

## features

**V1 — the patience era**
- ⏳ Cooling-off timer per item
- 🧮 Regret score (price × time of day × category)
- 📋 Wishlist with status tracking (`waiting` → `bought` / `forgot`)
- 🌙 Dark mode, obviously

**V2 — the self-knowledge era**
- 🧠 Personal ML model (Logistic Regression, trained on *your* data)
- ✨ "Why we think so" — top 3 factors explained in plain English
- 😬 Outcome tracking: rate purchases as *regretted / happy / neutral*
- 📈 Model retrains automatically after 10+ rated outcomes
- 🐳 Python ML microservice (FastAPI) — runs locally via Docker Compose
- 🔄 Graceful cold start: V1 heuristic until your model is ready

---

## screenshots

> 📸 *drop your screenshots in `assets/screenshots/` and link them here*

| Wishlist | Item Detail | Regret Score | Outcome Prompt |
|---|---|---|---|
| ![wishlist](assets/screenshots/wishlist.png) | ![detail](assets/screenshots/item-detail.png) | ![score](assets/screenshots/regret-score.png) | ![outcome](assets/screenshots/outcome-prompt.png) |

---

## tech stack

| layer | tech |
|---|---|
| App | React Native + Expo Router |
| Styling | Tailwind CSS via Nativewind |
| UI components | React Native Reusables |
| Backend | Supabase (DB + Auth + Storage + Edge Functions) |
| ML microservice | Python · FastAPI · scikit-learn |
| Local dev | Docker Compose |
| Deploy | Railway / Fly.io |

---

## getting started

### app

```bash
npm install
npm run dev
```

Then in the Expo CLI:
- `i` → iOS simulator *(Mac only)*
- `a` → Android emulator
- `w` → browser
- scan the QR code with [Expo Go](https://expo.dev/go) on your phone

### ML microservice (V2)

You'll need Docker installed. Then from the repo root:

```bash
# copy the example env and fill in your Supabase keys
cp model/.env.dev.example model/.env.dev

# spin up the ML API + Redis
docker compose up
```

The ML API will be live at `http://localhost:8000`. Test it:

```bash
curl http://localhost:8000/health
```

See [`model/`](./model/) for the full Python service and [`docker-compose.yml`](./docker-compose.yml) for the local stack.

---

## environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# V2 — ML microservice (no secret needed — auth via Supabase JWT)
EXPO_PUBLIC_ML_URL=http://localhost:8000
```

---

## project structure

```
pausy/
├── app/                        # Expo Router screens
├── components/                 # UI components
│   ├── MLScoreCard.tsx         # ✨ V2 personalised regret forecast
│   ├── OutcomePrompt.tsx       # 😬 post-purchase rating sheet
│   └── ...
├── lib/
│   ├── ml-features.ts          # feature extraction (runs at add-time)
│   ├── ml-predict.ts           # HTTP client for ML microservice
│   ├── regret-score.ts         # V1 heuristic (permanent fallback)
│   └── types.ts                # WishlistItem + ML types
├── model/                      # 🐳 Python ML microservice
│   ├── main.py                 # FastAPI app
│   ├── model.py                # Logistic regression logic
│   ├── requirements.txt
│   ├── Dockerfile              # multi-stage production image (~250 MB)
│   └── Dockerfile.dev          # hot-reload dev image
├── supabase/
│   └── functions/
│       └── trigger-training/   # Edge Function: auto-retrain after 10 outcomes
├── docker-compose.yml          # local dev: ml-api + redis
└── .env.example
```

---

## deploy

**App** → [EAS Build](https://docs.expo.dev/build/introduction/) + [EAS Submit](https://docs.expo.dev/submit/introduction/)

**ML microservice** → Railway (auto-detects `model/Dockerfile`) or Fly.io:

```bash
# Railway
cd model && railway up

# Fly.io
cd model && fly launch --dockerfile Dockerfile --name pausy-ml
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=... ML_API_SECRET=...
fly deploy
```

---

## the cold start plan

New users don't have a model yet — and that's fine. Pausy degrades gracefully:

| your data | what powers the score | label shown |
|---|---|---|
| < 10 rated outcomes | V1 heuristic formula | *(nothing)* |
| 10–30 outcomes | Logistic Regression (learning) | "✨ learning your patterns" |
| 30+ outcomes | Full personal model | "✨ personalised" |

The V1 formula never goes away. The ML layer is purely additive.

---

> 🧠 *V1 made you wait. V2 knows why you shouldn't have clicked in the first place.*

> 🎀 *Built for the girlies who screenshot things at midnight and regret it by Friday.*
