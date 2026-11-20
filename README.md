# MachinaIQ – Predictive Maintenance Platform

MachinaIQ is a machine learning-based predictive maintenance platform designed to analyze industrial machine data and predict potential machine failures.

The platform provides an interactive dashboard for machine monitoring, failure prediction, model evaluation, and machine data analysis.

Live Link: https://machina-iq.vercel.app/

## Features

- **Machine Failure Prediction:** Predict potential machine failures using machine learning models.
- **Model Comparison:** Evaluate Logistic Regression, Decision Tree, Random Forest, XGBoost, and SVM.
- **Machine Monitoring:** Visualize machine status and sensor information.
- **Failure Analysis:** Analyze different machine failure types.
- **Cluster Analysis:** Explore machine operating patterns using clustering.
- **Interactive Dashboard:** View machine insights through a web-based interface.

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Recharts
- Axios

**Backend**
- Python
- FastAPI
- Pandas
- NumPy
- Scikit-learn
- XGBoost
- Joblib

**Machine Learning**
- Logistic Regression
- Decision Tree
- Random Forest
- XGBoost
- Support Vector Machine (SVM)
- K-Means Clustering
- Principal Component Analysis (PCA)

## Dataset

This project uses the AI4I 2020 Predictive Maintenance Dataset for machine failure analysis and model development.

## Project Structure

```text
MachinaIQ/
│
├── backend/
│   ├── routes/
│   ├── saved_models/
│   ├── ai4i2020.csv
│   ├── main.py
│   ├── model_engine.py
│   ├── requirements.txt
│   └── schemas.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/PavanBilla2/MachinaIQ.git
cd MachinaIQ
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend API: http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend folder:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the frontend:

```bash
npm run dev
```

## Deployment

- **Backend:** Render
- **Frontend:** Vercel

**API Documentation:** https://machinaiq.onrender.com/docs

**Live Application:** Add your Vercel deployment URL here.

## Author

**Pavan Billa**

GitHub: [PavanBilla2](https://github.com/PavanBilla2)

---

*MachinaIQ – Turning Machine Data into Predictive Insights.*
