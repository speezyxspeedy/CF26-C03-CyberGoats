import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  AlertOctagon, 
  Award, 
  Layers, 
  TrendingDown,
  Lock,
  ArrowRight
} from 'lucide-react';
import { RiskSummary } from '../types/cryptoGraph.js';

interface ExecutiveMetricsProps {
  summary: RiskSummary;
  filterStatus: string | null;
  onFilterChange: (status: string | null) => void;
}

export const ExecutiveMetrics: React.FC<ExecutiveMetricsProps> = ({
  summary,
  filterStatus,
  onFilterChange,
}) => {
  const isHighRisk = summary.overall_risk_score >= 60;
  const isMedRisk = summary.overall_risk_score >= 30 && summary.overall_risk_score < 60;

  return (
    <div className="bg-[#0d1117]/95 border-b border-[#30363d] px-3.5 py-1.5 backdrop-blur-md">
      <div className="max-w-[1700px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 items-center">
        
        {/* 1. Global Quantum Risk Index */}
        <div 
          onClick={() => onFilterChange(null)}
          className={`bg-[#161b22] border p-2 rounded-lg flex items-center gap-2.5 cursor-pointer transition-all hover:border-[#484f58] shadow-sm ${
            filterStatus === null ? 'border-cyan-500/90 ring-1 ring-cyan-500/30' : 'border-[#30363d]'
          }`}
        >
          <div className={`p-1.5 rounded-md flex items-center justify-center flex-shrink-0 ${
            isHighRisk ? 'bg-[#381014] text-[#f85149] border border-[#da3633]' : (isMedRisk ? 'bg-[#382306] text-[#d29922] border border-[#9e6a03]' : 'bg-[#0d2d1a] text-[#3fb950] border border-[#238636]')
          }`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-semibold">
              <span className="truncate">Risk Index</span>
              <span className="font-mono font-bold text-[#f0f6fc] text-xs ml-1">{summary.overall_risk_score}/100</span>
            </div>
            <div className="w-full bg-[#21262d] h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isHighRisk ? 'bg-[#f85149]' : (isMedRisk ? 'bg-[#d29922]' : 'bg-[#3fb950]')
                }`}
                style={{ width: `${Math.min(100, summary.overall_risk_score)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#8b949e] mt-0.5 font-mono">
              <span>{summary.total_assets} CBOM Assets</span>
              <span className="text-cyan-400 font-semibold">{filterStatus ? 'Filter Active' : 'All Assets'}</span>
            </div>
          </div>
        </div>

        {/* 2. Quantum Status Breakdown */}
        <div className="bg-[#161b22] border border-[#30363d] p-1.5 rounded-lg shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] mb-1 flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#8b949e]" />
              <span>Posture</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-xs">
            <button
              onClick={() => onFilterChange(filterStatus === 'VULNERABLE' ? null : 'VULNERABLE')}
              className={`py-0.5 px-1 rounded border transition-all ${
                filterStatus === 'VULNERABLE' 
                  ? 'bg-[#381014] border-[#f85149] text-[#ff7b72] font-bold' 
                  : 'bg-[#21262d]/60 border-[#30363d] text-[#ff7b72] hover:border-[#f85149]'
              }`}
            >
              <div className="font-mono font-bold text-xs leading-none">{summary.vulnerable_nodes_count}</div>
              <div className="text-[8px] uppercase tracking-wider font-semibold mt-0.5 text-[#8b949e]">Vuln</div>
            </button>
            <button
              onClick={() => onFilterChange(filterStatus === 'HYBRID' ? null : 'HYBRID')}
              className={`py-0.5 px-1 rounded border transition-all ${
                filterStatus === 'HYBRID' 
                  ? 'bg-[#382306] border-[#d29922] text-[#e3b341] font-bold' 
                  : 'bg-[#21262d]/60 border-[#30363d] text-[#d29922] hover:border-[#d29922]'
              }`}
            >
              <div className="font-mono font-bold text-xs leading-none">{summary.hybrid_nodes_count}</div>
              <div className="text-[8px] uppercase tracking-wider font-semibold mt-0.5 text-[#8b949e]">Hybrid</div>
            </button>
            <button
              onClick={() => onFilterChange(filterStatus === 'SAFE' ? null : 'SAFE')}
              className={`py-0.5 px-1 rounded border transition-all ${
                filterStatus === 'SAFE' 
                  ? 'bg-[#0d2d1a] border-[#3fb950] text-[#7ee787] font-bold' 
                  : 'bg-[#21262d]/60 border-[#30363d] text-[#3fb950] hover:border-[#3fb950]'
              }`}
            >
              <div className="font-mono font-bold text-xs leading-none">{summary.safe_nodes_count}</div>
              <div className="text-[8px] uppercase tracking-wider font-semibold mt-0.5 text-[#8b949e]">Safe</div>
            </button>
          </div>
        </div>

        {/* 3. HNDL Exposure Horizon (Mosca's Theorem) */}
        <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg flex items-center gap-2.5 shadow-sm">
          <div className="p-1.5 rounded-md bg-[#382306] text-[#d29922] border border-[#9e6a03] flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-semibold">
              <span className="truncate">HNDL Horizon</span>
              <span className="font-mono text-[#d29922] font-bold text-xs">{summary.max_retention_years}y Max</span>
            </div>
            <p className="text-[10px] font-bold text-[#f0f6fc] truncate mt-0.5" title={
              summary.mosca_timeline_status === 'CRITICAL_RISK'
                ? 'CRITICAL: Data retention exceeds Q-Day threshold (X + Y > Z)'
                : 'Manageable: Hybrid/PQC active on critical paths'
            }>
              {summary.mosca_timeline_status === 'CRITICAL_RISK' ? '🔴 Critical Threat (X+Y>Z)' : (summary.mosca_timeline_status === 'ELEVATED_RISK' ? '🟡 Elevated' : '🟢 Protected')}
            </p>
            <p className="text-[9px] text-[#8b949e] font-mono truncate mt-0.5">
              {summary.hndl_critical_count} assets with ≥10y retention
            </p>
          </div>
        </div>

        {/* 4. Active Migration Blockers */}
        <div 
          onClick={() => onFilterChange(filterStatus === 'BLOCKER' ? null : 'BLOCKER')}
          className={`bg-[#161b22] border p-2 rounded-lg flex items-center gap-2.5 cursor-pointer transition-all hover:border-[#f85149] shadow-sm ${
            filterStatus === 'BLOCKER' ? 'border-[#f85149] ring-1 ring-[#f85149]/40' : 'border-[#30363d]'
          }`}
        >
          <div className={`p-1.5 rounded-md flex items-center justify-center flex-shrink-0 ${
            summary.blockers_count > 0 ? 'bg-[#381014] text-[#f85149] border border-[#da3633] animate-pulse' : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
          }`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-semibold">
              <span className="truncate">Blockers</span>
              <span className={`font-mono font-bold text-xs ${summary.blockers_count > 0 ? 'text-[#ff7b72]' : 'text-[#8b949e]'}`}>
                {summary.blockers_count}
              </span>
            </div>
            <p className="text-[10px] text-[#c9d1d9] font-medium truncate mt-0.5">
              {summary.blockers_count > 0 ? `${summary.blockers_count} Constraints Active` : 'Zero Constraints'}
            </p>
            <p className="text-[9px] text-[#ff7b72] font-semibold truncate mt-0.5 font-mono">
              {summary.blockers_count > 0 ? 'Click to Filter' : 'Topology Clear'}
            </p>
          </div>
        </div>

        {/* 5. NIST FIPS 203/204/205 Compliance */}
        <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg flex items-center gap-2.5 shadow-sm col-span-2 sm:col-span-1">
          <div className="p-1.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-semibold">
              <span className="truncate">NIST Compliance</span>
              <span className="font-mono font-bold text-cyan-300 text-xs">{summary.nist_compliance_percent}%</span>
            </div>
            <div className="w-full bg-[#21262d] h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${summary.nist_compliance_percent}%` }}
              />
            </div>
            <p className="text-[9px] text-[#8b949e] mt-0.5 truncate font-mono">
              FIPS 203 ML-KEM / 204 ML-DSA
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
