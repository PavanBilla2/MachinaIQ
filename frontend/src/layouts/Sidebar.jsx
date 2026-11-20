import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Factory,
} from 'lucide-react';
import api from '../api/client';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', code: '01' },
  { key: 'simulator', label: 'Machine Simulator', code: '02' },
  { key: 'models', label: 'Model Intelligence', code: '03' },
  { key: 'clusters', label: 'Cluster Analysis', code: '04' },
  { key: 'batch', label: 'Batch Reports', code: '05' },
];

export default function Sidebar({ active, onNavigate, isOpen, onToggle }) {
  const [apiHealthy, setApiHealthy] = useState(true);
  const [plantImgFailed, setPlantImgFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get('/telemetry/overview')
      .then(() => {
        if (mounted) setApiHealthy(true);
      })
      .catch(() => {
        if (mounted) setApiHealthy(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside
      aria-label="Primary Navigation"
      className="fixed top-0 left-0 h-screen flex flex-col border-r border-[#ececec]/10 sidebar-grid-bg transition-[width] duration-200 z-40 select-none"
      style={{ width: isOpen ? '280px' : '72px' }}
    >
      {/* Brand Block */}
      <div className="p-6 pb-8 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2.5 min-w-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00F0FF"
            className="w-6 h-6 shrink-0"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
            <path
              d="M7 12h2l1-3 2 6 1-3h2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isOpen && (
            <span className="font-display font-extrabold text-lg tracking-[0.1em] uppercase text-[#00F0FF] whitespace-nowrap">
              MachinaIQ
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-1.5 border border-[#ececec]/10 text-[#ececec]/55 hover:text-[#00F0FF] hover:border-[#00F0FF] transition-colors cursor-pointer shrink-0"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className={`flex-1 ${isOpen ? 'px-6' : 'px-3'} space-y-1 overflow-y-auto`}>
        {NAV_ITEMS.map(({ key, label, code }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              title={!isOpen ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center py-3 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors duration-150 cursor-pointer text-left whitespace-nowrap ${
                isActive ? 'text-[#00F0FF]' : 'text-[#ececec]/50 hover:text-[#ececec]'
              }`}
            >
              <span
                className={`mr-2.5 shrink-0 ${
                  isActive ? 'text-[#00F0FF]' : 'text-[#ececec]/20'
                }`}
              >
                {isActive ? '[*]' : '[ ]'}
              </span>
              {isOpen ? (
                <span className="truncate">{label}</span>
              ) : (
                <span className="sr-only">{code} {label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Corner-Bracketed Facility Card */}
      {isOpen && (
        <div className="px-6 pb-4">
          <div className="border border-[#ececec]/10 bg-[#0d0d0e]/90 p-4 corner-bracket">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00F0FF] mb-2">
              INDUSTRIAL_AI_SUITE
            </div>
            {!plantImgFailed ? (
              <img
                src="/sidebar-plant.png"
                alt="Industrial Manufacturing Facility"
                referrerPolicy="no-referrer"
                onError={() => setPlantImgFailed(true)}
                className="w-full h-14 object-cover mb-2.5 border border-[#ececec]/10 opacity-85"
              />
            ) : (
              <div className="w-full h-14 mb-2.5 border border-[#ececec]/10 bg-[#161618] flex items-center justify-center text-[#00F0FF]">
                <Factory size={20} />
              </div>
            )}
            <div className="font-mono text-[11px] text-[#ececec]">AI4I 2020 Dataset</div>
            <div className="font-mono text-[10px] text-[#ececec]/45 mt-1">
              Monitoring Active
            </div>
          </div>
        </div>
      )}

      {/* Footer Connection Status */}
      <div className={`${isOpen ? 'px-6 py-5' : 'p-3'} border-t border-[#ececec]/10`}>
        <div
          className={`w-full border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] flex items-center justify-center gap-2 ${
            apiHealthy
              ? 'border-[#00F0FF]/50 text-[#00F0FF]'
              : 'border-[#FFE600]/50 text-[#FFE600]'
          }`}
          title={apiHealthy ? 'API Connected' : 'Baseline Mode'}
        >
          {apiHealthy ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOpen && <span>{apiHealthy ? 'API_CONNECTED' : 'BASELINE_MODE'}</span>}
        </div>
      </div>
    </aside>
  );
}
