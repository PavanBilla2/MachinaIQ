import React, { useState } from 'react';
import { PageHeader, Card, KpiCard } from '../components/ui';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  ClipboardList,
} from 'lucide-react';
import { predictBatch } from '../api/client';

function parseScoredCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const idx = (name) => headers.indexOf(name);

  const iId = idx('Product ID');
  const iType = idx('Type');
  const iAir = idx('Air temperature [K]');
  const iProc = idx('Process temperature [K]');
  const iRpm = idx('Rotational speed [rpm]');
  const iTorque = idx('Torque [Nm]');
  const iWear = idx('Tool wear [min]');
  const iRisk = idx('Predicted_Failure_Risk_Pct');
  const iStatus = idx('Dispatch_Urgency');

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < headers.length) continue;
    parsed.push({
      id: iId >= 0 && cols[iId] ? cols[iId] : `UNIT-${i}`,
      type: iType >= 0 && cols[iType] ? cols[iType] : 'L',
      air: iAir >= 0 && Number.isFinite(Number(cols[iAir])) ? Number(cols[iAir]) : 0,
      proc: iProc >= 0 && Number.isFinite(Number(cols[iProc])) ? Number(cols[iProc]) : 0,
      rpm: iRpm >= 0 && Number.isFinite(Number(cols[iRpm])) ? Number(cols[iRpm]) : 0,
      torque: iTorque >= 0 && Number.isFinite(Number(cols[iTorque])) ? Number(cols[iTorque]) : 0,
      wear: iWear >= 0 && Number.isFinite(Number(cols[iWear])) ? Number(cols[iWear]) : 0,
      risk: iRisk >= 0 && Number.isFinite(Number(cols[iRisk])) ? Number(cols[iRisk]) : 0,
      status: iStatus >= 0 && cols[iStatus] ? cols[iStatus] : 'ROUTINE',
    });
  }
  return parsed;
}

export default function BatchReports() {
  const [records, setRecords] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessageType('info');
      setMessage(`FILE_STAGED :: "${file.name}" READY FOR BATCH SCORING VIA /api/predict/batch.`);
    }
  };

  const runBatchEvaluation = async () => {
    if (!selectedFile) {
      setMessageType('warning');
      setMessage('NO_CSV_SELECTED :: SELECT A CSV FILE FIRST TO RUN BATCH PREDICTION.');
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await predictBatch(formData);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const csvText = await blob.text();
      const parsed = parseScoredCsv(csvText);
      if (parsed.length > 0) {
        setRecords(parsed.sort((a, b) => b.risk - a.risk));
      } else {
        setRecords([]);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `predicted_${selectedFile.name}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessageType('success');
      setMessage(
        `BATCH_SCORING_COMPLETE (${parsed.length} RECORDS) :: DOWNLOADED predicted_${selectedFile.name}`
      );
    } catch {
      setMessageType('warning');
      setMessage(
        'BATCH_REQUEST_FAILED :: VERIFY FASTAPI BACKEND IS RUNNING AND CSV INCLUDES REQUIRED AI4I 2020 COLUMNS.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const exportCurrentTableToCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'Product ID',
      'Type',
      'Air Temp [K]',
      'Process Temp [K]',
      'Rotational Speed [RPM]',
      'Torque [Nm]',
      'Tool Wear [min]',
      'Failure Risk (%)',
      'Dispatch Urgency',
    ];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.type,
      r.air,
      r.proc,
      r.rpm,
      r.torque,
      r.wear,
      r.risk,
      r.status,
    ]);
    const csvString = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'machinaiq_work_orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const filteredRecords = records.filter((r) => {
    const matchesFilter = filter === 'ALL' || r.status === filter;
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const criticalCount = records.filter((r) => r.status === 'CRITICAL DISPATCH').length;
  const inspectionCount = records.filter((r) => r.status === 'INSPECTION NEEDED').length;
  const routineCount = records.filter((r) => r.status === 'ROUTINE').length;

  return (
    <>
      <PageHeader
        breadcrumb="Dispatch Module [05]"
        title="Batch Reports"
        subtitle="High-throughput CSV batch scoring, maintenance urgency triage, and exportable dispatch reports."
      >
        <button
          type="button"
          onClick={exportCurrentTableToCSV}
          disabled={filteredRecords.length === 0}
          className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider border border-[#ececec]/25 bg-[#161618] text-[#ececec] hover:border-[#00F0FF] hover:text-[#00F0FF] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download size={14} className="text-[#00F0FF]" />
          <span>Export Work Orders (CSV)</span>
        </button>
      </PageHeader>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Evaluated Units"
          value={records.length.toLocaleString()}
          icon={ClipboardList}
          status="primary"
          sub="SCORED_QUEUE"
        />
        <KpiCard
          label="Critical Dispatch"
          value={criticalCount.toLocaleString()}
          icon={AlertCircle}
          status="danger"
          sub="RISK > 50%"
        />
        <KpiCard
          label="Inspection Needed"
          value={inspectionCount.toLocaleString()}
          icon={AlertTriangle}
          status="warning"
          sub="RISK 25% – 50%"
        />
        <KpiCard
          label="Routine Monitoring"
          value={routineCount.toLocaleString()}
          icon={CheckCircle2}
          status="success"
          sub="RISK <= 25%"
        />
      </div>

      {/* CSV Ingestion Panel */}
      <Card elevated className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-[#0d0d0e] border border-[#00F0FF]/40 text-[#00F0FF]">
              <Upload size={18} />
            </div>
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#ececec]">
                Ingest Production Telemetry CSV
              </div>
              <div className="text-xs text-[#ececec]/55 font-light mt-1">
                Requires AI4I columns: Type, Air/Process temp [K], Rotational speed [rpm], Torque [Nm], Tool wear [min]
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <input
              type="file"
              accept=".csv"
              id="csv-upload-input"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="csv-upload-input"
              className="px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider cursor-pointer border border-[#ececec]/20 bg-[#0d0d0e] text-[#ececec] hover:border-[#00F0FF] transition-colors whitespace-nowrap"
            >
              {selectedFile ? selectedFile.name : 'Select CSV File...'}
            </label>
            <button
              type="button"
              onClick={runBatchEvaluation}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider bg-[#00F0FF] text-[#0d0d0e] hover:bg-[#33f3ff] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw size={13} className={isProcessing ? 'animate-spin' : ''} />
              <span>{isProcessing ? 'Evaluating...' : 'Run Batch Analysis'}</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className="mt-4 font-mono text-[11px] px-3 py-2.5 border flex items-center gap-2"
            style={{
              backgroundColor:
                messageType === 'success'
                  ? 'rgba(0, 240, 255, 0.08)'
                  : messageType === 'warning'
                  ? 'rgba(255, 230, 0, 0.08)'
                  : 'rgba(236, 236, 236, 0.04)',
              borderColor:
                messageType === 'success'
                  ? '#00F0FF'
                  : messageType === 'warning'
                  ? '#FFE600'
                  : 'rgba(236, 236, 236, 0.25)',
              color:
                messageType === 'success'
                  ? '#00F0FF'
                  : messageType === 'warning'
                  ? '#FFE600'
                  : '#ececec',
            }}
          >
            <FileText size={14} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </Card>

      {/* Work Order Log Table */}
      <Card>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#ececec]/10">
          <div>
            <h2 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-[#ececec]">
              Prioritized Maintenance Work Orders
            </h2>
            <p className="text-xs text-[#ececec]/50 font-light mt-1">
              Showing {filteredRecords.length} of {records.length} telemetry records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search size={13} className="absolute left-3 top-2.5 text-[#ececec]/45" />
              <input
                type="text"
                placeholder="Filter by ID or Type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Filter telemetry records"
                className="w-full pl-8 pr-3 py-1.5 font-mono text-xs border border-[#ececec]/20 bg-[#0d0d0e] text-[#ececec] placeholder-[#ececec]/40 outline-none focus:border-[#00F0FF]"
              />
            </div>

            <div className="flex gap-1 bg-[#0d0d0e] p-1 border border-[#ececec]/15">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CRITICAL DISPATCH', label: 'Critical' },
                { id: 'INSPECTION NEEDED', label: 'Inspection' },
                { id: 'ROUTINE', label: 'Routine' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    filter === f.id
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]'
                      : 'text-[#ececec]/55 hover:text-[#ececec] border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ececec]/10">
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50">
                  Product ID
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50">
                  Type
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50 text-right">
                  Air Temp
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50 text-right">
                  Process Temp
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50 text-right">
                  Speed
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50 text-right">
                  Torque
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50 text-right">
                  Tool Wear
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50 text-right">
                  Failure Risk
                </th>
                <th className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ececec]/50">
                  Dispatch Urgency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]/10">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center font-mono text-xs text-[#ececec]/50"
                  >
                    {records.length === 0 ? (
                      'NO_BATCH_RESULTS :: UPLOAD A TELEMETRY CSV AND CLICK RUN BATCH ANALYSIS.'
                    ) : (
                      <>
                        NO_MATCHING_RECORDS_FOUND{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setFilter('ALL');
                            setSearchTerm('');
                          }}
                          className="text-[#00F0FF] underline ml-2 cursor-pointer"
                        >
                          RESET_FILTERS
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isCrit = r.status === 'CRITICAL DISPATCH';
                  const isWarn = r.status === 'INSPECTION NEEDED';
                  const color = isCrit ? '#FF0055' : isWarn ? '#FFE600' : '#00F0FF';
                  return (
                    <tr
                      key={`${r.id}-${idx}`}
                      className="hover:bg-[#ececec]/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono text-xs font-bold text-[#ececec]">
                        {r.id}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-[#ececec]/60">
                        TYPE_{r.type}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#ececec]/75">
                        {r.air} K
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#ececec]/75">
                        {r.proc} K
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#ececec]/75">
                        {r.rpm} RPM
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#ececec]/75">
                        {r.torque} Nm
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#ececec]/75">
                        {r.wear} min
                      </td>
                      <td
                        className="py-3.5 px-3 text-right font-mono text-xs font-bold"
                        style={{ color }}
                      >
                        {r.risk.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase font-bold whitespace-nowrap"
                          style={{ color }}
                        >
                          {isCrit ? (
                            <AlertCircle size={13} />
                          ) : isWarn ? (
                            <AlertTriangle size={13} />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          <span>{r.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
