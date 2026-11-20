
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
import pandas as pd
import io
from schemas import SinglePredictionRequest, SinglePredictionResponse
import model_engine

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.post("/single", response_model=SinglePredictionResponse)
def predict_single_telemetry(req: SinglePredictionRequest):
    try:
        pkg = model_engine.load_or_train()

        models_map = {
            "Random Forest": pkg["rf"],
            "Decision Tree": pkg["dt"],
            "Logistic Regression": pkg["lr"],
            "XGBoost": pkg["xgb"],
            "SVM": pkg["svm"]
        }

        model_name = req.model or "Random Forest"
        
        if model_name not in models_map:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model: {model_name}"
            )

        active_clf = models_map[model_name]

        res = model_engine.predict_single(
            active_model=active_clf,
            scaler=pkg["scaler"],
            kmeans_model=pkg["kmeans"],
            cluster_scaler=pkg["cluster_scaler"],
            air_temp=req.air_temp,
            proc_temp=req.proc_temp,
            rot_speed=req.rot_speed,
            torque=req.torque,
            tool_wear=req.tool_wear,
            m_type=req.machine_type,
            model_name=model_name,
            other_models=models_map
        )

        return res

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def predict_batch_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        required = [
            "Air temperature [K]",
            "Process temperature [K]",
            "Rotational speed [rpm]",
            "Torque [Nm]",
            "Tool wear [min]",
            "Type"
        ]

        missing = [c for c in required if c not in df.columns]

        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing columns: {missing}"
            )

        pkg = model_engine.load_or_train()

        X, _ = model_engine.prepare_data(df)
        probs = pkg["rf"].predict_proba(X)[:, 1]

        df["Predicted_Failure_Risk_Pct"] = (probs * 100).round(2)

        df["Dispatch_Urgency"] = pd.cut(
            df["Predicted_Failure_Risk_Pct"],
            bins=[-0.1, 25.0, 50.0, 100.1],
            labels=[
                "ROUTINE",
                "INSPECTION NEEDED",
                "CRITICAL DISPATCH"
            ]
        )

        out_stream = io.StringIO()
        df.to_csv(out_stream, index=False)

        return Response(
            content=out_stream.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition":
                f"attachment; filename=predicted_{file.filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
