# 🧠 Pausy V2 — "Do I Actually Want This?"

> V1 taught us *patience*. V2 teaches us *self-knowledge*. Same app, now with a brain.

V2 replaces the hand-tuned `regret-score.ts` heuristic with a real ML pipeline that learns from **your own purchase history** and predicts: *"There's a 78% chance you'll regret this."*

---

## V2 Overview

| | V1 | V2 |
|---|---|---|
| Regret score | Weighted formula (hardcoded) | ML model trained per-user |
| Inputs | Time of day, price, category | + past ignored items, price-vs-avg, session context |
| Output | Score 0–100 | Regret probability 0–1 with factor explanation |
| Backend | Supabase only | + Python ML microservice (FastAPI) |
| Training data | None | Items you marked "forgot" or "bought anyway" |
| Local dev | N/A | Docker Compose (full stack locally) |
| Deployment | N/A | Docker multi-stage → Railway / Fly.io |

---

## Phase V2.0 — New Data We Need to Collect

Before training anything, we need richer signals. These extend the existing `WishlistItem` type and Supabase schema.

### V2.0.1 — Extended `WishlistItem` type

```ts
// lib/types.ts — additions for V2
export interface WishlistItem {
  // ... all V1 fields ...

  // V2: ML feature signals
  added_day_of_week:   number;       // 0 = Sunday … 6 = Saturday
  session_items_count: number;       // how many items added in same 30-min session
  price_vs_cat_avg:    number | null; // ratio: item price / user's avg for this category
  category_slug:       string | null; // "clothes" | "tech" | "home" | "beauty" | "other"
  source_platform:     "tiktok" | "instagram" | "web" | "unknown";

  // V2: outcome label (set when user resolves the item)
  outcome:             "regretted" | "happy" | "neutral" | null;
  outcome_set_at:      string | null;
}
```

### V2.0.2 — Schema migration

```sql
-- Run in Supabase SQL editor
alter table items
  add column added_day_of_week   smallint,
  add column session_items_count smallint default 1,
  add column price_vs_cat_avg    float,
  add column category_slug       text,
  add column source_platform     text default 'unknown',
  add column outcome             text check (outcome in ('regretted','happy','neutral')),
  add column outcome_set_at      timestamptz;

-- Index for ML training queries
create index items_outcome_idx on items (user_id, outcome) where outcome is not null;
```

### V2.0.3 — Capture `outcome` in the app

When an item reaches `status = "bought"` or `status = "forgot"`, show a one-tap outcome card:

```tsx
// components/OutcomePrompt.tsx
// Shown as a bottom sheet when item expires or is marked bought.
// "How do you feel about this purchase?"
// [😬 Regret it]   [😊 Happy with it]   [🤷 Neutral]

export function OutcomePrompt({ item, onDone }: { item: WishlistItem; onDone: () => void }) {
  async function record(outcome: "regretted" | "happy" | "neutral") {
    await supabase
      .from("items")
      .update({ outcome, outcome_set_at: new Date().toISOString() })
      .eq("id", item.id);
    onDone();
  }
  // ... render three emoji buttons
}
```

---

## Phase V2.1 — Feature Engineering

All features are computed **at item-add time** and stored in the DB. No inference-time lookups needed.

```ts
// lib/ml-features.ts

export interface MLFeatures {
  hour_sin:            number;   // sin(2π * hour/24) — cyclic encoding
  hour_cos:            number;   // cos(2π * hour/24)
  day_of_week:         number;   // 0–6
  is_weekend:          number;   // 0 | 1
  price_log:           number;   // log1p(price) — handles $5 vs $500 items
  price_vs_cat_avg:    number;   // 1.0 = at average; 2.0 = twice average
  session_items_count: number;   // binge-adding signal
  source_tiktok:       number;   // one-hot
  source_instagram:    number;
  source_web:          number;
  cat_clothes:         number;   // one-hot category
  cat_tech:            number;
  cat_beauty:          number;
  cat_home:            number;
  cat_other:           number;
  ignored_ratio_cat:   number;   // % of past items in this category the user ignored
}

export function extractFeatures(item: WishlistItem, history: WishlistItem[]): MLFeatures {
  const hour  = item.added_hour;
  const price = item.price ?? 0;

  const hour_sin = Math.sin((2 * Math.PI * hour) / 24);
  const hour_cos = Math.cos((2 * Math.PI * hour) / 24);

  const catItems    = history.filter((h) => h.category_slug === item.category_slug && h.price);
  const catAvgPrice = catItems.length
    ? catItems.reduce((s, h) => s + (h.price ?? 0), 0) / catItems.length
    : price;
  const price_vs_cat_avg = catAvgPrice > 0 ? price / catAvgPrice : 1;

  const catResolved       = catItems.filter((h) => h.outcome);
  const ignored_ratio_cat = catResolved.length
    ? catResolved.filter((h) => h.outcome !== "happy").length / catResolved.length
    : 0.5;

  return {
    hour_sin, hour_cos,
    day_of_week:      item.added_day_of_week,
    is_weekend:       [0, 6].includes(item.added_day_of_week) ? 1 : 0,
    price_log:        Math.log1p(price),
    price_vs_cat_avg,
    session_items_count: item.session_items_count,
    source_tiktok:    item.source_platform === "tiktok"    ? 1 : 0,
    source_instagram: item.source_platform === "instagram" ? 1 : 0,
    source_web:       item.source_platform === "web"       ? 1 : 0,
    cat_clothes:      item.category_slug === "clothes"     ? 1 : 0,
    cat_tech:         item.category_slug === "tech"        ? 1 : 0,
    cat_beauty:       item.category_slug === "beauty"      ? 1 : 0,
    cat_home:         item.category_slug === "home"        ? 1 : 0,
    cat_other:        !item.category_slug || item.category_slug === "other" ? 1 : 0,
    ignored_ratio_cat,
  };
}
```

---

## Phase V2.2 — ML Model (Python Microservice)

The model runs as a lightweight **FastAPI** service. It exposes two endpoints: `POST /predict` and `POST /train`.

### V2.2.1 — Model choice

We use **Logistic Regression** (scikit-learn) as the baseline — fast, explainable, and good enough for ~50–500 training samples per user. Can swap in XGBoost or a small neural net later.

```
model/
├── main.py           # FastAPI app
├── model.py          # Training + inference logic
├── requirements.txt
├── Dockerfile        # Production multi-stage image
├── Dockerfile.dev    # Dev image (hot-reload, no build optimisation)
└── .dockerignore
```

### V2.2.2 — `model/model.py`

```python
# model/model.py
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib, os, json

FEATURE_KEYS = [
    "hour_sin", "hour_cos", "day_of_week", "is_weekend",
    "price_log", "price_vs_cat_avg", "session_items_count",
    "source_tiktok", "source_instagram", "source_web",
    "cat_clothes", "cat_tech", "cat_beauty", "cat_home", "cat_other",
    "ignored_ratio_cat",
]

def features_to_array(f: dict) -> np.ndarray:
    return np.array([[f[k] for k in FEATURE_KEYS]])

def train(training_rows: list[dict]) -> dict:
    if len(training_rows) < 10:
        return {"error": "need at least 10 labelled items to train"}

    X = np.array([[r[k] for k in FEATURE_KEYS] for r in training_rows])
    y = np.array([r["label"] for r in training_rows])

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    LogisticRegression(C=1.0, max_iter=500, class_weight="balanced")),
    ])
    pipeline.fit(X, y)
    return pipeline

def predict(pipeline, features: dict) -> dict:
    X        = features_to_array(features)
    prob     = pipeline.predict_proba(X)[0][1]
    scaler   = pipeline.named_steps["scaler"]
    clf      = pipeline.named_steps["clf"]
    X_scaled = scaler.transform(X)[0]
    contribs = dict(zip(FEATURE_KEYS, (X_scaled * clf.coef_[0]).tolist()))
    top_factors = sorted(contribs.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
    return {
        "regret_probability": round(float(prob), 3),
        "top_factors": [{"feature": k, "contribution": round(v, 3)} for k, v in top_factors],
    }
```

### V2.2.3 — `model/main.py` (FastAPI)

```python
# model/main.py
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import joblib, os, io
from supabase import create_client
from model import train, predict, FEATURE_KEYS

app = FastAPI()
supabase   = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
API_SECRET = os.environ["ML_API_SECRET"]

def load_model(user_id: str):
    try:
        res = supabase.storage.from_("ml-models").download(f"{user_id}/model.pkl")
        return joblib.load(io.BytesIO(res))
    except Exception:
        return None

def save_model(user_id: str, pipeline):
    buf = io.BytesIO()
    joblib.dump(pipeline, buf)
    buf.seek(0)
    supabase.storage.from_("ml-models").upload(
        f"{user_id}/model.pkl", buf.read(), {"upsert": "true"}
    )

class PredictRequest(BaseModel):
    user_id:  str
    features: dict

class TrainRequest(BaseModel):
    user_id:       str
    training_rows: list[dict]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict_endpoint(req: PredictRequest, x_api_key: str = Header(...)):
    if x_api_key != API_SECRET:
        raise HTTPException(403)
    pipeline = load_model(req.user_id)
    if not pipeline:
        return {"regret_probability": None, "fallback": "v1_heuristic"}
    return predict(pipeline, req.features)

@app.post("/train")
def train_endpoint(req: TrainRequest, x_api_key: str = Header(...)):
    if x_api_key != API_SECRET:
        raise HTTPException(403)
    result = train(req.training_rows)
    if isinstance(result, dict) and "error" in result:
        return result
    save_model(req.user_id, result)
    return {"status": "trained", "n_samples": len(req.training_rows)}
```

### V2.2.4 — Supabase Storage bucket for models

```sql
-- Dashboard → Storage → New bucket
insert into storage.buckets (id, name, public) values ('ml-models', 'ml-models', false);
-- Only the service role can read/write (ML microservice uses service key)
-- No user-facing RLS needed
```

---

## Phase V2.3 — Docker Setup

### V2.3.1 — `model/requirements.txt`

Pin all versions for reproducibility:

```text
fastapi==0.111.*
uvicorn[standard]==0.29.*
scikit-learn==1.5.*
joblib==1.4.*
numpy==1.26.*
supabase==2.*
pydantic==2.*
```

> **Why `uvicorn[standard]`?** The `[standard]` extra pulls in `uvloop` and `httptools` — significantly faster async I/O with zero code changes.

---

### V2.3.2 — `model/Dockerfile` (Production — Multi-Stage)

Multi-stage builds keep the final image lean: compile deps in a builder stage, copy only what's needed into the runner stage. This cuts the image size from ~900 MB down to ~250 MB.

```dockerfile
# ── Stage 1: builder ────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build tools (needed to compile some wheels; not included in final image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install into a separate prefix so we can copy just the packages
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: runner ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runner

WORKDIR /app

# Create a non-root user — running as root inside a container is a security risk
RUN addgroup --system pausy && adduser --system --ingroup pausy pausy

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY main.py model.py ./

# Switch to non-root
USER pausy

# Health check — Railway / Fly will mark the container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

---

### V2.3.3 — `model/Dockerfile.dev` (Development — Hot Reload)

The dev image skips the multi-stage build and mounts the source directory as a volume so changes are reflected without rebuilding.

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Source is bind-mounted at runtime (see docker-compose.yml)
# so we don't COPY it here

EXPOSE 8000

# --reload watches for file changes and restarts uvicorn automatically
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

---

### V2.3.4 — `model/.dockerignore`

Prevents test files, caches, and local env from leaking into the image:

```
__pycache__/
*.pyc
*.pyo
.pytest_cache/
.env
.env.*
*.pkl
*.joblib
tests/
.git/
README.md
Dockerfile.dev
```

---

### V2.3.5 — `docker-compose.yml` (Root of repo — Local Dev)

`docker-compose` spins up the full backend stack locally with one command. The app service uses `Dockerfile.dev` and mounts source live; a Redis sidecar is included for a future rate-limiting layer.

```yaml
# docker-compose.yml  (repo root)
version: "3.9"

services:
  ml-api:
    build:
      context: ./model
      dockerfile: Dockerfile.dev      # hot-reload in dev
    container_name: pausy-ml-api
    ports:
      - "8000:8000"
    env_file:
      - ./model/.env.dev              # SUPABASE_URL, SUPABASE_SERVICE_KEY, ML_API_SECRET
    volumes:
      - ./model:/app                  # bind-mount for hot-reload
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped

  # Optional: Redis for rate-limiting (future use)
  redis:
    image: redis:7-alpine
    container_name: pausy-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
```

**`model/.env.dev`** (never commit — add to `.gitignore`):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
ML_API_SECRET=dev-secret-change-me
```

---

### V2.3.6 — Local dev workflow

```bash
# Start the full stack (builds image if first run, then hot-reloads on changes)
docker compose up

# Rebuild after changing requirements.txt
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f ml-api

# Stop everything
docker compose down

# Stop and wipe volumes
docker compose down -v
```

Test the running service:

```bash
# Health check
curl http://localhost:8000/health

# Predict (replace with your dev ML_API_SECRET)
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-secret-change-me" \
  -d '{"user_id": "test-123", "features": {"hour_sin": -0.5, "hour_cos": -0.87, "day_of_week": 6, "is_weekend": 1, "price_log": 5.3, "price_vs_cat_avg": 2.1, "session_items_count": 4, "source_tiktok": 1, "source_instagram": 0, "source_web": 0, "cat_clothes": 1, "cat_tech": 0, "cat_beauty": 0, "cat_home": 0, "cat_other": 0, "ignored_ratio_cat": 0.7}}'
```

---

### V2.3.7 — Production deploy (Railway)

Railway detects the `Dockerfile` automatically from the `model/` directory.

```bash
# From repo root
cd model
railway init          # initialise Railway project in this subdirectory
railway up            # builds & deploys using model/Dockerfile (production multi-stage)
```

Set environment variables in the Railway dashboard (Settings → Variables):

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (not anon) |
| `ML_API_SECRET` | A strong random secret |
| `PORT` | `8000` |

Railway will run the `HEALTHCHECK` defined in the Dockerfile and restart unhealthy containers automatically.

---

### V2.3.8 — Alternative deploy (Fly.io)

Fly.io gives you more control over region and scaling:

```bash
cd model
fly launch --dockerfile Dockerfile --name pausy-ml
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=... ML_API_SECRET=...
fly deploy
```

For production scale, set workers based on available RAM (2 workers per CPU, ~200 MB each):

```toml
# fly.toml
[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8000
  force_https   = true

[[vm]]
  memory = "512mb"
  cpus   = 1
```

---

## Phase V2.4 — App Integration

### V2.4.1 — Call ML service from the app

```ts
// lib/ml-predict.ts
import { extractFeatures } from "./ml-features";
import { WishlistItem } from "./types";

const ML_URL    = process.env.EXPO_PUBLIC_ML_URL!;
const ML_SECRET = process.env.EXPO_PUBLIC_ML_SECRET!;

export async function getMLRegretScore(
  item: WishlistItem,
  history: WishlistItem[]
): Promise<{ probability: number | null; topFactors: { feature: string; contribution: number }[] }> {
  const features = extractFeatures(item, history);

  try {
    const res = await fetch(`${ML_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ML_SECRET },
      body:    JSON.stringify({ user_id: item.user_id, features }),
    });
    const data = await res.json();

    if (data.fallback === "v1_heuristic") {
      return { probability: null, topFactors: [] };
    }
    return { probability: data.regret_probability, topFactors: data.top_factors };
  } catch {
    return { probability: null, topFactors: [] }; // graceful degradation
  }
}
```

### V2.4.2 — Trigger model re-training

Training runs automatically when a user records 10+ new outcomes since their last model was trained. A Supabase Edge Function handles this.

```ts
// supabase/functions/trigger-training/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  const { user_id } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_KEY")!
  );

  const { data: rows } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user_id)
    .not("outcome", "is", null);

  if (!rows || rows.length < 10) {
    return new Response(JSON.stringify({ status: "not_enough_data" }), { status: 200 });
  }

  const trainingRows = rows.map((item) => ({
    hour_sin:            item.hour_sin,
    hour_cos:            item.hour_cos,
    day_of_week:         item.added_day_of_week,
    is_weekend:          [0, 6].includes(item.added_day_of_week) ? 1 : 0,
    price_log:           Math.log1p(item.price ?? 0),
    price_vs_cat_avg:    item.price_vs_cat_avg ?? 1,
    session_items_count: item.session_items_count ?? 1,
    source_tiktok:       item.source_platform === "tiktok"    ? 1 : 0,
    source_instagram:    item.source_platform === "instagram" ? 1 : 0,
    source_web:          item.source_platform === "web"       ? 1 : 0,
    cat_clothes:         item.category_slug === "clothes"     ? 1 : 0,
    cat_tech:            item.category_slug === "tech"        ? 1 : 0,
    cat_beauty:          item.category_slug === "beauty"      ? 1 : 0,
    cat_home:            item.category_slug === "home"        ? 1 : 0,
    cat_other:           !item.category_slug || item.category_slug === "other" ? 1 : 0,
    ignored_ratio_cat:   0.5,
    label:               item.outcome === "regretted" ? 1 : 0,
  }));

  await fetch(`${Deno.env.get("ML_URL")}/train`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("ML_SECRET")! },
    body:    JSON.stringify({ user_id, training_rows: trainingRows }),
  });

  return new Response(JSON.stringify({ status: "training_triggered", n: trainingRows.length }));
});
```

---

## Phase V2.5 — New UI: ML Score Card

Replace the V1 `RegretScore.tsx` component with an ML-aware version that shows **why** the model thinks you'll regret it.

```tsx
// components/MLScoreCard.tsx
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Card } from "~/components/ui/card";
import { RiskBadge } from "~/components/ui/badge";

const FACTOR_LABELS: Record<string, string> = {
  hour_sin:            "🌙 Late-night vibes",
  hour_cos:            "🌙 Late-night vibes",
  price_vs_cat_avg:    "💸 Pricier than your usual",
  session_items_count: "🛒 On a shopping spree",
  source_tiktok:       "📱 TikTok made you do it",
  source_instagram:    "📱 Instagram made you do it",
  ignored_ratio_cat:   "🪦 You usually forget these",
  cat_tech:            "🖥️ Tech = danger zone for you",
  cat_clothes:         "👗 You own enough clothes",
  is_weekend:          "📅 Weekend treat mode",
};

export function MLScoreCard({
  probability,
  topFactors,
  fallbackScore,
}: {
  probability:   number | null;
  topFactors:    { feature: string; contribution: number }[];
  fallbackScore: number;
}) {
  const score = probability !== null ? Math.round(probability * 100) : fallbackScore;
  const risk  = score >= 65 ? "high" : score >= 35 ? "mid" : "low";
  const isML  = probability !== null;

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-navy-500">Regret forecast</Text>
        <View className="flex-row items-center gap-2">
          {isML && <Text className="text-xs text-navy-300">✨ personalised</Text>}
          <RiskBadge risk={risk} score={score} />
        </View>
      </View>

      {isML && topFactors.length > 0 && (
        <View className="gap-1">
          <Text className="text-xs text-navy-300 font-semibold uppercase tracking-wide mb-1">
            Why we think so
          </Text>
          {topFactors.map((f) => (
            <Text key={f.feature} className="text-sm text-navy-400">
              {FACTOR_LABELS[f.feature] ?? f.feature}
            </Text>
          ))}
        </View>
      )}

      {!isML && (
        <Text className="text-xs text-navy-300">
          Add 10+ items and rate them to unlock your personalised model ✨
        </Text>
      )}
    </Card>
  );
}
```

---

## Phase V2.6 — Cold Start Strategy

New users have no training data. Handle gracefully:

| User state | Score source | UI label |
|---|---|---|
| < 10 outcomes | V1 heuristic formula | *(no label)* |
| 10–30 outcomes | Logistic Regression (sparse) | "✨ learning your patterns" |
| 30+ outcomes | Full personal model | "✨ personalised" |

The V1 `regret-score.ts` heuristic stays in the codebase permanently as the fallback. The ML layer is **additive** — it never breaks the existing flow.

---

## V2 File Structure (additions to V1)

```
pausy/
├── model/                          # 🐳 Python ML microservice
│   ├── main.py                     # FastAPI app (predict + train endpoints)
│   ├── model.py                    # Logistic regression logic
│   ├── requirements.txt            # Pinned Python deps
│   ├── Dockerfile                  # Multi-stage production image
│   ├── Dockerfile.dev              # Dev image with hot-reload
│   └── .dockerignore
│
├── docker-compose.yml              # Local dev: ml-api + redis
│
├── supabase/
│   └── functions/
│       └── trigger-training/
│           └── index.ts            # Edge function: fires /train after 10 outcomes
│
└── lib/
    ├── ml-features.ts              # Feature extraction (runs in app at add-time)
    └── ml-predict.ts               # HTTP client for the ML microservice
```

---

## V2 Quick Reference — All Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| ML model | Logistic Regression (scikit-learn) | Explainable, works with small per-user datasets |
| Feature encoding | Cyclic (time), log (price), one-hot (category/source) | Handles edge cases cleanly |
| Model storage | Supabase Storage (per-user `.pkl`) | No extra infra; isolated per user |
| Serving | FastAPI on Railway / Fly.io | Lightweight, $0 at low traffic |
| Docker build | Multi-stage (builder + runner) | ~250 MB image vs ~900 MB naive |
| Dev environment | `docker-compose` with `Dockerfile.dev` | Hot-reload, one command, no local Python needed |
| Non-root container | `adduser pausy` in Dockerfile | Security best practice for ML workloads |
| Health check | `GET /health` in both Dockerfile + compose | Auto-restart on crash, zero-downtime redeploys |
| Training trigger | Supabase Edge Function on outcome save | Automatic, serverless |
| Cold start | V1 heuristic as fallback | Zero breaking changes |
| Outcome capture | One-tap emoji prompt post-expiry | Low friction = high completion rate |

---

> 🧠 *V1 made you wait. V2 knows why you shouldn't have clicked in the first place.*

> 🎀 *Built for the girlies who screenshot things at midnight and regret it by Friday.*