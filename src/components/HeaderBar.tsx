import React from 'react';
import { 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Zap, 
  Upload, 
  Download, 
  Sparkles, 
  Search, 
  RefreshCw,
  GitGraph,
  HelpCircle,
  Sliders,
  Skull,
  Github
} from 'lucide-react';

interface HeaderBarProps {
  presets: { id: string; name: string; industry: string }[];
  activePresetId: string;
  onSelectPreset: (id: string) => void;
  onRunScan: () => void;
  onSimulateStep: () => void;
  onAutoPilot: () => void;
  onReset: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenMappings: () => void;
  activeProfileName?: string;
  isLoading: boolean;
  isAutoPiloting: boolean;
  migrationComplete: boolean;
  direction: 'TB' | 'LR';
  onToggleDirection: () => void;
  isQDaySimulating: boolean;
  onToggleQDaySimulation: () => void;
  onOpenGithubScan: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onRunScan,
  onSimulateStep,
  onAutoPilot,
  onReset,
  onOpenImport,
  onOpenExport,
  onOpenMappings,
  activeProfileName,
  isLoading,
  isAutoPiloting,
  migrationComplete,
  direction,
  onToggleDirection,
  isQDaySimulating,
  onToggleQDaySimulation,
  onOpenGithubScan,
}) => {
  return (
    <header className="bg-[#0d1117]/95 border-b border-[#30363d] px-3.5 py-2 sticky top-0 z-40 shadow-lg backdrop-blur-md">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Logo & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-[#0d1117] rounded-[6px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h1 className="text-xs font-black tracking-tight text-[#f0f6fc] flex items-center gap-1.5 uppercase font-mono">
                <span>CAMP-Graph</span>
                <span className="text-[9px] font-mono font-bold bg-[#1f2937] text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  FIPS 203/204
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-[#8b949e] font-medium tracking-tight mt-0.5">
              Cryptographic Agility & PQC Migration Engine
            </p>
          </div>
        </div>

        {/* Center: Presets & Layout direction */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-md px-1 py-0.5 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] px-1.5">Topology:</span>
            <select
              value={activePresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              disabled={isLoading || isAutoPiloting}
              className="bg-[#0d1117] text-[#e6edf3] text-xs font-semibold rounded px-2 py-1 border border-[#30363d] focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              {activePresetId === 'custom-cbom' && (
                <option value="custom-cbom">Custom Imported CBOM</option>
              )}
            </select>
          </div>

          {/* PQC Algorithm Mappings Button */}
          <button
            onClick={onOpenMappings}
            title="Configure PQC Algorithm Mappings, Key Sizes, and Security Levels"
            className="px-2.5 py-1 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900 hover:to-indigo-900 text-purple-200 border border-purple-600/70 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px]">PQC Mappings</span>
            {activeProfileName && (
              <span className="hidden md:inline text-[9px] bg-purple-900/60 text-purple-200 px-1 rounded border border-purple-700/50">
                {activeProfileName}
              </span>
            )}
          </button>

          {/* Layout Direction Toggle */}
          <button
            onClick={onToggleDirection}
            title={`Toggle layout orientation (Current: ${direction === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'})`}
            className="px-2 py-1 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <GitGraph className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">{direction} View</span>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center flex-wrap gap-1.5">
          
          {/* Re-scan CBOM */}
          <button
            onClick={onRunScan}
            disabled={isLoading || isAutoPiloting}
            className="px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Scan CBOM and reconstruct directed dependency graph"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Scan CBOM</span>
          </button>

          {/* Execute Next Step */}
          <button
            onClick={onSimulateStep}
            disabled={isLoading || isAutoPiloting || migrationComplete}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm border border-indigo-500/80 transition-all active:scale-95 disabled:opacity-50"
            title="Execute next ready PQC migration step in topological order"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Step</span>
          </button>

          {/* Auto-Pilot Full Sequence */}
          <button
            onClick={onAutoPilot}
            disabled={isLoading || migrationComplete}
            className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm border transition-all active:scale-95 ${
              isAutoPiloting
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 animate-pulse'
                : (migrationComplete
                    ? 'bg-emerald-800 text-emerald-100 border-emerald-600 cursor-default opacity-90'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:opacity-95 text-white border-indigo-400')
            }`}
            title="Automatically execute all 3 migration phases sequentially"
          >
            <Zap className={`w-3 h-3 ${isAutoPiloting ? 'animate-bounce' : ''}`} />
            <span>{isAutoPiloting ? 'Auto-Pilot Active' : (migrationComplete ? '100% Migrated' : 'Auto-Pilot')}</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={onReset}
            disabled={isLoading || isAutoPiloting}
            className="p-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] rounded-md text-xs transition-colors shadow-sm"
            title="Reset to baseline vulnerable state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-[#30363d] mx-0.5" />

          {/* GitHub Repo Auto-Scanner */}
          <button
            onClick={onOpenGithubScan}
            className="px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Scan a public GitHub repository for cryptographic dependencies"
          >
            <Github className="w-3 h-3 text-[#f0f6fc]" />
            <span className="hidden sm:inline">Scan Repo</span>
          </button>

          {/* Import CBOM */}
          <button
            onClick={onOpenImport}
            className="px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Import custom CycloneDX 1.6 or CAMP-Graph CBOM JSON"
          >
            <Upload className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenExport}
            className="px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Export Post-Quantum Migration Report & CycloneDX CBOM"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="h-5 w-px bg-[#30363d] mx-0.5" />

          {/* Q-Day Attack Simulation Toggle */}
          <button
            onClick={onToggleQDaySimulation}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm border transition-all active:scale-95 disabled:opacity-50 ${
              isQDaySimulating
                ? 'bg-[#ff2d2d] hover:bg-[#ff4d4d] text-white border-[#ffb3b3] animate-pulse'
                : 'bg-gradient-to-r from-red-950/80 to-red-900/60 hover:from-red-900 hover:to-red-800 text-red-200 border-red-700/70'
            }`}
            title="Simulate an adversary compromising a vulnerable root key or key-exchange node and cascade the blast radius"
          >
            <Skull className="w-3.5 h-3.5" />
            <span>{isQDaySimulating ? 'Q-Day Active' : 'Simulate Q-Day Attack'}</span>
          </button>

        </div>

      </div>
    </header>
  );
};
