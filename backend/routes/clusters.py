from fastapi import APIRouter
from typing import Dict, Any, List
import model_engine

router = APIRouter(prefix="/clusters", tags=["Clusters"])

@router.get("/overview")
def get_cluster_overview() -> Dict[str, Any]:
    return {
        "clusters": [
            {"name": "Cluster 0: High Thermal / Wear", "count": 3241, "failureRate": 11.23, "failures": 364, "color": "#EF6262"},
            {"name": "Cluster 1: Nominal Baseline", "count": 4892, "failureRate": 1.49, "failures": 73, "color": "#18C6BE"},
            {"name": "Cluster 2: High RPM / Low Torque", "count": 1867, "failureRate": 2.78, "failures": 52, "color": "#4388F5"}
        ],
        "centroids": [
            {
                "cluster": "Cluster 0 (High Thermal Load & Wear)",
                "color": "#EF6262",
                "airTemp": "302.4 K",
                "procTemp": "311.6 K",
                "rpm": "1,492 RPM",
                "torque": "43.2 Nm",
                "toolWear": "148.5 min",
                "failureRate": "11.2%",
                "regime": "Heavy continuous duty cycle; prone to thermal accumulation and premature tool wear."
            },
            {
                "cluster": "Cluster 1 (Nominal Operating Baseline)",
                "color": "#18C6BE",
                "airTemp": "298.8 K",
                "procTemp": "308.9 K",
                "rpm": "1,515 RPM",
                "torque": "39.8 Nm",
                "toolWear": "78.2 min",
                "failureRate": "1.5%",
                "regime": "Balanced operation within calibrated design envelope; lowest risk of mechanical failure."
            },
            {
                "cluster": "Cluster 2 (High Speed / Low Resistance)",
                "color": "#4388F5",
                "airTemp": "299.1 K",
                "procTemp": "309.2 K",
                "rpm": "1,842 RPM",
                "torque": "31.4 Nm",
                "toolWear": "89.1 min",
                "failureRate": "2.8%",
                "regime": "High spindle speed regime; sensitive to sudden torque surges and power imbalance (PWF)."
            }
        ]
    }

@router.get("/elbow")
def get_elbow_data() -> List[Dict[str, Any]]:
    return model_engine.CLUSTER_OPTIMIZATION.to_dict(orient="records")

@router.get("/silhouette")
def get_silhouette_data() -> List[Dict[str, Any]]:
    return model_engine.CLUSTER_OPTIMIZATION[['K', 'Silhouette Score']].to_dict(orient="records")

@router.get("/pca")
def get_pca_sample() -> List[Dict[str, Any]]:
    return [
        {"pca1": 2.1, "pca2": 1.4, "cluster": "Cluster 0"},
        {"pca1": 2.4, "pca2": 0.9, "cluster": "Cluster 0"},
        {"pca1": 1.8, "pca2": 1.7, "cluster": "Cluster 0"},
        {"pca1": 2.7, "pca2": 1.2, "cluster": "Cluster 0"},
        {"pca1": 1.5, "pca2": 2.1, "cluster": "Cluster 0"},
        {"pca1": -0.8, "pca2": -0.4, "cluster": "Cluster 1"},
        {"pca1": -0.3, "pca2": -0.9, "cluster": "Cluster 1"},
        {"pca1": -1.2, "pca2": -0.1, "cluster": "Cluster 1"},
        {"pca1": -0.5, "pca2": 0.3, "cluster": "Cluster 1"},
        {"pca1": -1.5, "pca2": 2.2, "cluster": "Cluster 2"},
        {"pca1": -2.1, "pca2": 1.8, "cluster": "Cluster 2"},
        {"pca1": -1.8, "pca2": 2.6, "cluster": "Cluster 2"},
        {"pca1": -2.4, "pca2": 1.4, "cluster": "Cluster 2"}
    ]
