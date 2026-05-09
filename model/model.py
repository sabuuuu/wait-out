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
