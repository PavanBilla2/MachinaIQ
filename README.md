# MachinaIQ — Industrial Intelligence Center

An enterprise-grade predictive maintenance platform built with a high-performance **Python FastAPI** backend and a custom **React 19 + Vite + Tailwind CSS** frontend styled in an **Industrial Slate** design system inspired by modern industrial IoT and manufacturing command centers.

---

## 🎨 Industrial Slate Design System

| Surface / Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Main Canvas** | `#171B20` | Core workspace background |
| **Sidebar Rail** | `#1B2027` | Navigation console with active state `#303D49` |
| **Card Panels** | `#222830` | Elevated dashboard cards with subtle `#343D47` borders |
| **Input Fields** | `#1C222A` | Slider controls and text/numeric inputs |
| **Primary Accent** | `#7891A8` | Steel Blue for primary interactions, hover `#8BA2B7` |
| **Secondary Accent** | `#B9875C` | Muted Copper for highlights, hover `#C69A70` |
| **Healthy Status** | `#789681` | Sage Green for nominal operating state |
| **Warning Status** | `#C29A5B` | Amber for caution and elevated stress |
| **Failure Status** | `#BE7470` | Muted Red for failure/critical state |
| **Primary Text** | `#E6E9ED` | Headings and high-contrast metric figures |
| **Secondary Text** | `#A2ABB5` | Descriptive sub-labels and units |

---

## 🚀 How to Launch

### 1-Click Platform Launch (Windows)
Double-click:  
`run_all.bat` (launches both the FastAPI backend and React Vite frontend).

### Manual Launch

**Terminal 1 — Backend (FastAPI)**:
```powershell
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

**Terminal 2 — Frontend (React Vite)**:
```powershell
cd frontend
npm run dev
```
- MachinaIQ Console: [http://localhost:5173](http://localhost:5173)

---

## 📁 Architecture Overview

```
predictive-maintenance-platform/
│
├── backend/
│   ├── main.py                       # FastAPI application & startup loader
│   ├── schemas.py                    # Pydantic v2 request/response models
│   ├── requirements.txt              # Backend dependencies
│   ├── model_engine.py               # ML engine & physics boundary heuristics
│   ├── ai4i2020.csv                  # Official 10,000-record AI4I 2020 dataset
│   ├── saved_models/                 # Serialized pre-trained .joblib artifacts
│   └── routes/
│       ├── telemetry.py              # Fleet KPIs & sensor ranges
│       ├── predict.py                # Single & batch failure prediction
│       ├── models.py                 # Cross-validation, holdout metrics & ROC data
│       └── clusters.py               # K-Means (K=3), Elbow, Silhouette & PCA 2D
│
├── frontend/
│   ├── package.json                  # React 19, Vite, Tailwind CSS, Recharts, Lucide, Axios
│   ├── public/
│   │   ├── industrial-cnc.png        # Realistic 3D CNC Machining Center with MachinaIQ branding
│   │   └── sidebar-plant.png         # Industrial facility footer graphic
│   └── src/
│       ├── api/client.js             # Centralized Axios API client
│       ├── components/ui.jsx         # Card, KpiCard, PageHeader, StatusBadge
│       ├── layouts/Sidebar.jsx       # MachinaIQ gear/waveform logo, nav rail, plant footer
│       ├── pages/
│       │   ├── Overview.jsx          # Fleet KPIs, failure breakdown & sensor ranges
│       │   ├── Simulator.jsx         # Digital Twin 3D CNC machine, live HUD badges & gauge
│       │   ├── ModelIntelligence.jsx # CV vs holdout benchmark, ROC curves & confusion matrix
│       │   ├── ClusterAnalysis.jsx   # Elbow curve, silhouette analysis & 2D PCA scatter
│       │   └── BatchReports.jsx      # Telemetry ingestion, search filter & CSV export
│       ├── App.jsx                   # Master controller
│       ├── main.jsx                  # Root mount
│       └── index.css                 # Industrial Slate stylesheet & theme variables
│
├── run_backend.bat                   # 1-Click FastAPI Backend Launcher
├── run_frontend.bat                  # 1-Click React Frontend Launcher
├── run_all.bat                       # 1-Click Dual Launcher
└── README.md                         # Complete documentation
```
