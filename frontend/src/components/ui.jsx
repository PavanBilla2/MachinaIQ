import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export function PageHeader({ title, subtitle, breadcrumb, children }) {
  return (
    <header className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] items-end gap-6 lg:gap-12 pb-8 mb-8 border-b border-[#ececec]/10">
      <div className="min-w-0">
        {breadcrumb && (
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#00F0FF] block">
            {breadcrumb}
          </span>
        )}
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl xl:text-6xl leading-[0.88] tracking-[-0.04em] uppercase text-[#ececec] mt-3 [text-wrap:balance]">
          {title}
        </h1>
      </div>
      <div className="flex flex-col justify-end gap-4 pb-1">
        {subtitle && (
          <p className="text-sm leading-relaxed text-[#ececec]/55 font-light">
            {subtitle}
          </p>
        )}
        {children && (
          <div className="flex items-center gap-3 flex-wrap">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

export function Card({ children, className = '', elevated = false, ...props }) {
  return (
    <section
      className={`border border-[#ececec]/10 ${
        elevated ? 'bg-[#161618] corner-bracket' : 'bg-[#161618]'
      } p-6 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function KpiCard({ label, value, unit, sub, icon: Icon, status = 'default' }) {
  const statusColors = {
    default: 'text-[#ececec]',
    primary: 'text-[#00F0FF]',
    secondary: 'text-[#ececec]',
    copper: 'text-[#FFE600]',
    success: 'text-[#00F0FF]',
    healthy: 'text-[#00F0FF]',
    warning: 'text-[#FFE600]',
    danger: 'text-[#FF0055]',
    steel: 'text-[#00F0FF]',
  };

  return (
    <div className="bg-[#161618] border border-[#ececec]/10 p-5 flex flex-col justify-between transition-colors duration-150 hover:border-[#00F0FF]/40">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ececec]/55 truncate">
          {label}
        </span>
        {Icon && <Icon size={14} className="text-[#00F0FF] shrink-0" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-display font-extrabold text-3xl tracking-tight tabular-nums ${
            statusColors[status] || statusColors.default
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[11px] uppercase text-[#ececec]/55">
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div className="font-mono text-[10px] mt-3 pt-2.5 border-t border-[#ececec]/10 text-[#ececec]/45 truncate">
          {sub}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status = 'info', label }) {
  const config = {
    success: {
      classes: 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/5',
      Icon: CheckCircle2,
    },
    warning: {
      classes: 'border-[#FFE600] text-[#FFE600] bg-[#FFE600]/5',
      Icon: AlertTriangle,
    },
    danger: {
      classes: 'border-[#FF0055] text-[#FF0055] bg-[#FF0055]/5',
      Icon: AlertCircle,
    },
    info: {
      classes: 'border-[#ececec]/25 text-[#ececec]/70 bg-transparent',
      Icon: Info,
    },
    primary: {
      classes: 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/5',
      Icon: CheckCircle2,
    },
  };

  const current = config[status] || config.info;
  const Icon = current.Icon;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[11px] uppercase tracking-[0.12em] whitespace-nowrap shrink-0 ${current.classes}`}
    >
      <Icon size={12} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function SectionTitle({ children, sub, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 mb-5 border-b border-[#ececec]/10">
      <div className="min-w-0">
        <h2 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-[#ececec]">
          {children}
        </h2>
        {sub && (
          <p className="text-xs text-[#ececec]/50 mt-1 font-light leading-relaxed">
            {sub}
          </p>
        )}
      </div>
      {right && (
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00F0FF] shrink-0">
          {right}
        </div>
      )}
    </div>
  );
}
