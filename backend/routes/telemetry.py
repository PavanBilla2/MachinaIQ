from fastapi import APIRouter
from typing import List, Dict, Any
import pandas as pd
import model_engine

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.get("/overview")
def get_overview() -> Dict[str, Any]:
    df = model_engine.load_raw_data()
    total = len(df)
    fails = int(df['Machine failure'].sum())
    return {
        "totalMachines": total,
        "totalFailures": fails,
        "failureRate": round((fails / total) * 100, 2),
        "avgToolWear": round(float(df['Tool wear [min]'].mean()), 2),
        "avgTorque": round(float(df['Torque [Nm]'].mean()), 2),
        "avgRPM": round(float(df['Rotational speed [rpm]'].mean()), 2)
    }

@router.get("/failure-modes")
def get_failure_modes() -> List[Dict[str, Any]]:
    df = model_engine.load_raw_data()
    return [
        {"name": "Heat Dissipation (HDF)", "count": int(df['HDF'].sum()), "color": "#EF6262"},
        {"name": "Power Failure (PWF)", "count": int(df['PWF'].sum()), "color": "#E8AD50"},
        {"name": "Overstrain (OSF)", "count": int(df['OSF'].sum()), "color": "#4388F5"},
        {"name": "Tool Wear (TWF)", "count": int(df['TWF'].sum()), "color": "#18C6BE"},
        {"name": "Random Failure (RNF)", "count": int(df['RNF'].sum()), "color": "#929DAC"}
    ]

@router.get("/sensors")
def get_sensor_ranges() -> List[Dict[str, Any]]:
    df = model_engine.load_raw_data()
    return [
        {"param": "Air Temp (K)", "min": round(float(df['Air temperature [K]'].min()), 1), "avg": round(float(df['Air temperature [K]'].mean()), 1), "max": round(float(df['Air temperature [K]'].max()), 1)},
        {"param": "Process Temp (K)", "min": round(float(df['Process temperature [K]'].min()), 1), "avg": round(float(df['Process temperature [K]'].mean()), 1), "max": round(float(df['Process temperature [K]'].max()), 1)},
        {"param": "RPM", "min": int(df['Rotational speed [rpm]'].min()), "avg": int(df['Rotational speed [rpm]'].mean()), "max": int(df['Rotational speed [rpm]'].max())},
        {"param": "Torque (Nm)", "min": round(float(df['Torque [Nm]'].min()), 1), "avg": round(float(df['Torque [Nm]'].mean()), 1), "max": round(float(df['Torque [Nm]'].max()), 1)},
        {"param": "Tool Wear (min)", "min": int(df['Tool wear [min]'].min()), "avg": int(df['Tool wear [min]'].mean()), "max": int(df['Tool wear [min]'].max())}
    ]
