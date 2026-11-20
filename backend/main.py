from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import model_engine
from routes import telemetry, predict, models, clusters

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load ML artifacts and cache on startup
    print("🚀 Initializing MachinaIQ Inference Engine...")
    model_engine.load_or_train()
    print("✓ Predictive Maintenance Models & Scalers loaded into memory.")
    yield
    print("Shutting down API service.")

app = FastAPI(
    title="MachinaIQ — Industrial Machine Failure Intelligence API",
    description="Enterprise REST API for real-time telemetry analytics, failure classification & operational clustering",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration allowing React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Route Modules
app.include_router(telemetry.router, prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(clusters.router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "MachinaIQ Predictive Maintenance Platform",
        "version": "2.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
