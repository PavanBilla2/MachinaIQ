import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader, Card, SectionTitle, StatusBadge } from '../components/ui';
import { predictSingle } from '../api/client';
import {
  Cpu,
  ThermometerSun,
  Gauge,
  RotateCw,
  Timer,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Activity,
  Cog,
} from 'lucide-react';

const MODELS = [
  'Random Forest',
  'XGBoost',
  'SVM',
  'Decision Tree',
  'Logistic Regression',
];

const PRESETS = {
  nominal: { label: 'Nominal Baseline', type: 'L', air: 298.1, proc: 308.6, rpm: 1550, torque: 42.0, wear: 30 },
  twf: { label: 'Tool Wear Limit', type: 'L', air: 298.5, proc: 309.0, rpm: 1420, torque: 52.0, wear: 225 },
  hdf: { label: 'Heat Overload', type: 'L', air: 302.5, proc: 310.2, rpm: 1320, torque: 58.0, wear: 110 },
  pwf: { label: 'Power Surge', type: 'M', air: 299.0, proc: 309.5, rpm: 2750, torque: 68.0, wear: 140 },
  osf: { label: 'Overstrain Stress', type: 'L', air: 301.0, proc: 311.0, rpm: 1360, torque: 65.0, wear: 210 },
};

const CLUSTER_LABELS = {
  0: 'CLUSTER_0 :: HIGH_THERMAL_WEAR',
  1: 'CLUSTER_1 :: NOMINAL_BASELINE',
  2: 'CLUSTER_2 :: HIGH_RPM_LOW_TORQUE',
};

function SliderInput({ label, icon: Icon, value, onChange, min, max, step = 1, unit }) {
  const [draft, setDraft] = React.useState(String(value));
  const [editing, setEditing] = React.useState(false);

  const commitDraft = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setDraft(String(clamped));
    } else {
      setDraft(String(value));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs gap-2">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#ececec]/65 min-w-0">
          <Icon size={13} className="text-[#00F0FF] shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={editing ? draft : value}
            onFocus={() => {
              setEditing(true);
              setDraft(String(value));
            }}
            onChange={(e) => {
              setDraft(e.target.value);
              const parsed = parseFloat(e.target.value);
              if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
                onChange(parsed);
              }
            }}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitDraft();
                e.currentTarget.blur();
              }
            }}
            aria-label={`${label} (${unit})`}
            className="w-20 text-right font-mono text-xs font-bold text-[#ececec] bg-[#0d0d0e] px-2 py-1 border border-[#ececec]/20 focus:border-[#00F0FF] outline-none"
          />
          {unit && <span className="font-mono text-[10px] text-[#ececec]/45 w-8">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 appearance-none cursor-pointer bg-[#0d0d0e] border border-[#ececec]/15"
      />
    </div>
  );
}

export default function Simulator() {
  const [inputs, setInputs] = useState({
    type: 'L',
    air: 298.1,
    proc: 308.6,
    rpm: 1550,
    torque: 42.0,
    wear: 30,
  });
  const [model, setModel] = useState('Random Forest');
  const [cncImgFailed, setCncImgFailed] = useState(false);
  const [evalMs, setEvalMs] = useState(null);
  const [activePreset, setActivePreset] = useState('nominal');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const reqIdRef = useRef(0);

  const runPrediction = useCallback(async (sensorInputs, selectedModel) => {
    const reqId = ++reqIdRef.current;
    const t0 = performance.now();
    try {
      const res = await predictSingle({
        air_temp: sensorInputs.air,
        proc_temp: sensorInputs.proc,
        rot_speed: sensorInputs.rpm,
        torque: sensorInputs.torque,
        tool_wear: sensorInputs.wear,
        machine_type: sensorInputs.type,
        model: selectedModel,
      });
      if (reqId !== reqIdRef.current) return;
      setResult(res.data || null);
      setApiError(null);
      setEvalMs(Math.round(performance.now() - t0));
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setResult(null);
      setEvalMs(null);
      const detail = err?.response?.data?.detail;
      setApiError(
        detail
          ? `BACKEND_ERROR :: ${detail}`
          : 'API_UNAVAILABLE :: UNABLE TO REACH /api/predict/single. VERIFY FASTAPI BACKEND IS RUNNING.'
      );
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const reqId = ++reqIdRef.current;
    const t0 = performance.now();
    predictSingle({
      air_temp: 298.1,
      proc_temp: 308.6,
      rot_speed: 1550,
      torque: 42.0,
      tool_wear: 30,
      machine_type: 'L',
      model: 'Random Forest',
    })
      .then((res) => {
        if (!active || reqId !== reqIdRef.current) return;
        setResult(res.data || null);
        setApiError(null);
        setEvalMs(Math.round(performance.now() - t0));
      })
      .catch((err) => {
        if (!active || reqId !== reqIdRef.current) return;
        setResult(null);
        setEvalMs(null);
        const detail = err?.response?.data?.detail;
        setApiError(
          detail
            ? `BACKEND_ERROR :: ${detail}`
            : 'API_UNAVAILABLE :: UNABLE TO REACH /api/predict/single. VERIFY FASTAPI BACKEND IS RUNNING.'
        );
      })
      .finally(() => {
        if (active && reqId === reqIdRef.current) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const setParam = (key, val) => {
    setActivePreset(null);
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const applyPreset = (key) => {
    const p = PRESETS[key];
    const nextInputs = {
      type: p.type,
      air: p.air,
      proc: p.proc,
      rpm: p.rpm,
      torque: p.torque,
      wear: p.wear,
    };
    setActivePreset(key);
    setInputs(nextInputs);
    setLoading(true);
    setApiError(null);
    runPrediction(nextInputs, model);
  };

  const handleModelChange = (nextModel) => {
    setModel(nextModel);
    setLoading(true);
    setApiError(null);
    runPrediction(inputs, nextModel);
  };

  const handlePredict = () => {
    setLoading(true);
    setApiError(null);
    runPrediction(inputs, model);
  };

  const selectedModelProb =
    typeof result?.all_probs?.[model] === 'number'
      ? result.all_probs[model]
      : typeof result?.failure_prob === 'number'
      ? result.failure_prob
      : null;

  const hasPrediction = selectedModelProb !== null && !Number.isNaN(selectedModelProb);
  const anyPhysicsRisk = Object.values(result?.modes || {}).some((m) => m?.risk);

  const conditionState = !hasPrediction
    ? 'unavailable'
    : selectedModelProb >= 0.5
    ? 'failure'
    : selectedModelProb >= 0.25 || anyPhysicsRisk
    ? 'warning'
    : 'healthy';

  const stateMeta = {
    healthy: {
      label: 'Healthy Operating State',
      short: 'LOW_RISK',
      color: '#00F0FF',
      bg: 'rgba(0, 240, 255, 0.08)',
      border: 'rgba(0, 240, 255, 0.45)',
      badgeStatus: 'success',
      Icon: CheckCircle2,
    },
    warning: {
      label: 'Elevated Risk — Inspect',
      short: 'WARNING',
      color: '#FFE600',
      bg: 'rgba(255, 230, 0, 0.08)',
      border: 'rgba(255, 230, 0, 0.45)',
      badgeStatus: 'warning',
      Icon: AlertTriangle,
    },
    failure: {
      label: 'Potential Failure Detected',
      short: 'CRITICAL_RISK',
      color: '#FF0055',
      bg: 'rgba(255, 0, 85, 0.08)',
      border: 'rgba(255, 0, 85, 0.45)',
      badgeStatus: 'danger',
      Icon: AlertCircle,
    },
    unavailable: {
      label: loading ? 'Evaluating Telemetry...' : 'Prediction Unavailable',
      short: loading ? 'PENDING' : 'API_OFFLINE',
      color: 'rgba(236, 236, 236, 0.55)',
      bg: 'rgba(236, 236, 236, 0.04)',
      border: 'rgba(236, 236, 236, 0.2)',
      badgeStatus: 'info',
      Icon: Activity,
    },
  }[conditionState];

  const StateIcon = stateMeta.Icon;
  const machineHealth = hasPrediction ? ((1 - selectedModelProb) * 100).toFixed(1) : null;
  const needleRotation = hasPrediction
    ? -90 + Math.min(1, Math.max(0, selectedModelProb)) * 180
    : -90;
  const computedPower = Math.round(inputs.torque * ((2 * Math.PI) / 60) * inputs.rpm);

  const consensusModels = Array.from(
    new Set([...MODELS, ...Object.keys(result?.all_probs || {})])
  );

  return (
    <>
      <PageHeader
        breadcrumb="Simulator Module [02]"
        title="Digital Twin"
        subtitle="Configure live CNC sensor parameters and evaluate failure probabilities using trained ML classifiers and physical thresholds."
      >
        <StatusBadge
          status={stateMeta.badgeStatus}
          label={
            hasPrediction
              ? `${stateMeta.short} :: ${(selectedModelProb * 100).toFixed(1)}%`
              : stateMeta.short
          }
        />
      </PageHeader>

      {/* Preset Scenario Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ececec]/50 mr-2">
          Test Scenarios:
        </span>
        {Object.entries(PRESETS).map(([k, p]) => {
          const isSelected = activePreset === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => applyPreset(k)}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-1 focus-visible:outline-[#00F0FF] ${
                isSelected
                  ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF] font-bold'
                  : 'bg-[#161618] border-[#ececec]/15 text-[#ececec]/60 hover:text-[#ececec] hover:border-[#ececec]/40'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Top Grid: Digital Twin Visual (Left) | Sensor Input Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-stretch">
        <Card className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-[#ececec]">
                Industrial CNC Machining Center
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#ececec]/50 mt-1">
                CHASSIS CNC-AI4I-2020 · TYPE_{inputs.type} ·{' '}
                {result?.cluster !== undefined && result?.cluster !== null
                  ? CLUSTER_LABELS[result.cluster] || `CLUSTER_${result.cluster}`
                  : 'CLUSTER_UNASSIGNED'}
              </p>
            </div>
            <StatusBadge
              status={stateMeta.badgeStatus}
              label={
                conditionState === 'healthy'
                  ? 'NOMINAL'
                  : conditionState === 'warning'
                  ? 'CAUTION'
                  : conditionState === 'failure'
                  ? 'CRITICAL'
                  : stateMeta.short
              }
            />
          </div>

          <div className="relative my-2 flex items-center justify-center min-h-[300px] bg-[#111113] border border-[#ececec]/10 overflow-hidden p-4">
            {!cncImgFailed ? (
              <img
                src="/industrial-cnc.png"
                alt="Industrial CNC Machining Center Digital Twin"
                referrerPolicy="no-referrer"
                onError={() => setCncImgFailed(true)}
                className="max-h-[250px] object-contain drop-shadow-[0_14px_26px_rgba(0,0,0,0.85)]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#00F0FF] gap-2 py-12">
                <Cog size={48} />
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#ececec]/55">
                  CNC Machining Center Digital Twin
                </span>
              </div>
            )}

            {/* Top-Left HUD: Machine Health */}
            <div className="absolute top-3 left-3 bg-[#0d0d0e]/95 border border-[#ececec]/15 px-3 py-2 min-w-[144px] corner-bracket">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#ececec]/55 flex items-center gap-1.5">
                <Activity size={11} style={{ color: stateMeta.color }} />
                <span>Machine Health</span>
              </div>
              <div className="font-display font-extrabold text-xl text-[#ececec] mt-0.5 tabular-nums">
                {machineHealth !== null ? `${machineHealth}%` : 'N/A'}
              </div>
              <div className="w-full h-1 bg-[#161618] mt-1.5 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${machineHealth !== null ? machineHealth : 0}%`,
                    backgroundColor: stateMeta.color,
                  }}
                />
              </div>
            </div>

            {/* Top-Right HUD: Spindle Speed */}
            <div className="absolute top-3 right-3 bg-[#0d0d0e]/95 border border-[#ececec]/15 px-3 py-2 min-w-[132px]">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#ececec]/55 flex items-center gap-1.5">
                <RotateCw size={11} className="text-[#00F0FF]" />
                <span>Spindle Speed</span>
              </div>
              <div className="font-mono text-sm font-bold text-[#ececec] mt-0.5">
                {inputs.rpm.toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-[#ececec]/50">RPM</span>
              </div>
            </div>

            {/* Bottom-Left HUD: Torque */}
            <div className="absolute bottom-3 left-3 bg-[#0d0d0e]/95 border border-[#ececec]/15 px-3 py-2 min-w-[132px]">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#ececec]/55 flex items-center gap-1.5">
                <Gauge size={11} className="text-[#FFE600]" />
                <span>Torque Load</span>
              </div>
              <div className="font-mono text-sm font-bold text-[#ececec] mt-0.5">
                {inputs.torque.toFixed(1)}{' '}
                <span className="text-[10px] font-normal text-[#ececec]/50">Nm</span>
              </div>
            </div>

            {/* Bottom-Right HUD: Tool Wear */}
            <div className="absolute bottom-3 right-3 bg-[#0d0d0e]/95 border border-[#ececec]/15 px-3 py-2 min-w-[132px]">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#ececec]/55 flex items-center gap-1.5">
                <Wrench
                  size={11}
                  style={{
                    color:
                      inputs.wear >= 200
                        ? '#FF0055'
                        : inputs.wear >= 170
                        ? '#FFE600'
                        : '#00F0FF',
                  }}
                />
                <span>Tool Wear</span>
              </div>
              <div className="font-mono text-sm font-bold text-[#ececec] mt-0.5">
                {inputs.wear}{' '}
                <span className="text-[10px] font-normal text-[#ececec]/50">min</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-[#ececec]/55 pt-3 border-t border-[#ececec]/10">
            <span>
              AIR: <strong className="text-[#ececec]">{inputs.air.toFixed(1)} K</strong>
            </span>
            <span>
              PROC: <strong className="text-[#ececec]">{inputs.proc.toFixed(1)} K</strong>
            </span>
            <span>
              ΔT: <strong className="text-[#ececec]">{(inputs.proc - inputs.air).toFixed(1)} K</strong>
            </span>
            <span>
              POWER: <strong className="text-[#00F0FF]">{computedPower.toLocaleString()} W</strong>
            </span>
          </div>
        </Card>

        {/* Right: Sensor Controls */}
        <Card elevated className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 mb-5 border-b border-[#ececec]/10">
              <h2 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-[#ececec]">
                Sensor Parameters
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase text-[#ececec]/50">Quality:</span>
                <div className="flex gap-1 bg-[#0d0d0e] p-1 border border-[#ececec]/15">
                  {['L', 'M', 'H'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setParam('type', t)}
                      className={`px-2.5 py-0.5 font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                        inputs.type === t
                          ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]'
                          : 'text-[#ececec]/55 hover:text-[#ececec] border border-transparent'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <SliderInput
                label="Air Temperature"
                icon={ThermometerSun}
                value={inputs.air}
                onChange={(v) => setParam('air', v)}
                min={295.0}
                max={305.0}
                step={0.1}
                unit="K"
              />
              <SliderInput
                label="Process Temperature"
                icon={ThermometerSun}
                value={inputs.proc}
                onChange={(v) => setParam('proc', v)}
                min={305.0}
                max={315.0}
                step={0.1}
                unit="K"
              />
              <SliderInput
                label="Rotational Speed"
                icon={RotateCw}
                value={inputs.rpm}
                onChange={(v) => setParam('rpm', v)}
                min={1100}
                max={2900}
                step={10}
                unit="RPM"
              />
              <SliderInput
                label="Torque"
                icon={Gauge}
                value={inputs.torque}
                onChange={(v) => setParam('torque', v)}
                min={3.5}
                max={80.0}
                step={0.5}
                unit="Nm"
              />
              <SliderInput
                label="Tool Wear"
                icon={Timer}
                value={inputs.wear}
                onChange={(v) => setParam('wear', v)}
                min={0}
                max={260}
                step={1}
                unit="min"
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="simulator-model-select"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#ececec]/55 block mb-2"
              >
                Active Predictive Model
              </label>
              <select
                id="simulator-model-select"
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3 py-2 font-mono text-xs font-bold border border-[#ececec]/20 bg-[#0d0d0e] text-[#ececec] outline-none focus:border-[#00F0FF] transition-colors"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            {apiError && (
              <p className="font-mono text-[10px] text-[#FFE600] mb-2 leading-relaxed">
                {apiError}
              </p>
            )}
            <button
              type="button"
              onClick={handlePredict}
              disabled={loading}
              className="w-full py-3 px-4 font-mono text-xs font-bold uppercase tracking-[0.15em] bg-[#00F0FF] text-[#0d0d0e] hover:bg-[#33f3ff] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ececec]"
            >
              <Cpu size={15} />
              <span>{loading ? 'Evaluating Telemetry...' : 'Predict Failure'}</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Prediction Result & Probability Gauge | Model Consensus & Physics Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-7">
          <SectionTitle
            sub={`Primary classifier: ${model}${evalMs !== null ? ` · Response: ${evalMs} ms` : ''}`}
            right="INFERENCE"
          >
            Prediction Result & Failure Probability
          </SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pb-5 border-b border-[#ececec]/10">
            {/* Condition State Summary */}
            <div className="flex items-center gap-3.5 p-4 border border-[#ececec]/15 bg-[#111113]">
              <div
                className="w-11 h-11 flex items-center justify-center shrink-0 border"
                style={{ backgroundColor: stateMeta.bg, borderColor: stateMeta.border }}
              >
                <StateIcon size={22} style={{ color: stateMeta.color }} />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#ececec]/50">
                  Condition Verdict
                </div>
                <div
                  className="font-mono text-xs sm:text-sm font-bold uppercase truncate mt-0.5"
                  style={{ color: stateMeta.color }}
                >
                  {stateMeta.label}
                </div>
                <div className="font-mono text-[11px] text-[#ececec]/60 mt-1">
                  PROBABILITY:{' '}
                  <strong className="text-[#ececec]">
                    {hasPrediction ? `${(selectedModelProb * 100).toFixed(1)}%` : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Semi-Circle Probability Gauge */}
            <div className="flex flex-col items-center justify-center p-4 border border-[#ececec]/15 bg-[#111113]">
              <div className="relative w-40 h-20 overflow-hidden flex items-end justify-center">
                <svg viewBox="0 0 100 50" className="w-40 h-20" aria-hidden="true">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1d1d20" strokeWidth="8" />
                  <path d="M 10 50 A 40 40 0 0 1 36 21" fill="none" stroke="#00F0FF" strokeWidth="8" />
                  <path d="M 36 21 A 40 40 0 0 1 64 21" fill="none" stroke="#FFE600" strokeWidth="8" />
                  <path d="M 64 21 A 40 40 0 0 1 90 50" fill="none" stroke="#FF0055" strokeWidth="8" />
                </svg>
                <div
                  className="absolute bottom-0 w-1 h-14 bg-[#ececec] origin-bottom transition-transform duration-300"
                  style={{ transform: `rotate(${needleRotation}deg)` }}
                />
                <div className="absolute bottom-0 w-3 h-3 bg-[#ececec] border-2 border-[#0d0d0e]" />
              </div>
              <div
                className="font-mono text-xs font-bold mt-2 uppercase tracking-wider"
                style={{ color: stateMeta.color }}
              >
                {hasPrediction ? `${(selectedModelProb * 100).toFixed(1)}%` : 'N/A'}{' '}
                <span className="text-[10px] font-normal text-[#ececec]/50">
                  ({stateMeta.short})
                </span>
              </div>
            </div>
          </div>

          {/* Physical Failure Modes Breakdown */}
          {result?.modes ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
              {Object.entries(result.modes).map(([code, info]) => (
                <div
                  key={code}
                  className="p-3 border text-left"
                  style={{
                    backgroundColor: info.risk ? 'rgba(255, 0, 85, 0.08)' : '#111113',
                    borderColor: info.risk ? '#FF0055' : 'rgba(236, 236, 236, 0.12)',
                  }}
                >
                  <div className="flex items-center justify-between font-mono text-xs font-bold mb-1.5">
                    <span style={{ color: info.risk ? '#FF0055' : '#00F0FF' }}>{code}</span>
                    {info.risk ? (
                      <AlertCircle size={13} className="text-[#FF0055]" />
                    ) : (
                      <CheckCircle2 size={13} className="text-[#00F0FF]" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#ececec] font-mono truncate">{info.val}</div>
                  <div className="font-mono text-[10px] text-[#ececec]/45 truncate mt-1">
                    LIMIT: {info.limit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 p-4 bg-[#111113] border border-dashed border-[#ececec]/15 font-mono text-[11px] uppercase tracking-wider text-[#ececec]/50 text-center">
              {loading ? 'EVALUATING_PHYSICAL_THRESHOLDS...' : 'NO_PHYSICAL_MODE_REPORT_FROM_API'}
            </div>
          )}
        </Card>

        {/* Right: Multi-Model Consensus & Operational Recommendation */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <SectionTitle
              sub="Side-by-side probability across all five trained backend classifiers"
              right="CONSENSUS"
            >
              Multi-Model Consensus
            </SectionTitle>

            <div className="space-y-4 mb-6">
              {consensusModels.map((name) => {
                const rawProb = result?.all_probs?.[name];
                const isNumeric = typeof rawProb === 'number' && !Number.isNaN(rawProb);
                const pct = isNumeric ? Math.min(100, Math.max(0, rawProb * 100)) : 0;
                const barColor =
                  pct >= 50 ? '#FF0055' : pct >= 25 ? '#FFE600' : '#00F0FF';
                const isSelected = name === model;
                return (
                  <div key={name}>
                    <div className="flex justify-between items-center font-mono text-[11px] mb-1.5">
                      <span className={isSelected ? 'font-bold text-[#00F0FF]' : 'text-[#ececec]'}>
                        {name} {isSelected ? '[ACTIVE]' : ''}
                      </span>
                      <span className="font-bold text-[#ececec]">
                        {isNumeric ? `${pct.toFixed(1)}%` : loading ? '...' : 'N/A'}
                      </span>
                    </div>
                    <div className="h-2 bg-[#0d0d0e] border border-[#ececec]/15 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${isNumeric ? pct : 0}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#ececec]/10 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider font-bold text-[#ececec]">
              Diagnostic Action
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#ececec]/60 font-light leading-relaxed">
              <StateIcon size={14} className="shrink-0 mt-0.5" style={{ color: stateMeta.color }} />
              <span>
                {conditionState === 'unavailable'
                  ? 'Awaiting live inference response from FastAPI (/api/predict/single).'
                  : conditionState === 'healthy'
                  ? 'All physical thresholds and classifier risk probabilities remain within nominal tolerances. Continue routine monitoring.'
                  : conditionState === 'warning'
                  ? 'Elevated stress or physical boundary proximity detected. Schedule preventive inspection before the next production run.'
                  : 'High breakdown likelihood detected. Halt spindle cycle, inspect cooling/torque load, and dispatch maintenance.'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
