
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class SinglePredictionRequest(BaseModel):
    air_temp: float = Field(
        ..., ge=290, le=320,
        description="Air temperature in Kelvin"
    )

    proc_temp: float = Field(
        ..., ge=300, le=330,
        description="Process temperature in Kelvin"
    )

    rot_speed: float = Field(
        ..., ge=1000, le=3500,
        description="Rotational speed in RPM"
    )

    torque: float = Field(
        ..., ge=1, le=100,
        description="Torque in Nm"
    )

    tool_wear: float = Field(
        ..., ge=0, le=300,
        description="Tool wear in minutes"
    )

    machine_type: str = Field(
        ...,
        pattern="^[LMH]$",
        description="Machine quality variant: L, M, or H"
    )

    model: Optional[str] = Field(
        "Random Forest",
        description="Model: Random Forest, Decision Tree, Logistic Regression, XGBoost, or SVM"
    )


class SinglePredictionResponse(BaseModel):
    failure_prob: float
    is_failed: int
    cluster: int
    all_probs: Dict[str, float]
    modes: Dict[str, Any]


class FleetOverviewResponse(BaseModel):
    totalMachines: int
    totalFailures: int
    failureRate: float
    avgToolWear: float
    avgTorque: float
    avgRPM: float


class FailureModeItem(BaseModel):
    name: str
    count: int
    color: str
