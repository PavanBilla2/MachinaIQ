import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Fleet & Telemetry ──
export const getFleetOverview = () => api.get('/telemetry/overview');
export const getFailureModes = () => api.get('/telemetry/failure-modes');
export const getSensorDistributions = () => api.get('/telemetry/sensors');

// ── Single & Batch Prediction ──
export const predictSingle = (payload) => api.post('/predict/single', payload);
export const predictBatch = (formData) =>
  api.post('/predict/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });

// ── Model Evaluation ──
export const getModelBenchmark = () => api.get('/models/benchmark');
export const getROCCurves = () => api.get('/models/roc-curves');
export const getConfusionMatrix = (model) =>
  api.get('/models/confusion-matrix', { params: { model } });
export const getFeatureImportance = () => api.get('/models/feature-importance');

// ── Clustering ──
export const getClusterOverview = () => api.get('/clusters/overview');
export const getElbowCurve = () => api.get('/clusters/elbow');
export const getSilhouette = () => api.get('/clusters/silhouette');
export const getPCAProjection = () => api.get('/clusters/pca');

export default api;
