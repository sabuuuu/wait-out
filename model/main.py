from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import joblib, os, io
# pyrefly: ignore [missing-import]
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
