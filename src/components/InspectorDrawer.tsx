import React, { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  ListTree, 
  Terminal, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  FileCode, 
  CheckCircle2, 
  Play, 
  Copy, 
  Check, 
  ArrowRight, 
  Wrench,
  Radio,
  ExternalLink,
  Gauge,
  Skull,
  PackageOpen,
  Loader2
} from 'lucide-react';
import { CryptoNodeData, MigrationPlan, AuditLogEntry, RiskSummary, PayloadOverheadReport, BlastRadiusResult } from '../types/cryptoGraph.js';

interface InspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: CryptoNodeData | null;
  migrationPlan: MigrationPlan | null;
  auditLogs: AuditLogEntry[];
  riskSummary: RiskSummary;
  onExecuteStep: (stepId: number) => void;
  onUnblockNode: (nodeId: string) => void;
  onRunAIAdvisory: (nodeId: string) => void;
  aiAdvisoryData: any | null;
  isAiLoading: boolean;
  isQDaySimulating: boolean;
  blastRadiusResult: BlastRadiusResult | null;
  onFetchPayloadOverhead: (nodeId: string) => Promise<PayloadOverheadReport | void>;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  isOpen,
  onClose,
  selectedNode,
  migrationPlan,
  auditLogs,
  riskSummary,
  onExecuteStep,
  onUnblockNode,
  onRunAIAdvisory,
  aiAdvisoryData,
  isAiLoading,
  isQDaySimulating,
  blastRadiusResult,
  onFetchPayloadOverhead,
}) => {
  const [activeTab, setActiveTab] = useState<'INSPECTOR' | 'ROADMAP' | 'LOGS' | 'AI' | 'PAYLOAD'>('INSPECTOR');
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [payloadReport, setPayloadReport] = useState<PayloadOverheadReport | null>(null);
  const [isPayloadLoading, setIsPayloadLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'PAYLOAD' && selectedNode) {
      setIsPayloadLoading(true);
      setPayloadReport(null);
      onFetchPayloadOverhead(selectedNode.id)
        .then((report) => {
          if (report) setPayloadReport(report);
        })
        .finally(() => setIsPayloadLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedNode?.id]);

  if (!isOpen) return null;

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.level === logFilter;
  });

  return (
    <aside className="w-full md:w-[440px] lg:w-[480px] h-[calc(100vh-105px)] bg-[#0d1117]/98 border-l border-[#30363d] flex flex-col shadow-2xl backdrop-blur-xl z-30 transition-all">
      
      {/* Drawer Top Navigation Bar */}
      <div className="px-3 py-1.5 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]/90">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('INSPECTOR')}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
              activeTab === 'INSPECTOR'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('ROADMAP')}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
              activeTab === 'ROADMAP'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Roadmap</span>
            {migrationPlan && (
              <span className="text-[9px] bg-indigo-950 text-cyan-200 px-1 py-0.2 rounded border border-cyan-700/60 font-mono">
                {migrationPlan.completed_steps}/{migrationPlan.total_steps}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
              activeTab === 'LOGS'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Audit</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('AI');
              if (selectedNode && (!aiAdvisoryData || aiAdvisoryData.nodeId !== selectedNode.id)) {
                onRunAIAdvisory(selectedNode.id);
              }
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
              activeTab === 'AI'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm border border-purple-400'
                : 'text-purple-300 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>AI Advisory</span>
          </button>

          <button
            onClick={() => setActiveTab('PAYLOAD')}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
              activeTab === 'PAYLOAD'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Payload</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        
        {/* ================= TAB 1: ASSET INSPECTOR ================= */}
        {activeTab === 'INSPECTOR' && (
          <div>
            {selectedNode ? (
              <div className="space-y-3">
                
                {/* Node Identity Card */}
                <div className={`p-3 rounded-lg border transition-all ${
                  selectedNode.quantum_status === 'VULNERABLE'
                    ? 'bg-[#381014]/40 border-[#da3633] shadow-md shadow-red-950/40'
                    : (selectedNode.quantum_status === 'HYBRID'
                        ? 'bg-[#382306]/40 border-[#9e6a03] shadow-md shadow-amber-950/40'
                        : 'bg-[#0d2d1a]/40 border-[#238636] shadow-md shadow-emerald-950/40')
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-bold font-mono tracking-wider uppercase text-[#8b949e]">
                        {selectedNode.type} Asset
                      </span>
                      <h3 className="text-sm font-bold text-[#f0f6fc] mt-0.5">{selectedNode.label}</h3>
                      <p className="text-[10px] font-mono text-[#8b949e] mt-0.5">ID: {selectedNode.id}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      selectedNode.quantum_status === 'VULNERABLE'
                        ? 'bg-[#381014] border-[#da3633] text-[#ff7b72] animate-pulse'
                        : (selectedNode.quantum_status === 'HYBRID'
                            ? 'bg-[#382306] border-[#9e6a03] text-[#e3b341]'
                            : 'bg-[#0d2d1a] border-[#238636] text-[#7ee787]')
                    }`}>
                      {selectedNode.quantum_status}
                    </span>
                  </div>

                  {/* Q-Day Blast Radius indicator if this node is the compromise origin or in the cascade */}
                  {isQDaySimulating && blastRadiusResult && blastRadiusResult.compromised_node_ids.includes(selectedNode.id) && (
                    <div className="mt-2.5 bg-[#3a0a0a] border border-[#ff2d2d] rounded p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[#ffb3b3] font-bold font-mono">
                        <Skull className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {selectedNode.id === blastRadiusResult.origin_node_id ? 'Q-DAY COMPROMISE ORIGIN' : 'IN BLAST RADIUS CASCADE'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                        <div className="bg-[#1a0507] rounded p-1.5 border border-[#5c1414]">
                          <span className="text-[#8b949e] block uppercase">Compromised</span>
                          <span className="text-[#ffb3b3] font-bold">{blastRadiusResult.compromised_count} / {blastRadiusResult.total_assets}</span>
                        </div>
                        <div className="bg-[#1a0507] rounded p-1.5 border border-[#5c1414]">
                          <span className="text-[#8b949e] block uppercase">Exposed Lifetime</span>
                          <span className="text-[#ffb3b3] font-bold">{blastRadiusResult.max_exposed_data_lifetime_years}y</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#f0b3b3] leading-relaxed">
                        Est. exposure: ${blastRadiusResult.estimated_financial_exposure_usd.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Blocker alert if active */}
                  {selectedNode.is_blocker && (
                    <div className="mt-2.5 bg-[#381014] border border-[#f85149] rounded p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[#ff7b72] font-bold font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#ff7b72] flex-shrink-0" />
                        <span>MIGRATION BLOCKER IDENTIFIED</span>
                      </div>
                      <p className="text-[#c9d1d9] text-[10.5px] leading-relaxed">
                        {selectedNode.blocker_reason}
                      </p>
                      <button
                        onClick={() => onUnblockNode(selectedNode.id)}
                        className="w-full mt-1 py-1 px-2.5 bg-[#da3633] hover:bg-[#f85149] text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all border border-[#f85149]"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Deploy PQC Decoupling Proxy (Unblock)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Cryptographic Specifications */}
                <div className="bg-[#161b22] rounded-lg p-3 border border-[#30363d] space-y-2.5">
                  <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      <span>Cryptographic Posture & PQC Target</span>
                    </span>
                    {selectedNode.nist_security_level && (
                      <span className="text-[9px] bg-purple-950 text-purple-200 border border-purple-800 px-1.5 py-0.2 rounded font-bold">
                        {selectedNode.nist_security_level.replace('LEVEL_', 'NIST L')}
                      </span>
                    )}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[9px] text-[#8b949e] block font-mono font-semibold uppercase">Active Primitive</span>
                      <span className="font-mono font-bold text-[#f0f6fc] text-[11px] block mt-0.5 truncate" title={selectedNode.crypto_primitive}>
                        {selectedNode.crypto_primitive}
                      </span>
                    </div>

                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[9px] text-[#8b949e] block font-mono font-semibold uppercase">Criticality Factor</span>
                      <span className="font-bold font-mono text-[#d29922] block mt-0.5 text-[11px]">
                        {selectedNode.criticality} CRIT
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0d1117] p-2.5 rounded border border-indigo-900/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e] text-[10px] font-mono uppercase font-semibold">Target Standard:</span>
                      <span className="text-cyan-300 font-mono text-[10px]">{selectedNode.nist_standard}</span>
                    </div>
                    <p className="font-mono text-xs font-bold text-cyan-200">
                      {selectedNode.recommended_pqc}
                    </p>

                    {/* Detailed PQC Key Sizes and Quantum Security Bits */}
                    {selectedNode.pqc_key_sizes && (
                      <div className="pt-1.5 border-t border-[#21262d] grid grid-cols-3 gap-1 text-[9.5px] font-mono text-[#8b949e]">
                        <div>
                          <span className="text-[#c9d1d9] block font-bold">Public Key</span>
                          <span>{selectedNode.pqc_key_sizes.public_key_bytes} B</span>
                        </div>
                        <div>
                          <span className="text-[#c9d1d9] block font-bold">Private Key</span>
                          <span>{selectedNode.pqc_key_sizes.private_key_bytes} B</span>
                        </div>
                        <div>
                          <span className="text-[#c9d1d9] block font-bold">CT / Sig</span>
                          <span>{selectedNode.pqc_key_sizes.ciphertext_or_signature_bytes} B</span>
                        </div>
                      </div>
                    )}

                    {selectedNode.claimed_quantum_security_bits && (
                      <div className="flex items-center justify-between pt-1 text-[9.5px] font-mono text-[#8b949e]">
                        <span>Claimed Quantum Security:</span>
                        <span className="text-purple-300 font-bold">{selectedNode.claimed_quantum_security_bits} bits</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* HNDL & Mosca's Shelf-Life Calculation */}
                <div className="bg-[#161b22] rounded-lg p-3 border border-[#30363d] space-y-2">
                  <h4 className="text-[10px] font-bold text-[#d29922] uppercase tracking-wider flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      <span>HNDL Exposure (Mosca X+Y&gt;Z)</span>
                    </span>
                    <span className="text-[9px] font-mono text-[#8b949e]">Threshold Check</span>
                  </h4>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[#c9d1d9]">
                      <span className="text-[#8b949e]">Retention Shelf-Life (X):</span>
                      <span className="font-bold text-[#d29922]">{selectedNode.data_retention_years} Years</span>
                    </div>
                    <div className="flex items-center justify-between text-[#c9d1d9]">
                      <span className="text-[#8b949e]">PQC Migration Horizon (Y):</span>
                      <span className="text-[#f0f6fc]">2 - 3 Years</span>
                    </div>
                    <div className="flex items-center justify-between text-[#c9d1d9]">
                      <span className="text-[#8b949e]">Estimated Q-Day CRQC Window (Z):</span>
                      <span className="text-[#f0f6fc]">2029 - 2033 (~5-7y)</span>
                    </div>
                    
                    <div className="pt-1.5 border-t border-[#21262d] text-[10.5px] text-[#8b949e] leading-relaxed">
                      <span className="font-semibold text-[#f0f6fc]">Exposure: </span>
                      {selectedNode.hndl_exposure_horizon}
                    </div>
                  </div>
                </div>

                {/* Compliance & Ownership Details */}
                <div className="bg-[#161b22] rounded-lg p-3 border border-[#30363d] space-y-1.5 text-xs font-mono">
                  <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
                    Governance & Context
                  </h4>
                  {selectedNode.owner && (
                    <div className="flex justify-between text-[#8b949e]">
                      <span>Owner:</span>
                      <span className="text-[#f0f6fc] font-medium">{selectedNode.owner}</span>
                    </div>
                  )}
                  {selectedNode.location && (
                    <div className="flex justify-between text-[#8b949e]">
                      <span>Location:</span>
                      <span className="text-[#f0f6fc] font-medium">{selectedNode.location}</span>
                    </div>
                  )}
                  {selectedNode.compliance_tags && selectedNode.compliance_tags.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[#8b949e] text-[9px] block mb-1">Compliance Frameworks:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.compliance_tags.map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-[#0d1117] text-cyan-300 text-[9px] rounded border border-[#21262d] font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedNode.notes && (
                    <p className="text-[10px] text-[#8b949e] pt-1.5 border-t border-[#21262d] italic">
                      "{selectedNode.notes}"
                    </p>
                  )}
                </div>

                {/* Trigger AI Analysis Button */}
                <button
                  onClick={() => {
                    setActiveTab('AI');
                    onRunAIAdvisory(selectedNode.id);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 border border-purple-400 font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Generate AI PQC Playbook</span>
                </button>

              </div>
            ) : (
              <div className="py-14 text-center text-[#8b949e] space-y-2">
                <Layers className="w-10 h-10 mx-auto text-[#30363d]" />
                <p className="text-xs font-medium">Select any node on the graph canvas to inspect cryptographic parameters, HNDL risk, and PQC migration paths.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MIGRATION ROADMAP ================= */}
        {activeTab === 'ROADMAP' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#f0f6fc]">NIST PQC Migration Roadmap</h3>
                <p className="text-[10px] text-[#8b949e]">Constraint-Aware Topological Sequence</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#161b22] text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                Phase {migrationPlan?.current_phase || 1} Active
              </span>
            </div>

            {migrationPlan?.phases.map((phase) => (
              <div 
                key={phase.phase_number}
                className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden shadow-sm"
              >
                {/* Phase Header */}
                <div className={`p-2.5 border-b border-[#30363d] flex items-center justify-between ${
                  phase.status === 'COMPLETED'
                    ? 'bg-[#0d2d1a]/40'
                    : (phase.status === 'IN_PROGRESS' ? 'bg-[#1f2937]/40' : 'bg-[#0d1117]/60')
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      phase.status === 'COMPLETED'
                        ? 'bg-[#238636] text-white'
                        : (phase.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white' : 'bg-[#21262d] text-[#8b949e]')
                    }`}>
                      {phase.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : phase.phase_number}
                    </div>
                    <span className="text-[11px] font-bold text-[#f0f6fc] truncate">{phase.title}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    phase.status === 'COMPLETED'
                      ? 'bg-[#0d2d1a] text-[#7ee787] border border-[#238636]'
                      : (phase.status === 'IN_PROGRESS' ? 'bg-indigo-950 text-cyan-300 border border-cyan-800 animate-pulse' : 'bg-[#21262d] text-[#8b949e]')
                  }`}>
                    {phase.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Phase Step List */}
                <div className="divide-y divide-[#21262d] p-1.5">
                  {phase.steps.map((step) => {
                    const isCompleted = step.status === 'COMPLETED';
                    const isReady = step.status === 'READY';
                    const isBlocked = step.status === 'BLOCKED';

                    return (
                      <div
                        key={step.step_id}
                        className={`p-2 rounded flex items-center justify-between gap-2.5 text-xs transition-all my-0.5 ${
                          isCompleted
                            ? 'bg-[#0d2d1a]/20 text-[#c9d1d9] border border-[#238636]/40'
                            : (isReady
                                ? 'bg-[#0d1117] border border-indigo-500/60 text-[#f0f6fc]'
                                : (isBlocked
                                    ? 'bg-[#381014]/20 border border-[#da3633]/40 text-[#8b949e]'
                                    : 'bg-[#0d1117]/40 text-[#8b949e]'))
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#f0f6fc] text-[11px]">
                            <span className="text-[#6e7681] text-[9px]">#{step.step_id}</span>
                            <span className="truncate">{step.node_label}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 mt-0.5 truncate">
                            <span className="text-[#8b949e] line-through truncate max-w-[90px]">{step.from_primitive}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-[#6e7681] flex-shrink-0" />
                            <span className="font-semibold text-[#7ee787] truncate">{step.to_primitive}</span>
                          </div>

                          {isBlocked && (
                            <p className="text-[9px] text-[#ff7b72] font-semibold mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-[#ff7b72]" />
                              <span>Blocked by {step.blocker_id}</span>
                            </p>
                          )}
                        </div>

                        {/* Action trigger button */}
                        <div>
                          {isCompleted ? (
                            <div className="p-1 bg-[#0d2d1a] text-[#7ee787] rounded-full border border-[#238636]" title="Step completed">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <button
                              onClick={() => onExecuteStep(step.step_id)}
                              disabled={isBlocked}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono flex items-center gap-1 transition-all ${
                                isReady
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow active:scale-95 border border-indigo-400'
                                  : 'bg-[#21262d] text-[#6e7681] cursor-not-allowed'
                              }`}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{isBlocked ? 'Blocked' : 'Step'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 3: AUDIT LOGS ================= */}
        {activeTab === 'LOGS' && (
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#30363d]">
              <span className="text-[#8b949e] text-[11px] font-bold flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#3fb950]" />
                <span>Audit Stream</span>
              </span>

              {/* Filter pills */}
              <div className="flex gap-1 text-[9px]">
                {['ALL', 'SUCCESS', 'WARN', 'CRITICAL'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold transition-colors ${
                      logFilter === lvl ? 'bg-[#30363d] text-white' : 'bg-[#161b22] text-[#8b949e] hover:bg-[#21262d]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#090d16] p-2 rounded-lg border border-[#30363d] max-h-[520px] overflow-y-auto space-y-1.5">
              {filteredLogs.map((log) => {
                let badge = 'text-cyan-400 border-cyan-800 bg-cyan-950/60';
                if (log.level === 'SUCCESS') badge = 'text-[#7ee787] border-[#238636] bg-[#0d2d1a]/80';
                if (log.level === 'WARN') badge = 'text-[#e3b341] border-[#9e6a03] bg-[#382306]/80';
                if (log.level === 'CRITICAL') badge = 'text-[#ff7b72] border-[#da3633] bg-[#381014]/80 animate-pulse';

                return (
                  <div key={log.id} className="p-1.5 rounded bg-[#161b22]/90 border border-[#21262d] space-y-0.5">
                    <div className="flex items-center justify-between text-[9px] text-[#6e7681]">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-1 rounded border text-[8px] font-bold ${badge}`}>
                        {log.level}
                      </span>
                    </div>
                    <p className="text-[#f0f6fc] text-[10.5px] leading-relaxed break-words font-mono">
                      {log.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: AI ADVISOR ================= */}
        {activeTab === 'AI' && (
          <div className="space-y-3 font-mono">
            <div className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 p-3 rounded-lg border border-purple-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Gemini AI Architect</span>
                </h3>
                <p className="text-[10px] text-[#c9d1d9] mt-0.5">
                  NIST PQC Remediation & Implementation Synthesis
                </p>
              </div>
              {selectedNode && (
                <button
                  onClick={() => onRunAIAdvisory(selectedNode.id)}
                  disabled={isAiLoading}
                  className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold font-mono flex items-center gap-1 shadow transition-all disabled:opacity-50 border border-purple-400"
                >
                  <Sparkles className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiLoading ? 'Analyzing...' : 'Re-Analyze'}</span>
                </button>
              )}
            </div>

            {isAiLoading ? (
              <div className="py-14 text-center space-y-2">
                <Sparkles className="w-7 h-7 mx-auto text-purple-400 animate-spin" />
                <p className="text-xs font-bold text-purple-200">Evaluating Shor & Grover vulnerability...</p>
                <p className="text-[10px] text-[#8b949e]">Synthesizing NIST FIPS 203/204/205 code</p>
              </div>
            ) : aiAdvisoryData?.advisory ? (
              <div className="space-y-2.5 text-xs">
                
                {/* Executive Summary */}
                <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] space-y-1">
                  <h4 className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                    Executive Threat Assessment
                  </h4>
                  <p className="text-[#f0f6fc] leading-relaxed text-[11px]">
                    {aiAdvisoryData.advisory.summary}
                  </p>
                </div>

                {/* Shor / Grover Breakdown */}
                <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] space-y-1">
                  <h4 className="text-[9px] font-bold text-[#ff7b72] uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Quantum Algorithm Vulnerability</span>
                  </h4>
                  <p className="text-[#c9d1d9] leading-relaxed text-[10.5px]">
                    {aiAdvisoryData.advisory.threat_analysis}
                  </p>
                </div>

                {/* HNDL Analysis */}
                <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] space-y-1">
                  <h4 className="text-[9px] font-bold text-[#d29922] uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    <span>Harvest-Now-Decrypt-Later (HNDL) Horizon</span>
                  </h4>
                  <p className="text-[#c9d1d9] leading-relaxed text-[10.5px]">
                    {aiAdvisoryData.advisory.hndl_exposure_risk}
                  </p>
                </div>

                {/* Implementation Code Snippet */}
                {aiAdvisoryData.advisory.code_snippet && (
                  <div className="bg-[#090d16] rounded-lg border border-[#30363d] overflow-hidden">
                    <div className="p-2 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                        <FileCode className="w-3 h-3" />
                        <span>{aiAdvisoryData.advisory.code_snippet.language.toUpperCase()} PQC Implementation</span>
                      </span>
                      <button
                        onClick={() => handleCopyCode(aiAdvisoryData.advisory.code_snippet.code)}
                        className="px-1.5 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedCode ? <Check className="w-2.5 h-2.5 text-[#3fb950]" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 font-mono text-[10px] text-[#f0f6fc] overflow-x-auto bg-[#090d16] leading-relaxed">
                      <code>{aiAdvisoryData.advisory.code_snippet.code}</code>
                    </pre>
                  </div>
                )}

                {/* Compliance Mandate */}
                <div className="bg-[#0d2d1a]/40 p-2.5 rounded-lg border border-[#238636]/60 space-y-0.5">
                  <h4 className="text-[9px] font-bold text-[#7ee787] uppercase tracking-wider">
                    White House NSM-10 & OMB M-23-02 Verdict
                  </h4>
                  <p className="text-[#7ee787] text-[10px] leading-relaxed">
                    {aiAdvisoryData.advisory.compliance_verdict}
                  </p>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-[#8b949e] space-y-1.5">
                <Sparkles className="w-8 h-8 mx-auto text-purple-400/60" />
                <p className="text-xs">Click "Generate AI PQC Playbook" to invoke Gemini AI model.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: PAYLOAD OVERHEAD BENCHMARKING ================= */}
        {activeTab === 'PAYLOAD' && (
          <div className="space-y-3 font-mono">
            <div>
              <h3 className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Network Payload & Packet Overhead</span>
              </h3>
              <p className="text-[10px] text-[#8b949e]">Classical vs. NIST PQC wire-format size comparison</p>
            </div>

            {!selectedNode ? (
              <div className="py-14 text-center text-[#8b949e] space-y-2">
                <PackageOpen className="w-10 h-10 mx-auto text-[#30363d]" />
                <p className="text-xs font-medium">Select a node to benchmark its cryptographic payload overhead.</p>
              </div>
            ) : isPayloadLoading ? (
              <div className="py-14 text-center space-y-2">
                <Loader2 className="w-7 h-7 mx-auto text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-indigo-200">Calculating packet size deltas...</p>
              </div>
            ) : payloadReport ? (
              <div className="space-y-3 text-xs">
                {/* This node's classical vs target comparison */}
                <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] space-y-2">
                  <h4 className="text-[9px] font-bold text-[#8b949e] uppercase tracking-wider">
                    {selectedNode.label}: Current vs. Target
                  </h4>
                  {[payloadReport.classical_baseline, payloadReport.target_pqc].map((entry, i) => {
                    const maxBytes = Math.max(payloadReport.classical_baseline.total_bytes, payloadReport.target_pqc.total_bytes, 1);
                    const widthPct = Math.max(4, Math.round((entry.total_bytes / maxBytes) * 100));
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={i === 0 ? 'text-[#8b949e]' : 'text-cyan-300 font-bold'}>{entry.algorithm}</span>
                          <span className="text-[#f0f6fc] font-bold">{entry.total_bytes} B</span>
                        </div>
                        <div className="h-3 bg-[#0d1117] rounded overflow-hidden border border-[#21262d]">
                          <div
                            className={`h-full rounded ${i === 0 ? 'bg-[#6e7681]' : (entry.exceeds_tcp_mtu ? 'bg-[#f85149]' : 'bg-cyan-500')}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t border-[#21262d] grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-[#0d1117] p-1.5 rounded border border-[#21262d]">
                      <span className="text-[#8b949e] block uppercase text-[9px]">Latency Multiplier</span>
                      <span className="text-[#e3b341] font-bold">{payloadReport.target_pqc.latency_multiplier}x</span>
                    </div>
                    <div className="bg-[#0d1117] p-1.5 rounded border border-[#21262d]">
                      <span className="text-[#8b949e] block uppercase text-[9px]">Memory Overhead</span>
                      <span className="text-[#e3b341] font-bold">{payloadReport.target_pqc.memory_overhead_factor}x</span>
                    </div>
                  </div>

                  <div className={`pt-1.5 text-[10px] flex items-center gap-1.5 ${
                    payloadReport.target_pqc.exceeds_tcp_mtu ? 'text-[#ff7b72]' : 'text-[#7ee787]'
                  }`}>
                    {payloadReport.target_pqc.exceeds_tcp_mtu ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>
                      {payloadReport.target_pqc.exceeds_tcp_mtu
                        ? `Fragmentation risk: total payload exceeds ${payloadReport.tcp_mtu_bytes}B TCP MTU`
                        : `Within ${payloadReport.tcp_mtu_bytes}B TCP MTU — ${payloadReport.target_pqc.fragmentation_risk.toLowerCase()} fragmentation risk`}
                    </span>
                  </div>
                </div>

                {/* Reference comparison table across common primitives */}
                <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] space-y-2">
                  <h4 className="text-[9px] font-bold text-[#8b949e] uppercase tracking-wider">
                    Reference: Classical vs. NIST PQC Families
                  </h4>
                  {payloadReport.reference_comparisons.map((entry) => {
                    const maxRef = Math.max(...payloadReport.reference_comparisons.map((e) => e.total_bytes), 1);
                    const widthPct = Math.max(4, Math.round((entry.total_bytes / maxRef) * 100));
                    return (
                      <div key={entry.algorithm} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="text-[#c9d1d9]">{entry.algorithm}</span>
                          <span className="text-[#8b949e]">
                            PK {entry.public_key_bytes}B / Sig-CT {entry.signature_or_ciphertext_bytes}B
                          </span>
                        </div>
                        <div className="h-2.5 bg-[#0d1117] rounded overflow-hidden border border-[#21262d]">
                          <div
                            className={`h-full rounded ${
                              entry.category === 'CLASSICAL' ? 'bg-[#6e7681]' : (entry.exceeds_tcp_mtu ? 'bg-[#f85149]' : 'bg-indigo-500')
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[9px] text-[#6e7681] pt-1">
                    Sizes per NIST FIPS 203/204/205 reference specifications. TCP MTU threshold: {payloadReport.tcp_mtu_bytes}B.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-[#8b949e] space-y-2">
                <PackageOpen className="w-10 h-10 mx-auto text-[#30363d]" />
                <p className="text-xs font-medium">No payload data available for this asset yet.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
};
