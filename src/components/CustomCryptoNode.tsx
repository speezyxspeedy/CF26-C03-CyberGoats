import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Server, 
  Database, 
  KeyRound, 
  FileCode, 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  AlertTriangle, 
  Cpu, 
  Lock, 
  Unlock,
  Radio,
  Skull,
  Zap
} from 'lucide-react';
import { CryptoNodeData } from '../types/cryptoGraph.js';

function getNodeTypeIcon(type: string) {
  switch (type) {
    case 'Service':
      return <Server className="w-3.5 h-3.5" />;
    case 'System':
      return <Database className="w-3.5 h-3.5" />;
    case 'Key':
      return <KeyRound className="w-3.5 h-3.5" />;
    case 'Library':
      return <FileCode className="w-3.5 h-3.5" />;
    case 'Certificate':
      return <Shield className="w-3.5 h-3.5" />;
    default:
      return <Cpu className="w-3.5 h-3.5" />;
  }
}

export const CustomCryptoNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as CryptoNodeData;
  const isVulnerable = nodeData.quantum_status === 'VULNERABLE';
  const isHybrid = nodeData.quantum_status === 'HYBRID';
  const isSafe = nodeData.quantum_status === 'SAFE';
  const isBlocker = Boolean(nodeData.is_blocker);

  // Colors & Glow styling based on quantum status
  let borderStyle = 'border-[#da3633] bg-[#161b22] text-[#f0f6fc] glow-vulnerable';
  let badgeBg = 'bg-[#381014] border-[#da3633] text-[#ff7b72]';
  let statusLabel = 'VULNERABLE';
  let StatusIcon = Unlock;
  let statusDotColor = 'bg-[#f85149]';

  if (isSafe) {
    borderStyle = 'border-[#238636] bg-[#161b22] text-[#f0f6fc] glow-safe';
    badgeBg = 'bg-[#0d2d1a] border-[#238636] text-[#7ee787]';
    statusLabel = 'SAFE (PQC)';
    StatusIcon = ShieldCheck;
    statusDotColor = 'bg-[#3fb950]';
  } else if (isHybrid) {
    borderStyle = 'border-[#9e6a03] bg-[#161b22] text-[#f0f6fc] glow-hybrid';
    badgeBg = 'bg-[#382306] border-[#9e6a03] text-[#e3b341]';
    statusLabel = 'HYBRID PQC';
    StatusIcon = Shield;
    statusDotColor = 'bg-[#d29922]';
  }

  if (isBlocker) {
    borderStyle = 'border-[#f85149] bg-[#161b22] text-[#f0f6fc] glow-blocker';
  }

  const isCompromised = Boolean(nodeData.is_compromised);
  if (isCompromised) {
    borderStyle = 'border-[#ff2d2d] bg-[#1a0507] text-[#f0f6fc] glow-compromised';
    badgeBg = 'bg-[#3a0a0a] border-[#ff2d2d] text-[#ffb3b3]';
    statusLabel = 'COMPROMISED';
    StatusIcon = Skull;
    statusDotColor = 'bg-[#ff2d2d]';
  }

  return (
    <div
      id={`node-${nodeData.id}`}
      className={`relative w-[250px] rounded-lg border transition-all duration-200 cursor-pointer shadow-lg select-none ${borderStyle} ${
        selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#090d16] scale-[1.03] z-50' : 'hover:border-[#8b949e]'
      }`}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400 !border-[#090d16]" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400 !border-[#090d16]" />
      <Handle type="target" position={Position.Left} id="left-in" className="!w-2 !h-2 !bg-cyan-400 !border-[#090d16]" />
      <Handle type="source" position={Position.Right} id="right-out" className="!w-2 !h-2 !bg-cyan-400 !border-[#090d16]" />

      {/* Q-Day Compromise Banner (takes priority over blocker banner) */}
      {isCompromised ? (
        <div className="absolute -top-2.5 left-2 right-2 bg-[#ff2d2d] text-white text-[9px] font-bold font-mono tracking-wider py-0.5 px-2 rounded flex items-center justify-center gap-1 shadow-md shadow-red-950 border border-[#ffb3b3] animate-pulse">
          <Skull className="w-3 h-3" />
          <span>Q-DAY COMPROMISED{typeof nodeData.compromise_hop_distance === 'number' ? ` · HOP ${nodeData.compromise_hop_distance}` : ''}</span>
        </div>
      ) : isBlocker && (
        <div className="absolute -top-2.5 left-2 right-2 bg-[#da3633] text-white text-[9px] font-bold font-mono tracking-wider py-0.5 px-2 rounded flex items-center justify-center gap-1 shadow-md shadow-red-950/80 border border-[#f85149]">
          <AlertTriangle className="w-3 h-3 text-amber-200" />
          <span>BLOCKER CONSTRAINT</span>
        </div>
      )}

      {/* Header section */}
      <div className="p-2.5 pb-1.5 border-b border-[#30363d]">
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono tracking-wide text-[#8b949e] uppercase">
            {getNodeTypeIcon(nodeData.type)}
            <span>{nodeData.type}</span>
          </span>

          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
            {statusLabel}
          </span>
        </div>

        <h4 className="text-xs font-bold text-[#f0f6fc] truncate tracking-tight font-sans" title={nodeData.label}>
          {nodeData.label}
        </h4>
      </div>

      {/* Body details */}
      <div className="p-2.5 pt-1.5 text-[10.5px] space-y-1.5 font-mono">
        {/* Active Primitive */}
        <div className="bg-[#0d1117] rounded p-1.5 border border-[#21262d]">
          <div className="flex items-center justify-between text-[9px] text-[#8b949e] mb-0.5">
            <span className="flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-[#6e7681]" />
              <span className="uppercase font-bold">Current:</span>
            </span>
            <span className="text-[#c9d1d9] font-bold">{nodeData.criticality} CRIT</span>
          </div>
          <p className="text-[10px] font-bold text-[#f0f6fc] truncate" title={nodeData.crypto_primitive}>
            {nodeData.crypto_primitive}
          </p>
        </div>

        {/* Target PQC Recommendation / Migrated Algorithm */}
        <div className="bg-[#0d1117] rounded p-1.5 border border-[#21262d]">
          <div className="flex items-center justify-between text-[9px] text-[#8b949e] mb-0.5">
            <span className="uppercase font-bold text-cyan-400">Target PQC:</span>
            <span className="text-cyan-300 font-semibold">{nodeData.nist_standard || 'FIPS 203/204'}</span>
          </div>
          <p className="text-[10px] font-bold text-cyan-200 truncate" title={nodeData.recommended_pqc}>
            {nodeData.recommended_pqc}
          </p>
        </div>

        {/* Footer badges: HNDL & Risk Score */}
        <div className="pt-1 border-t border-[#30363d] flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#d29922] bg-[#382306]/80 px-1.5 py-0.5 rounded border border-[#9e6a03]" title={`Data Retention: ${nodeData.data_retention_years} years`}>
            <Radio className="w-2.5 h-2.5 text-[#d29922]" />
            <span>{nodeData.data_retention_years}y Retention</span>
          </span>

          <div className="flex items-center gap-1 text-[9.5px]">
            <span className="text-[#8b949e]">Risk:</span>
            <span className={`font-mono font-bold ${
              nodeData.risk_score > 60 ? 'text-[#ff7b72]' : (nodeData.risk_score > 25 ? 'text-[#d29922]' : 'text-[#7ee787]')
            }`}>
              {nodeData.risk_score}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

CustomCryptoNode.displayName = 'CustomCryptoNode';
