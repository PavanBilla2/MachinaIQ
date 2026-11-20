import React, { useState, useEffect } from 'react';
import { PageHeader, KpiCard, Card, SectionTitle, StatusBadge } from '../components/ui';
import { getFleetOverview, getFailureModes, getSensorDistributions } from '../api/client';
import {
  Cog,
  AlertTriangle,
  Percent,
  Timer,
  RotateCw,
  Zap,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const FAILURE_MODE_COLORS = ['#FF0055', '#FFE600', '#00F0FF', '#ececec', 'rgba(236,236,236,0.4)'];
const TYPE_COLORS = ['#00F0FF', '#FFE600', '#ececec'];

const SENSOR_UNITS = {
  'Air Temp (K)': 'K',
  'Process Temp (K)': 'K',
  RPM: 'RPM',
  'Torque (Nm)': 'Nm',
  'Tool Wear (min)': 'min',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-[#ececec]/20 bg-[#161618] px-3 py-2 text-xs shadow-xl">
      {label && (
        <p className="font-mono font-bold text-[#00F0FF] uppercase text-[11px] mb-1">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-[11px] text-[#ececec]/70">
          {p.name}:{' '}
          <span className="font-bold text-[#ececec]">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function Overview() {
  const [kpis, setKpis] = useState(null);
  const [failureModes, setFailureModes] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [typeDist, setTypeDist] = useState([]);
  const [failureByType, setFailureByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getFleetOverview(),
      getFailureModes(),
      getSensorDistributions(),
    ])
      .then(([ovRes, fmRes, senRes]) => {
        if (!active) return;
        let anySuccess = false;

        if (ovRes.status === 'fulfilled' && ovRes.value?.data) {
          anySuccess = true;
          const ov = ovRes.value.data;
          setKpis(ov);

          const rawTypeDist = ov.typeDistribution || ov.type_distribution;
          if (Array.isArray(rawTypeDist)) {
            setTypeDist(
              rawTypeDist.map((t, i) => ({
                ...t,
                color: t.color || TYPE_COLORS[i % TYPE_COLORS.length],
              }))
            );
          }

          const rawFailureByType = ov.failureByType || ov.failure_by_type;
          if (Array.isArray(rawFailureByType)) {
            setFailureByType(rawFailureByType);
          }
        }

        if (fmRes.status === 'fulfilled' && Array.isArray(fmRes.value?.data)) {
          anySuccess = true;
          setFailureModes(
            fmRes.value.data.map((m, i) => ({
              name: m.name,
              count: m.count,
              color: FAILURE_MODE_COLORS[i % FAILURE_MODE_COLORS.length],
            }))
          );
        }

        if (senRes.status === 'fulfilled' && Array.isArray(senRes.value?.data)) {
          anySuccess = true;
          setSensors(
            senRes.value.data.map((s) => ({
              ...s,
              unit: s.unit || SENSOR_UNITS[s.param] || '',
            }))
          );
        }

        setApiOnline(anySuccess);
        setApiError(
          anySuccess
            ? null
            : 'API_UNAVAILABLE :: UNABLE TO FETCH FLEET TELEMETRY FROM FASTAPI (/api/telemetry/*).'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const hasKpis = kpis !== null;
  const healthyCount = hasKpis
    ? Math.max(0, (kpis.totalMachines || 0) - (kpis.totalFailures || 0))
    : 0;
  const healthyPct =
    hasKpis && kpis.totalMachines
      ? ((healthyCount / kpis.totalMachines) * 100).toFixed(2)
      : 'N/A';

  const healthDist = hasKpis
    ? [
        { name: 'Healthy Operation', value: healthyCount, color: '#00F0FF' },
        { name: 'Recorded Failures', value: kpis.totalFailures || 0, color: '#FF0055' },
      ]
    : [];

  const topFailureMode = [...failureModes].sort((a, b) => (b.count || 0) - (a.count || 0))[0];

  const valOrFallback = (val, formatter) => {
    if (loading) return '...';
    if (!hasKpis || val === undefined || val === null || Number.isNaN(Number(val))) return 'N/A';
    return formatter ? formatter(Number(val)) : val;
  };

  return (
    <>
      <PageHeader
        breadcrumb="Telemetry Module [01]"
        title="Fleet Overview"
        subtitle="Fleet-wide condition monitoring, failure mode breakdown, and telemetry envelopes sourced live from FastAPI."
      >
        <StatusBadge
          status={apiOnline ? 'success' : 'warning'}
          label={
            apiOnline
              ? 'LIVE_TELEMETRY_ACTIVE'
              : loading
              ? 'LOADING_TELEMETRY'
              : 'STATUS: API_UNAVAILABLE'
          }
        />
      </PageHeader>

      {apiError && (
        <div className="mb-6 border border-[#FFE600] bg-[#FFE600]/10 px-4 py-3 font-mono text-xs text-[#FFE600]">
          {apiError}
        </div>
      )}

      {/* Fleet KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Total Machines"
          value={valOrFallback(kpis?.totalMachines, (v) => v.toLocaleString())}
          icon={Cog}
          status="secondary"
          sub="MONITORED_FLEET"
        />
        <KpiCard
          label="Total Failures"
          value={valOrFallback(kpis?.totalFailures, (v) => v.toLocaleString())}
          icon={AlertTriangle}
          status="danger"
          sub="VERIFIED_BREAKDOWNS"
        />
        <KpiCard
          label="Failure Rate"
          value={valOrFallback(kpis?.failureRate, (v) => v.toFixed(2))}
          unit={hasKpis ? '%' : undefined}
          icon={Percent}
          status="warning"
          sub={hasKpis ? `${healthyPct}% HEALTHY_UPTIME` : 'AWAITING_TELEMETRY'}
        />
        <KpiCard
          label="Avg Tool Wear"
          value={valOrFallback(kpis?.avgToolWear, (v) => v.toFixed(1))}
          unit={hasKpis ? 'min' : undefined}
          icon={Timer}
          status="warning"
          sub="LIMIT: 200_MIN"
        />
        <KpiCard
          label="Avg Torque"
          value={valOrFallback(kpis?.avgTorque, (v) => v.toFixed(1))}
          unit={hasKpis ? 'Nm' : undefined}
          icon={RotateCw}
          status="primary"
          sub="MEAN_SPINDLE_LOAD"
        />
        <KpiCard
          label="Avg Speed"
          value={valOrFallback(kpis?.avgRPM, (v) => Math.round(v).toLocaleString())}
          unit={hasKpis ? 'RPM' : undefined}
          icon={Zap}
          status="success"
          sub="NOMINAL_ROTATION"
        />
      </div>

      {/* Row 1: Failure Statistics + Machine Health Distribution + Quality Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <Card className="lg:col-span-6">
          <SectionTitle
            sub="Breakdown triggers classified by physical failure mechanism"
            right="EVENTS_COUNT"
          >
            Failure Mode Distribution
          </SectionTitle>
          {failureModes.length === 0 ? (
            <div className="h-[260px] bg-[#111113] border border-dashed border-[#ececec]/15 flex items-center justify-center font-mono text-[11px] uppercase tracking-widest text-[#ececec]/50">
              {loading ? 'LOADING_FAILURE_MODES...' : 'NO_VISUAL_DATA_AVAILABLE'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={failureModes} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="rgba(236, 236, 236, 0.08)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: 'rgba(236, 236, 236, 0.55)', fontSize: 10, fontFamily: 'Space Mono' }}
                  axisLine={{ stroke: 'rgba(236, 236, 236, 0.15)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#ececec', fontSize: 10, fontFamily: 'Space Mono' }}
                  width={165}
                  axisLine={{ stroke: 'rgba(236, 236, 236, 0.15)' }}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Events" radius={0} maxBarSize={18}>
                  {failureModes.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle
            sub={
              hasKpis
                ? `${healthyPct}% nominal vs ${Number(kpis.failureRate).toFixed(2)}% failed`
                : 'Fleet health proportions'
            }
            right="SPLIT"
          >
            Machine Health
          </SectionTitle>
          {healthDist.length === 0 ? (
            <div className="h-[260px] bg-[#111113] border border-dashed border-[#ececec]/15 flex items-center justify-center font-mono text-[11px] uppercase tracking-widest text-[#ececec]/50">
              {loading ? 'LOADING...' : 'NO_VISUAL_DATA_AVAILABLE'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={healthDist}
                  cx="50%"
                  cy="46%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#0d0d0e"
                  strokeWidth={2}
                >
                  {healthDist.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="square"
                  iconSize={8}
                  formatter={(v) => (
                    <span className="font-mono text-[10px] uppercase text-[#ececec]/70">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle sub="Quality tier split reported by telemetry API" right="TIERS">
            Fleet Composition
          </SectionTitle>
          {typeDist.length === 0 ? (
            <div className="h-[260px] bg-[#111113] border border-dashed border-[#ececec]/15 flex items-center justify-center text-center px-4 font-mono text-[11px] uppercase tracking-widest text-[#ececec]/50">
              {loading ? 'LOADING...' : 'NO_TYPE_DISTRIBUTION_FROM_API'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={typeDist}
                  cx="50%"
                  cy="46%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#0d0d0e"
                  strokeWidth={2}
                >
                  {typeDist.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="square"
                  iconSize={8}
                  formatter={(v) => (
                    <span className="font-mono text-[10px] uppercase text-[#ececec]/70">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Row 2: Failure by Type + Sensor Parameter Ranges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <Card className="lg:col-span-6">
          <SectionTitle
            sub="Operational status segmented across product quality variants"
            right="STACKED_BAR"
          >
            Machine Status by Product Type
          </SectionTitle>
          {failureByType.length === 0 ? (
            <div className="h-[250px] bg-[#111113] border border-dashed border-[#ececec]/15 flex items-center justify-center font-mono text-[11px] uppercase tracking-widest text-[#ececec]/50">
              {loading ? 'LOADING_STATUS_BREAKDOWN...' : 'NO_PRODUCT_TYPE_BREAKDOWN_FROM_API'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={failureByType} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(236, 236, 236, 0.08)" />
                <XAxis
                  dataKey="type"
                  tick={{ fill: '#ececec', fontSize: 10, fontFamily: 'Space Mono' }}
                  axisLine={{ stroke: 'rgba(236, 236, 236, 0.15)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(236, 236, 236, 0.55)', fontSize: 10, fontFamily: 'Space Mono' }}
                  axisLine={{ stroke: 'rgba(236, 236, 236, 0.15)' }}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="normal"
                  name="Normal Operation"
                  stackId="a"
                  fill="rgba(236, 236, 236, 0.16)"
                  radius={0}
                />
                <Bar
                  dataKey="failure"
                  name="Machine Failure"
                  stackId="a"
                  fill="#FF0055"
                  radius={0}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="square"
                  iconSize={8}
                  formatter={(v) => (
                    <span className="font-mono text-[10px] uppercase text-[#ececec]/70">{v}</span>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-6">
          <SectionTitle
            sub="Observed production telemetry boundaries (Min / Mean / Max)"
            right="BOUNDS"
          >
            Sensor Parameter Envelopes
          </SectionTitle>
          {sensors.length === 0 ? (
            <div className="h-[230px] bg-[#111113] border border-dashed border-[#ececec]/15 flex items-center justify-center font-mono text-[11px] uppercase tracking-widest text-[#ececec]/50">
              {loading ? 'LOADING_SENSOR_ENVELOPES...' : 'NO_VISUAL_DATA_AVAILABLE'}
            </div>
          ) : (
            <div className="space-y-4 mt-1">
              {sensors.map((s) => {
                const range = s.max - s.min || 1;
                const pct = Math.max(0, Math.min(100, ((s.avg - s.min) / range) * 100));
                return (
                  <div key={s.param}>
                    <div className="flex justify-between items-baseline text-xs mb-1.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#ececec]">
                        {s.param}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#00F0FF]">
                        {Number(s.avg).toLocaleString()} {s.unit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden bg-[#0d0d0e] border border-[#ececec]/15">
                      <div
                        className="h-full bg-[#00F0FF] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-[#ececec]/45 font-mono">
                      <span>MIN: {Number(s.min).toLocaleString()}</span>
                      <span>MAX: {Number(s.max).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Operational Insights */}
      <Card elevated>
        <SectionTitle
          sub="Key diagnostic patterns derived from live fleet telemetry endpoints"
          right="DIAGNOSTIC_SYNTHESIS"
        >
          Operational Fleet Insights
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          <div className="space-y-2 border-t md:border-t-0 md:border-r border-[#ececec]/10 pt-3 md:pt-0 md:pr-6">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-bold text-[#FF0055]">
              <AlertTriangle size={14} />
              <span>Dominant Trigger: {topFailureMode?.name || 'N/A'}</span>
            </div>
            <p className="text-xs text-[#ececec]/60 leading-relaxed font-light">
              {topFailureMode
                ? `${topFailureMode.name} accounts for ${topFailureMode.count.toLocaleString()} verified breakdown events in the live telemetry store.`
                : 'Connect the FastAPI backend to compute dominant breakdown triggers.'}
            </p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-r border-[#ececec]/10 pt-3 md:pt-0 md:pr-6">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-bold text-[#FFE600]">
              <TrendingUp size={14} />
              <span>Fleet Breakdown Incidence</span>
            </div>
            <p className="text-xs text-[#ececec]/60 leading-relaxed font-light">
              {hasKpis
                ? `Verified failure rate stands at ${Number(kpis.failureRate).toFixed(2)}% across ${kpis.totalMachines?.toLocaleString()} monitored production logs.`
                : 'Awaiting live overview telemetry from FastAPI.'}
            </p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 pt-3 md:pt-0">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-bold text-[#00F0FF]">
              <ShieldCheck size={14} />
              <span>Preventive Maintenance Window</span>
            </div>
            <p className="text-xs text-[#ececec]/60 leading-relaxed font-light">
              {hasKpis
                ? `Fleet mean tool wear is ${Number(kpis.avgToolWear).toFixed(1)} min against the 200 min TWF limit. Scheduling bit swaps ahead of limit mitigates TWF/OSF risk.`
                : 'Awaiting sensor envelope telemetry from FastAPI.'}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
