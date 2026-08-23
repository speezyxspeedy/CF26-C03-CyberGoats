import React, { useState } from 'react';
import { X, Wrench, Shield, Check, AlertTriangle, Cpu, ArrowRight } from 'lucide-react';
import { CryptoNodeData } from '../types/cryptoGraph.js';

interface UnblockModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: CryptoNodeData | null;
  onConfirmUnblock: (nodeId: string, strategy: string) => void;
}

export const UnblockModal: React.FC<UnblockModalProps> = ({
  isOpen,
  onClose,
  node,
  onConfirmUnblock,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('PQC_PROXY');

  if (!isOpen || !node) return null;

  const strategies = [
    {
      id: 'PQC_PROXY',
      title: 'Deploy PQC Decoupling Termination Proxy',
      description: 'Terminates internal ML-KEM-768 / ML-DSA traffic and transcodes to isolated sandbox legacy TLS 1.1 protocol across private perimeter.',
      recommendedFor: 'Legacy bank partner APIs & un-upgradable third-party endpoints.',
    },
    {
      id: 'OPENSSL_OQS',
      title: 'Upgrade Container Base Image to OpenSSL 3.4+ & liboqs',
      description: 'Replaces obsolete cryptographic provider in base golden images, compiling liboqs provider to support FIPS 203/204 algorithms.',
      recommendedFor: 'Base libraries, runtime dependencies, and container golden images.',
    },
    {
      id: 'HARDWARE_SHIM',
      title: 'Deploy In-Line Edge Translation Appliance (Hardware Shim)',
      description: 'Places an edge micro-controller proxy in front of legacy medical/POS hardware, managing PQC session keys transparently.',
      recommendedFor: 'IoT pacemakers, medical devices, and fixed embedded point-of-sale terminals.',
    },
  ];

  const handleConfirm = () => {
    const chosen = strategies.find((s) => s.id === selectedStrategy);
    onConfirmUnblock(node.id, chosen?.title || 'PQC Decoupling Proxy');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#381014] rounded text-[#ff7b72] border border-[#da3633]">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#f0f6fc]">Remediate Cryptographic Blocker</h3>
              <p className="text-[10px] text-[#8b949e]">Unlock downstream dependent systems for PQC migration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Node Info */}
        <div className="p-3.5 space-y-3">
          <div className="p-2.5 bg-[#0d1117] rounded border border-[#21262d] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#f0f6fc]">{node.label}</span>
              <span className="text-[9px] font-mono font-bold text-[#ff7b72] bg-[#381014] px-1.5 py-0.2 rounded border border-[#da3633]">
                ACTIVE BLOCKER
              </span>
            </div>
            <p className="text-[10.5px] text-[#8b949e] leading-relaxed">
              {node.blocker_reason}
            </p>
          </div>

          <div className="space-y-1.5 font-mono">
            <label className="text-[10.5px] font-bold text-[#c9d1d9] uppercase tracking-wider block">
              Select PQC Remediation & Decoupling Strategy:
            </label>

            {strategies.map((strat) => (
              <div
                key={strat.id}
                onClick={() => setSelectedStrategy(strat.id)}
                className={`p-2.5 rounded border cursor-pointer transition-all ${
                  selectedStrategy === strat.id
                    ? 'bg-[#0d1117] border-indigo-500 shadow-sm'
                    : 'bg-[#0d1117]/60 border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#f0f6fc]">{strat.title}</h4>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    selectedStrategy === strat.id ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-[#30363d]'
                  }`}>
                    {selectedStrategy === strat.id && <Check className="w-2 h-2" />}
                  </div>
                </div>
                <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed font-sans">{strat.description}</p>
                <p className="text-[9px] text-cyan-300 font-medium mt-0.5 font-mono">
                  Ideal for: {strat.recommendedFor}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-end gap-2 font-mono">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-3.5 py-1 bg-[#da3633] hover:bg-[#f85149] text-white rounded text-xs font-bold shadow transition-all flex items-center gap-1.5 border border-[#f85149]"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Deploy Remediation & Unlock</span>
          </button>
        </div>

      </div>
    </div>
  );
};
