
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import numpy as np
import model_engine

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("/benchmark")
def get_benchmarks() -> Dict[str, Any]:
    pkg = model_engine.load_or_train()

    cv_list = model_engine.CV_RESULTS.to_dict(orient="records")

    metrics = pkg["metrics"]
    holdout_list = []

    for model_name, values in metrics.items():
        holdout_list.append({
            "model": model_name,
            "accuracy": round(float(values["Accuracy"]) * 100, 2),
            "precision": round(float(values["Precision"]) * 100, 2),
            "recall": round(float(values["Recall"]) * 100, 2),
            "f1": round(float(values["F1"]), 4),
            "rocAuc": round(float(values["ROC_AUC"]), 4),
            "logLoss": round(float(values["LogLoss"]), 4)
        })

    return {
        "crossValidation": cv_list,
        "holdout": holdout_list
    }


@router.get("/roc-curves")
def get_roc_curves() -> List[Dict[str, float]]:
    pkg = model_engine.load_or_train()
    metrics = pkg["metrics"]

    model_keys = {
        "Random Forest": "rf",
        "Decision Tree": "dt",
        "Logistic Regression": "lr",
        "XGBoost": "xgb",
        "SVM": "svm"
    }

    fpr_points = np.linspace(0, 1, 101)

    interpolated_curves = {}

    for model_name, key in model_keys.items():
        values = metrics[model_name]

        fpr = np.asarray(values["fpr"], dtype=float)
        tpr = np.asarray(values["tpr"], dtype=float)

        interpolated_curves[key] = np.interp(
            fpr_points,
            fpr,
            tpr
        )

    result = []

    for i, fpr in enumerate(fpr_points):
        point = {
            "fpr": round(float(fpr), 4),
            "base": round(float(fpr), 4)
        }

        for key in model_keys.values():
            point[key] = round(
                float(interpolated_curves[key][i]), 4
            )

        result.append(point)

    return result


@router.get("/confusion-matrix")
def get_confusion_matrix(
    model: str = "Random Forest"
) -> Dict[str, Any]:

    pkg = model_engine.load_or_train()
    metrics = pkg["metrics"]

    if model not in metrics:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model: {model}. Available models: {list(metrics.keys())}"
        )

    cm = np.asarray(metrics[model]["cm"])

    return {
        "tn": int(cm[0][0]),
        "fp": int(cm[0][1]),
        "fn": int(cm[1][0]),
        "tp": int(cm[1][1])
    }


@router.get("/feature-importance")
def get_feature_importance() -> List[Dict[str, Any]]:

    pkg = model_engine.load_or_train()
    importances = pkg["importances"]

    total = float(importances["Importance"].sum())

    result = []

    for _, row in importances.iterrows():
        percentage = (
            float(row["Importance"]) / total * 100
            if total > 0 else 0
        )

        result.append({
            "feature": str(row["Feature"]),
            "importance": round(percentage, 2)
        })

    return result
