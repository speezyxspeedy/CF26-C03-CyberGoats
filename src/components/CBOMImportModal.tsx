import React, { useState } from 'react';
import { X, Upload, FileCode, Check, AlertCircle, Sparkles, Github, Loader2, ExternalLink } from 'lucide-react';
import { GithubScanResult } from '../types/cryptoGraph.js';

interface CBOMImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonString: string) => void;
  onScanGithub?: (repoUrl: string) => Promise<GithubScanResult | void>;
  initialTab?: 'PASTE' | 'GITHUB';
}

const SAMPLE_CYCLONEDX_CBOM = `{
  "bomFormat": "CycloneDX",
  "specVersion": "1.6",
  "version": 1,
  "metadata": {
    "component": {
      "name": "Fintech-Core-Payment-Cluster",
      "type": "application"
    }
  },
  "components": [
    {
      "bom-ref": "api-gateway",
      "type": "service",
      "name": "API Gateway Ingress",
      "cryptoProperties": {
        "assetType": "protocol",
        "algorithmProperties": {
          "name": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"
        },
        "retentionYears": 7
      },
      "criticality": "HIGH",
      "quantum_status": "VULNERABLE"
    },
    {
      "bom-ref": "auth-jwt-service",
      "type": "service",
      "name": "Auth JWT Service",
      "cryptoProperties": {
        "assetType": "algorithm",
        "algorithmProperties": {
          "name": "ECDSA P-256 (secp256r1)"
        },
        "retentionYears": 10
      },
      "criticality": "HIGH",
      "quantum_status": "VULNERABLE"
    },
    {
      "bom-ref": "legacy-bank-switch",
      "type": "service",
      "name": "Legacy Core Switch",
      "cryptoProperties": {
        "assetType": "protocol",
        "algorithmProperties": {
          "name": "TLS 1.1 / RSA-1024 Fixed"
        },
        "retentionYears": 20
      },
      "criticality": "HIGH",
      "is_blocker": true,
      "blocker_reason": "Core Banking Switch hardcodes TLS 1.1 and RSA-1024 without crypto-agility extension support."
    },
    {
      "bom-ref": "payment-db",
      "type": "system",
      "name": "Payment Transaction Ledger",
      "cryptoProperties": {
        "assetType": "algorithm",
        "algorithmProperties": {
          "name": "AES-128-CBC TDE"
        },
        "retentionYears": 15
      },
      "criticality": "HIGH",
      "quantum_status": "VULNERABLE"
    }
  ],
  "dependencies": [
    {
      "ref": "api-gateway",
      "dependsOn": ["auth-jwt-service"]
    },
    {
      "ref": "api-gateway",
      "dependsOn": ["payment-db"]
    },
    {
      "ref": "payment-db",
      "dependsOn": ["legacy-bank-switch"]
    }
  ]
}`;

export const CBOMImportModal: React.FC<CBOMImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onScanGithub,
  initialTab = 'PASTE',
}) => {
  const [jsonText, setJsonText] = useState(SAMPLE_CYCLONEDX_CBOM);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'PASTE' | 'GITHUB'>(initialTab);
  const [repoUrl, setRepoUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<GithubScanResult | null>(null);

  React.useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleValidateAndSubmit = () => {
    try {
      JSON.parse(jsonText);
      setError(null);
      onImport(jsonText);
      onClose();
    } catch (err: any) {
      setError(`Invalid JSON syntax: ${err.message}`);
    }
  };

  const handleScanGithub = async () => {
    if (!repoUrl.trim() || !onScanGithub) return;
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const result = await onScanGithub(repoUrl.trim());
      if (result) {
        setScanResult(result);
      }
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan repository.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans">
        
        {/* Header */}
        <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-950/80 rounded text-cyan-400 border border-indigo-700/60">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#f0f6fc]">Import Cryptographic Bill of Materials (CBOM)</h3>
              <p className="text-[10px] text-[#8b949e]">CycloneDX 1.6 CBOM schema, CAMP-Graph JSON, or a live GitHub scan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-3 pt-2 flex gap-1.5 border-b border-[#30363d] bg-[#0d1117]/60 font-mono text-xs">
          <button
            onClick={() => setTab('PASTE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t transition-colors flex items-center gap-1.5 ${
              tab === 'PASTE'
                ? 'bg-[#161b22] text-cyan-300 border-t border-x border-[#30363d]'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <FileCode className="w-3 h-3" />
            <span>Paste CBOM JSON</span>
          </button>
          <button
            onClick={() => setTab('GITHUB')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t transition-colors flex items-center gap-1.5 ${
              tab === 'GITHUB'
                ? 'bg-[#161b22] text-[#f0f6fc] border-t border-x border-[#30363d]'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Github className="w-3 h-3" />
            <span>Scan GitHub Repo</span>
          </button>
        </div>

        {/* Body */}
        {tab === 'PASTE' ? (
          <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-mono">
              <span>Paste JSON CBOM schema:</span>
              <button
                onClick={() => setJsonText(SAMPLE_CYCLONEDX_CBOM)}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                Reset to CycloneDX 1.6 Sample
              </button>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-80 bg-[#090d16] text-[#f0f6fc] font-mono text-[11px] p-2.5 rounded border border-[#30363d] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
              placeholder="Paste JSON here..."
            />

            {error && (
              <div className="p-2.5 bg-[#381014] border border-[#da3633] rounded text-[#ff7b72] text-[11px] flex items-center gap-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#ff7b72]" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto font-mono">
            <div className="text-[11px] text-[#8b949e]">
              Enter a public GitHub repository URL. CAMP-Graph fetches <code className="text-cyan-300">package.json</code>, <code className="text-cyan-300">requirements.txt</code>, <code className="text-cyan-300">pom.xml</code>, <code className="text-cyan-300">Dockerfile</code>, and <code className="text-cyan-300">.env.example</code> from the default branch and flags cryptographic packages/keywords.
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1 bg-[#090d16] text-[#f0f6fc] text-xs p-2 rounded border border-[#30363d] focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleScanGithub();
                }}
              />
              <button
                onClick={handleScanGithub}
                disabled={isScanning || !repoUrl.trim()}
                className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#30363d] disabled:opacity-50 flex-shrink-0"
              >
                {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
                <span>{isScanning ? 'Scanning...' : 'Scan Repo'}</span>
              </button>
            </div>

            {scanError && (
              <div className="p-2.5 bg-[#381014] border border-[#da3633] rounded text-[#ff7b72] text-[11px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#ff7b72]" />
                <span>{scanError}</span>
              </div>
            )}

            {scanResult && (
              <div className="space-y-2">
                <div className="p-2.5 bg-[#0d2d1a]/40 border border-[#238636]/60 rounded text-[#7ee787] text-[11px] flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Scanned {scanResult.files_scanned.length} file(s) in {scanResult.owner}/{scanResult.repo}, found {scanResult.findings.length} cryptographic reference(s). Graph loaded into canvas.
                  </span>
                </div>
                {scanResult.findings.length > 0 && (
                  <div className="bg-[#090d16] rounded border border-[#30363d] max-h-56 overflow-y-auto divide-y divide-[#21262d]">
                    {scanResult.findings.map((f, i) => (
                      <div key={i} className="p-2 text-[10.5px] space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300 font-bold">{f.matched_keyword}</span>
                          <span className="text-[#6e7681]">{f.file_path}</span>
                        </div>
                        <p className="text-[#8b949e] truncate">{f.crypto_primitive_guess}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#6e7681] hover:text-cyan-400"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              <span>Only public repositories are supported.</span>
            </a>
          </div>
        )}

        {/* Footer */}
        {tab === 'PASTE' && (
          <div className="p-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-end gap-2 font-mono">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleValidateAndSubmit}
              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow transition-all flex items-center gap-1.5 border border-indigo-400"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ingest & Generate Graph</span>
            </button>
          </div>
        )}
        {tab === 'GITHUB' && (
          <div className="p-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-end gap-2 font-mono">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-xs font-bold transition-colors"
            >
              {scanResult ? 'Done' : 'Cancel'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
