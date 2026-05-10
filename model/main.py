from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field, field_validator
from typing import Annotated
import joblib, os, io, time
from jose import jwt, JWTError
# pyrefly: ignore [missing-import]
from supabase import create_client
from model import train, predict, FEATURE_KEYS

app = FastAPI()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# The Supabase JWT secret — lives only on the server, never in the client app.
# Find it in: Supabase dashboard → Settings → API → JWT Secret
SUPABASE_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]

# Minimum seconds between training runs per user (1 hour)
TRAIN_COOLDOWN_SECS = 3600


# ── Auth ─────────────────────────────────────────────────────────────────────

def verify_token(authorization: Annotated[str, Header()]) -> str:
    """
    Verify the Supabase JWT sent by the client as 'Authorization: Bearer <token>'.
    Returns the authenticated user_id on success, raises 401 on failure.
    The client never needs to know the JWT secret — it just sends its session token.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase JWTs don't use a standard aud
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing subject")
        return user_id
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


# ── Input validation ──────────────────────────────────────────────────────────

class TrainingRow(BaseModel):
    hour_sin:            float = Field(ge=-1.0, le=1.0)
    hour_cos:            float = Field(ge=-1.0, le=1.0)
    day_of_week:         int   = Field(ge=0, le=6)
    is_weekend:          int   = Field(ge=0, le=1)
    price_log:           float = Field(ge=0.0)
    price_vs_cat_avg:    float = Field(ge=0.0)
    session_items_count: int   = Field(ge=1)
    source_tiktok:       int   = Field(ge=0, le=1)
    source_instagram:    int   = Field(ge=0, le=1)
    source_web:          int   = Field(ge=0, le=1)
    cat_clothes:         int   = Field(ge=0, le=1)
    cat_tech:            int   = Field(ge=0, le=1)
    cat_beauty:          int   = Field(ge=0, le=1)
    cat_home:            int   = Field(ge=0, le=1)
    cat_other:           int   = Field(ge=0, le=1)
    ignored_ratio_cat:   float = Field(ge=0.0, le=1.0)
    label:               int   = Field(ge=0, le=1)

    @field_validator("label")
    @classmethod
    def label_is_binary(cls, v: int) -> int:
        if v not in (0, 1):
            raise ValueError("label must be 0 or 1")
        return v


class PredictRequest(BaseModel):
    features: dict  # user_id comes from the verified JWT, not the request body


class TrainRequest(BaseModel):
    training_rows: list[TrainingRow]  # user_id comes from the verified JWT


# ── Storage helpers ───────────────────────────────────────────────────────────

def load_model(user_id: str):
    try:
        res = supabase.storage.from_("ml-models").download(f"{user_id}/model.pkl")
        return joblib.load(io.BytesIO(res))
    except Exception:
        return None


def save_model(user_id: str, pipeline) -> None:
    buf = io.BytesIO()
    joblib.dump(pipeline, buf)
    buf.seek(0)
    supabase.storage.from_("ml-models").upload(
        f"{user_id}/model.pkl",
        buf.read(),
        file_options={"upsert": True},  # boolean, not string
    )


# ── Rate limiting ─────────────────────────────────────────────────────────────

def check_train_rate_limit(user_id: str) -> None:
    """Raises 429 if the user has trained within the cooldown window."""
    res = supabase.table("profiles").select("last_model_trained_at").eq("id", user_id).single().execute()
    last_trained = res.data.get("last_model_trained_at") if res.data else None

    if last_trained:
        from datetime import datetime, timezone
        last_dt = datetime.fromisoformat(last_trained.replace("Z", "+00:00"))
        elapsed = (datetime.now(timezone.utc) - last_dt).total_seconds()
        if elapsed < TRAIN_COOLDOWN_SECS:
            retry_after = int(TRAIN_COOLDOWN_SECS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Training rate limit exceeded. Retry after {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )


def record_train_timestamp(user_id: str) -> None:
    from datetime import datetime, timezone
    supabase.table("profiles").update(
        {"last_model_trained_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", user_id).execute()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict_endpoint(
    req: PredictRequest,
    user_id: str = Depends(verify_token),
):
    pipeline = load_model(user_id)
    if not pipeline:
        return {"regret_probability": None, "fallback": "v1_heuristic"}
    return predict(pipeline, req.features)


@app.post("/train")
def train_endpoint(
    req: TrainRequest,
    user_id: str = Depends(verify_token),
):
    check_train_rate_limit(user_id)

    # Convert validated Pydantic models back to dicts for the training function
    rows = [row.model_dump() for row in req.training_rows]

    result = train(rows)
    if isinstance(result, dict) and "error" in result:
        return result

    save_model(user_id, result)
    record_train_timestamp(user_id)

    return {"status": "trained", "n_samples": len(rows)}
