
"""
Predictive Maintenance Engine
Trained on AI4I 2020 Dataset
Provides five ML models, evaluation metrics, feature importances,
K-Means clustering, PCA, and real-time failure diagnostics.
"""

import os
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import average_precision_score

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    log_loss,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    average_precision_score
)

from xgboost import XGBClassifier


DATA_PATH = os.path.join(os.path.dirname(__file__), "ai4i2020.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
MODEL_VERSION = 2

FEATURE_COLS = [
    'Air temperature [K]',
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]',
    'Type_L',
    'Type_M'
]

SENSOR_COLS = [
    'Air temperature [K]',
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]


def load_raw_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    return pd.read_csv(DATA_PATH)


def prepare_data(df):
    X = df[['Type'] + SENSOR_COLS].copy()

    X = pd.get_dummies(
        X,
        columns=['Type'],
        drop_first=True,
        dtype=int
    )

    for col in ['Type_L', 'Type_M']:
        if col not in X.columns:
            X[col] = 0

    X = X[FEATURE_COLS]
    y = df['Machine failure'].astype(int)

    return X, y


def calculate_metrics(y_true, y_pred, y_prob, model):
    probabilities = model.predict_proba(
        model._prediction_input
    ) if False else None

    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    precision_curve, recall_curve, pr_thresholds = (
        precision_recall_curve(y_true, y_prob)
    )

    return {
        'Accuracy': accuracy_score(y_true, y_pred),
        'Precision': precision_score(
            y_true, y_pred, zero_division=0
        ),
        'Recall': recall_score(
            y_true, y_pred, zero_division=0
        ),
        'F1': f1_score(
            y_true, y_pred, zero_division=0
        ),
        'ROC_AUC': roc_auc_score(y_true, y_prob),
        'PR_AUC': average_precision_score(y_true, y_prob),
        'LogLoss': log_loss(y_true, y_prob),
        'y_pred': y_pred,
        'y_prob': y_prob,
        'cm': confusion_matrix(y_true, y_pred),
        'fpr': fpr,
        'tpr': tpr,
        'roc_thresholds': thresholds,
        'precision_curve': precision_curve,
        'recall_curve': recall_curve,
        'pr_thresholds': pr_thresholds
    }



def train_and_evaluate_all():
    os.makedirs(MODELS_DIR, exist_ok=True)

    df = load_raw_data()
    X, y = prepare_data(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # XGBoost requires feature names without special characters
    X_train_xgb = X_train.to_numpy(dtype=float)
    X_test_xgb = X_test.to_numpy(dtype=float)

    # 1. Logistic Regression
    lr = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=42
    )
    lr.fit(X_train_scaled, y_train)

    # 2. Decision Tree
    dt = DecisionTreeClassifier(
        criterion="gini",
        max_depth=6,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42
    )
    dt.fit(X_train, y_train)

    # 3. Random Forest
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=10,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # 4. XGBoost
    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1
    )
    xgb.fit(X_train_xgb, y_train)

    # 5. Support Vector Machine
    svm = SVC(
        kernel="rbf",
        C=1.0,
        class_weight="balanced",
        probability=True,
        random_state=42
    )
    svm.fit(X_train_scaled, y_train)

    # Predictions
    predictions = {
        "Logistic Regression": (
            lr.predict(X_test_scaled),
            lr.predict_proba(X_test_scaled)[:, 1],
            lr
        ),
        "Decision Tree": (
            dt.predict(X_test),
            dt.predict_proba(X_test)[:, 1],
            dt
        ),
        "Random Forest": (
            rf.predict(X_test),
            rf.predict_proba(X_test)[:, 1],
            rf
        ),
        "XGBoost": (
            xgb.predict(X_test_xgb),
            xgb.predict_proba(X_test_xgb)[:, 1],
            xgb
        ),
        "SVM": (
            svm.predict(X_test_scaled),
            svm.predict_proba(X_test_scaled)[:, 1],
            svm
        )
    }

    # Calculate actual test-set metrics
    metrics = {}

    for name, (y_pred, y_prob, model) in predictions.items():
        fpr, tpr, roc_thresholds = roc_curve(y_test, y_prob)
        precision_curve, recall_curve, pr_thresholds = (
            precision_recall_curve(y_test, y_prob)
        )

        metrics[name] = {
            "Accuracy": accuracy_score(y_test, y_pred),
            "Precision": precision_score(
                y_test, y_pred, zero_division=0
            ),
            "Recall": recall_score(
                y_test, y_pred, zero_division=0
            ),
            "F1": f1_score(
                y_test, y_pred, zero_division=0
            ),
            "ROC_AUC": roc_auc_score(y_test, y_prob),
            "PR_AUC": average_precision_score(y_test, y_prob),
            "LogLoss": log_loss(y_test, y_prob),
            "y_pred": y_pred,
            "y_prob": y_prob,
            "cm": confusion_matrix(y_test, y_pred),
            "fpr": fpr,
            "tpr": tpr,
            "roc_thresholds": roc_thresholds,
            "precision_curve": precision_curve,
            "recall_curve": recall_curve,
            "pr_thresholds": pr_thresholds
        }

    # K-Means Clustering
    cluster_scaler = StandardScaler()
    X_sensor_scaled = cluster_scaler.fit_transform(df[SENSOR_COLS])

    kmeans = KMeans(
        n_clusters=3,
        random_state=42,
        n_init=10
    )
    cluster_labels = kmeans.fit_predict(X_sensor_scaled)

    df_clustered = df.copy()
    df_clustered["Cluster"] = cluster_labels

    # PCA
    pca = PCA(n_components=2, random_state=42)
    pca_coords = pca.fit_transform(X_sensor_scaled)

    df_clustered["PCA1"] = pca_coords[:, 0]
    df_clustered["PCA2"] = pca_coords[:, 1]

    # Random Forest Feature Importance
    importances = pd.DataFrame({
        "Feature": FEATURE_COLS,
        "Importance": rf.feature_importances_
    }).sort_values("Importance", ascending=False)

    # Save trained models
    joblib.dump(lr, os.path.join(MODELS_DIR, "logistic_regression.joblib"))
    joblib.dump(dt, os.path.join(MODELS_DIR, "decision_tree.joblib"))
    joblib.dump(rf, os.path.join(MODELS_DIR, "random_forest.joblib"))
    joblib.dump(xgb, os.path.join(MODELS_DIR, "xgboost.joblib"))
    joblib.dump(svm, os.path.join(MODELS_DIR, "svm.joblib"))

    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(cluster_scaler, os.path.join(MODELS_DIR, "cluster_scaler.joblib"))
    joblib.dump(kmeans, os.path.join(MODELS_DIR, "kmeans.joblib"))
    joblib.dump(pca, os.path.join(MODELS_DIR, "pca.joblib"))

    # Complete model package
    package = {
        "df": df,
        "df_clustered": df_clustered,
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "scaler": scaler,
        "cluster_scaler": cluster_scaler,
        "lr": lr,
        "dt": dt,
        "rf": rf,
        "xgb": xgb,
        "svm": svm,
        "kmeans": kmeans,
        "pca": pca,
        "metrics": metrics,
        "importances": importances,
        "model_version": 3
    }

    joblib.dump(
        package,
        os.path.join(MODELS_DIR, "dashboard_cache.joblib")
    )

    return package




def load_or_train():
    cache_path = os.path.join(
        MODELS_DIR, "dashboard_cache.joblib"
    )

    if os.path.exists(cache_path):
        try:
            package = joblib.load(cache_path)

            required_models = [
                "lr", "dt", "rf", "xgb", "svm"
            ]

            if (
                package.get("model_version") == 3
                and all(key in package for key in required_models)
            ):
                return package

        except Exception:
            pass

    return train_and_evaluate_all()


def diagnose_failure_modes(
    air_temp,
    proc_temp,
    rot_speed,
    torque,
    tool_wear,
    m_type
):

    temp_diff = proc_temp - air_temp

    power_watts = (
        torque * (2 * np.pi / 60) * rot_speed
    )

    wear_torque = tool_wear * torque

    osf_threshold = {
        'L': 11000,
        'M': 12000,
        'H': 13000
    }.get(m_type, 11000)

    twf_risk = tool_wear >= 200

    hdf_risk = (
        temp_diff < 8.6
        and rot_speed < 1380
    )

    pwf_risk = (
        power_watts < 3500
        or power_watts > 9000
    )

    osf_risk = wear_torque > osf_threshold

    return {
        'TWF': {
            'risk': twf_risk,
            'val': f"{tool_wear} min",
            'limit': ">= 200 min",
            'desc': 'Tool Wear Failure'
        },
        'HDF': {
            'risk': hdf_risk,
            'val': f"ΔT: {temp_diff:.1f} K, {rot_speed} RPM",
            'limit': "ΔT < 8.6K & <1380 RPM",
            'desc': 'Heat Dissipation Failure'
        },
        'PWF': {
            'risk': pwf_risk,
            'val': f"{power_watts:.0f} W",
            'limit': "<3500 W or >9000 W",
            'desc': 'Power Failure'
        },
        'OSF': {
            'risk': osf_risk,
            'val': f"{wear_torque:.0f} min·Nm",
            'limit': f"> {osf_threshold} min·Nm",
            'desc': 'Overstrain Failure'
        }
    }


# Existing notebook cross-validation results.
# These three rows are retained from the original file.
CV_RESULTS = pd.DataFrame([
    {
        'Model': 'Logistic Regression',
        'Accuracy Mean': 0.8225,
        'Accuracy Std': 0.0074,
        'Precision Mean': 0.1374,
        'Recall Mean': 0.8044,
        'F1 Mean': 0.2346,
        'F1 Std': 0.0100,
        'ROC-AUC Mean': 0.8965,
        'PR-AUC Mean': 0.4409
    },
    {
        'Model': 'Decision Tree',
        'Accuracy Mean': 0.9772,
        'Accuracy Std': 0.0021,
        'Precision Mean': 0.7036,
        'Recall Mean': 0.5719,
        'F1 Mean': 0.6283,
        'F1 Std': 0.0470,
        'ROC-AUC Mean': 0.7817,
        'PR-AUC Mean': 0.4171
    },
    {
        'Model': 'Random Forest',
        'Accuracy Mean': 0.9776,
        'Accuracy Std': 0.0013,
        'Precision Mean': 0.9049,
        'Recall Mean': 0.3801,
        'F1 Mean': 0.5342,
        'F1 Std': 0.0367,
        'ROC-AUC Mean': 0.9662,
        'PR-AUC Mean': 0.7472
    }
])


# Existing K-Means optimization results
CLUSTER_OPTIMIZATION = pd.DataFrame({
    'K': [2, 3, 4, 5, 6, 7, 8, 9],
    'Inertia': [
        36654.19, 28305.69, 24870.55, 21946.72,
        19848.98, 17896.03, 16590.97, 15481.94
    ],
    'Silhouette Score': [
        0.2581, 0.2622, 0.2376, 0.2250,
        0.2200, 0.2256, 0.2176, 0.2149
    ]
})



def predict_single(
    active_model,
    scaler,
    kmeans_model,
    cluster_scaler,
    air_temp,
    proc_temp,
    rot_speed,
    torque,
    tool_wear,
    m_type,
    model_name='Random Forest',
    other_models=None
):
    type_L = 1 if m_type == 'L' else 0
    type_M = 1 if m_type == 'M' else 0

    features = pd.DataFrame([{
        'Air temperature [K]': air_temp,
        'Process temperature [K]': proc_temp,
        'Rotational speed [rpm]': rot_speed,
        'Torque [Nm]': torque,
        'Tool wear [min]': tool_wear,
        'Type_L': type_L,
        'Type_M': type_M
    }])

    scaled_models = ['Logistic Regression', 'SVM']

    def get_model_input(name):
        if name in scaled_models:
            return scaler.transform(features)

        if name == 'XGBoost':
            return features.to_numpy(dtype=float)

        return features

    model_features = get_model_input(model_name)

    fail_prob = float(
        active_model.predict_proba(model_features)[0, 1]
    )

    is_failed = int(fail_prob >= 0.5)

    all_probs = {}

    if other_models:
        for name, mdl in other_models.items():
            input_features = get_model_input(name)

            all_probs[name] = float(
                mdl.predict_proba(input_features)[0, 1]
            )
    else:
        all_probs[model_name] = fail_prob

    sensor_features = np.array([[
        air_temp,
        proc_temp,
        rot_speed,
        torque,
        tool_wear
    ]])

    sensor_scaled = cluster_scaler.transform(sensor_features)

    cluster = int(
        kmeans_model.predict(sensor_scaled)[0]
    )

    modes = diagnose_failure_modes(
        air_temp,
        proc_temp,
        rot_speed,
        torque,
        tool_wear,
        m_type
    )

    return {
        'failure_prob': fail_prob,
        'is_failed': is_failed,
        'all_probs': all_probs,
        'cluster': cluster,
        'modes': modes
    }
