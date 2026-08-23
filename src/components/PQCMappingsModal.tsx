import React, { useState, useMemo } from 'react';
import {
  X,
  Sliders,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Download,
  Upload,
  Check,
  CheckCircle2,
  Layers,
  Key,
  Lock,
  Cpu,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import {
  PQCAlgorithmMapping,
  PQCAlgorithmProfile,
  NISTSecurityLevel,
  CryptographicCategory,
  CryptoNodeData
} from '../types/cryptoGraph.js';

interface PQCMappingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: PQCAlgorithmMapping[];
  profiles: PQCAlgorithmProfile[];
  activeProfileId: string;
  onApplyProfile: (profileId: string) => Promise<void>;
  onUpdateMapping: (id: string, updates: Partial<PQCAlgorithmMapping>) => Promise<void>;
  onAddMapping: (mapping: Omit<PQCAlgorithmMapping, 'id'>) => Promise<void>;
  onDeleteMapping: (id: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
  onBulkUpdateMappings: (mappings: PQCAlgorithmMapping[]) => Promise<void>;
  nodes: CryptoNodeData[];
}

// Common PQC Algorithm Catalog Presets for quick form population
const PQC_CATALOG_PRESETS = [
  {
    label: 'ML-KEM-768 (CRYSTALS-Kyber) - NIST FIPS 203 [Level 3]',
    category: 'KEM' as CryptographicCategory,
    target_pqc_algorithm: 'ML-KEM-768 (CRYSTALS-Kyber)',
    target_nist_standard: 'NIST FIPS 203',
    nist_security_level: 'LEVEL_3' as NISTSecurityLevel,
    claimed_quantum_security_bits: 192,
    residual_risk_weight: 0.5,
    key_sizes: { public_key_bytes: 1184, private_key_bytes: 2400, ciphertext_or_signature_bytes: 1088 },
    description: 'NIST primary standardized lattice-based Module-LWE KEM for general key exchange and encryption.',
  },
  {
    label: 'ML-KEM-512 (Kyber-512 Fast) - NIST FIPS 203 [Level 1]',
    category: 'KEM' as CryptographicCategory,
    target_pqc_algorithm: 'ML-KEM-512 (CRYSTALS-Kyber-512)',
    target_nist_standard: 'NIST FIPS 203',
    nist_security_level: 'LEVEL_1' as NISTSecurityLevel,
    claimed_quantum_security_bits: 128,
    residual_risk_weight: 0.7,
    key_sizes: { public_key_bytes: 800, private_key_bytes: 1632, ciphertext_or_signature_bytes: 768 },
    description: 'Lightweight ML-KEM optimized for resource-constrained edge systems.',
  },
  {
    label: 'ML-KEM-1024 (Kyber-1024 Top-Secret) - NIST FIPS 203 [Level 5 / CNSA 2.0]',
    category: 'KEM' as CryptographicCategory,
    target_pqc_algorithm: 'ML-KEM-1024 (CRYSTALS-Kyber-1024)',
    target_nist_standard: 'NIST FIPS 203 / CNSA 2.0',
    nist_security_level: 'LEVEL_5' as NISTSecurityLevel,
    claimed_quantum_security_bits: 256,
    residual_risk_weight: 0.25,
    key_sizes: { public_key_bytes: 1568, private_key_bytes: 3168, ciphertext_or_signature_bytes: 1568 },
    description: 'Maximum assurance lattice KEM mandated by NSA CNSA 2.0 for 256-bit quantum confidentiality.',
  },
  {
    label: 'FN-DSA-512 (Falcon-512) - NIST FIPS 206 [Compact 666-byte Signatures]',
    category: 'SIGNATURE' as CryptographicCategory,
    target_pqc_algorithm: 'FN-DSA-512 (Falcon-512 Fast NTRU)',
    target_nist_standard: 'NIST FIPS 206 (Draft)',
    nist_security_level: 'LEVEL_1' as NISTSecurityLevel,
    claimed_quantum_security_bits: 128,
    residual_risk_weight: 0.6,
    key_sizes: { public_key_bytes: 897, private_key_bytes: 1281, ciphertext_or_signature_bytes: 666 },
    description: 'Fast Fourier lattice signatures with smallest signature size (666 bytes) ideal for JWTs and high-frequency APIs.',
  },
  {
    label: 'FN-DSA-1024 (Falcon-1024) - NIST FIPS 206 [Level 5 / 1280-byte Signatures]',
    category: 'SIGNATURE' as CryptographicCategory,
    target_pqc_algorithm: 'FN-DSA-1024 (Falcon-1024)',
    target_nist_standard: 'NIST FIPS 206 (Draft)',
    nist_security_level: 'LEVEL_5' as NISTSecurityLevel,
    claimed_quantum_security_bits: 256,
    residual_risk_weight: 0.35,
    key_sizes: { public_key_bytes: 1793, private_key_bytes: 2305, ciphertext_or_signature_bytes: 1280 },
    description: 'High-security Falcon signature scheme for root certificates and archival signing.',
  },
  {
    label: 'ML-DSA-65 (CRYSTALS-Dilithium) - NIST FIPS 204 [Level 3]',
    category: 'SIGNATURE' as CryptographicCategory,
    target_pqc_algorithm: 'ML-DSA-65 (CRYSTALS-Dilithium)',
    target_nist_standard: 'NIST FIPS 204',
    nist_security_level: 'LEVEL_3' as NISTSecurityLevel,
    claimed_quantum_security_bits: 192,
    residual_risk_weight: 0.5,
    key_sizes: { public_key_bytes: 1952, private_key_bytes: 4032, ciphertext_or_signature_bytes: 3309 },
    description: 'NIST primary standardized lattice signature scheme for PKI and authentication.',
  },
  {
    label: 'ML-DSA-87 (Dilithium-5) - NIST FIPS 204 [Level 5 / CNSA 2.0]',
    category: 'SIGNATURE' as CryptographicCategory,
    target_pqc_algorithm: 'ML-DSA-87 (CRYSTALS-Dilithium-5)',
    target_nist_standard: 'NIST FIPS 204 / CNSA 2.0',
    nist_security_level: 'LEVEL_5' as NISTSecurityLevel,
    claimed_quantum_security_bits: 256,
    residual_risk_weight: 0.25,
    key_sizes: { public_key_bytes: 2592, private_key_bytes: 4896, ciphertext_or_signature_bytes: 4627 },
    description: 'Level 5 lattice digital signatures for high-criticality token signing and infrastructure.',
  },
  {
    label: 'SLH-DSA-256s (SPHINCS+) - NIST FIPS 205 [Stateless Hash Signatures]',
    category: 'SIGNATURE' as CryptographicCategory,
    target_pqc_algorithm: 'SLH-DSA-256s (SPHINCS+)',
    target_nist_standard: 'NIST FIPS 205',
    nist_security_level: 'LEVEL_5' as NISTSecurityLevel,
    claimed_quantum_security_bits: 256,
    residual_risk_weight: 0.3,
    key_sizes: { public_key_bytes: 64, private_key_bytes: 128, ciphertext_or_signature_bytes: 29792 },
    description: 'Conservative stateless hash-based signature scheme resisting all lattice cryptanalysis.',
  },
  {
    label: 'Classic McEliece-6960119 - NIST Round 4 [Code-Based Archival KEK]',
    category: 'KEM' as CryptographicCategory,
    target_pqc_algorithm: 'Classic McEliece-6960119 (Goppa Code)',
    target_nist_standard: 'NIST Round 4 / ISO 18033-2',
    nist_security_level: 'LEVEL_5' as NISTSecurityLevel,
    claimed_quantum_security_bits: 256,
    residual_risk_weight: 0.25,
    key_sizes: { public_key_bytes: 1047319, private_key_bytes: 13948, ciphertext_or_signature_bytes: 226 },
    description: 'Ultra-mature Goppa code-based KEM unbroken since 1978 with 226-byte ciphertext.',
  },
  {
    label: 'HQC-192 (Hamming Quasi-Cyclic) - NIST Round 4 [Code-Based KEM]',
    category: 'KEM' as CryptographicCategory,
    target_pqc_algorithm: 'HQC-192 (Hamming Quasi-Cyclic)',
    target_nist_standard: 'NIST Round 4 Finalist',
    nist_security_level: 'LEVEL_3' as NISTSecurityLevel,
    claimed_quantum_security_bits: 192,
    residual_risk_weight: 0.45,
    key_sizes: { public_key_bytes: 4522, private_key_bytes: 4562, ciphertext_or_signature_bytes: 9000 },
    description: 'Code-based KEM alternative to lattice cryptography.',
  },
  {
    label: 'LMS / HSS - NIST SP 800-208 [Stateful Hash Firmware & HSM]',
    category: 'STATEFUL_HASH' as CryptographicCategory,
    target_pqc_algorithm: 'LMS / HSS (Leighton-Micali)',
    target_nist_standard: 'NIST SP 800-208 / RFC 8554',
    nist_security_level: 'LEVEL_5' as NISTSecurityLevel,
    claimed_quantum_security_bits: 256,
    residual_risk_weight: 0.25,
    key_sizes: { public_key_bytes: 60, private_key_bytes: 124, ciphertext_or_signature_bytes: 1452 },
    description: 'Stateful hash signature scheme for secure boot and HSM roots of trust.',
  },
  {
    label: 'AES-256-GCM + PQC Wrap - NIST SP 800-38D [256-bit Grover-Resistant]',
    category: 'SYMMETRIC_BULK' as CryptographicCategory,
    target_pqc_algorithm: 'AES-256-GCM + ML-KEM Wrap',
    target_nist_standard: 'NIST SP 800-38D / FIPS 203',
    nist_security_level: 'LEVEL_5' as NISTSecurityLevel,
    claimed_quantum_security_bits: 256,
    residual_risk_weight: 0.35,
    key_sizes: { public_key_bytes: 1184, private_key_bytes: 2400, ciphertext_or_signature_bytes: 1088 },
    description: 'Doubles symmetric key size to 256 bits with post-quantum envelope key encapsulation.',
  },
];

export const PQCMappingsModal: React.FC<PQCMappingsModalProps> = ({
  isOpen,
  onClose,
  mappings,
  profiles,
  activeProfileId,
  onApplyProfile,
  onUpdateMapping,
  onAddMapping,
  onDeleteMapping,
  onResetDefaults,
  onBulkUpdateMappings,
  nodes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    classical_pattern: string;
    category: CryptographicCategory;
    target_pqc_algorithm: string;
    target_nist_standard: string;
    nist_security_level: NISTSecurityLevel;
    claimed_quantum_security_bits: number;
    public_key_bytes: number;
    private_key_bytes: number;
    ciphertext_or_signature_bytes: number;
    is_hybrid: boolean;
    hybrid_classical_companion: string;
    residual_risk_weight: number;
    migration_phase_preference: 1 | 2 | 3;
    description: string;
    is_enabled: boolean;
  }>({
    name: '',
    classical_pattern: '',
    category: 'KEM',
    target_pqc_algorithm: 'ML-KEM-768 (CRYSTALS-Kyber)',
    target_nist_standard: 'NIST FIPS 203',
    nist_security_level: 'LEVEL_3',
    claimed_quantum_security_bits: 192,
    public_key_bytes: 1184,
    private_key_bytes: 2400,
    ciphertext_or_signature_bytes: 1088,
    is_hybrid: false,
    hybrid_classical_companion: 'X25519',
    residual_risk_weight: 0.5,
    migration_phase_preference: 2,
    description: '',
    is_enabled: true,
  });

  // Calculate matching nodes per mapping rule
  const mappingMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mappings.forEach((m) => {
      let count = 0;
      nodes.forEach((n) => {
        try {
          const reg = new RegExp(m.classical_pattern, 'i');
          if (reg.test(n.crypto_primitive) || reg.test(n.label)) {
            count++;
          }
        } catch {
          if (n.crypto_primitive.toLowerCase().includes(m.classical_pattern.toLowerCase())) {
            count++;
          }
        }
      });
      counts[m.id] = count;
    });
    return counts;
  }, [mappings, nodes]);

  // Filtered Mappings List
  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.classical_pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.target_pqc_algorithm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.target_nist_standard.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = filterCategory === 'ALL' || m.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [mappings, searchQuery, filterCategory]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleProfileSwitch = async (profileId: string) => {
    try {
      setIsProcessing(true);
      await onApplyProfile(profileId);
      showNotification(`Applied PQC profile: ${profiles.find((p) => p.id === profileId)?.name || profileId}`);
    } catch (err: any) {
      alert(`Failed to apply profile: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleEnabled = async (m: PQCAlgorithmMapping) => {
    try {
      await onUpdateMapping(m.id, { is_enabled: !m.is_enabled });
      showNotification(`${m.name} is now ${!m.is_enabled ? 'Active' : 'Disabled'}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (m: PQCAlgorithmMapping) => {
    setEditingMappingId(m.id);
    setFormData({
      name: m.name,
      classical_pattern: m.classical_pattern,
      category: m.category,
      target_pqc_algorithm: m.target_pqc_algorithm,
      target_nist_standard: m.target_nist_standard,
      nist_security_level: m.nist_security_level,
      claimed_quantum_security_bits: m.claimed_quantum_security_bits,
      public_key_bytes: m.key_sizes?.public_key_bytes || 1184,
      private_key_bytes: m.key_sizes?.private_key_bytes || 2400,
      ciphertext_or_signature_bytes: m.key_sizes?.ciphertext_or_signature_bytes || 1088,
      is_hybrid: Boolean(m.is_hybrid),
      hybrid_classical_companion: m.hybrid_classical_companion || 'X25519',
      residual_risk_weight: m.residual_risk_weight,
      migration_phase_preference: m.migration_phase_preference || 2,
      description: m.description || '',
      is_enabled: m.is_enabled,
    });
    setIsEditing(true);
  };

  const handleOpenAdd = () => {
    setEditingMappingId(null);
    setFormData({
      name: '',
      classical_pattern: '',
      category: 'KEM',
      target_pqc_algorithm: 'ML-KEM-768 (CRYSTALS-Kyber)',
      target_nist_standard: 'NIST FIPS 203',
      nist_security_level: 'LEVEL_3',
      claimed_quantum_security_bits: 192,
      public_key_bytes: 1184,
      private_key_bytes: 2400,
      ciphertext_or_signature_bytes: 1088,
      is_hybrid: false,
      hybrid_classical_companion: 'X25519',
      residual_risk_weight: 0.5,
      migration_phase_preference: 2,
      description: '',
      is_enabled: true,
    });
    setIsEditing(true);
  };

  const handlePresetSelect = (presetIndex: number) => {
    const p = PQC_CATALOG_PRESETS[presetIndex];
    if (!p) return;
    setFormData((prev) => ({
      ...prev,
      target_pqc_algorithm: p.target_pqc_algorithm,
      target_nist_standard: p.target_nist_standard,
      category: p.category,
      nist_security_level: p.nist_security_level,
      claimed_quantum_security_bits: p.claimed_quantum_security_bits,
      residual_risk_weight: p.residual_risk_weight,
      public_key_bytes: p.key_sizes.public_key_bytes,
      private_key_bytes: p.key_sizes.private_key_bytes,
      ciphertext_or_signature_bytes: p.key_sizes.ciphertext_or_signature_bytes,
      description: p.description,
      name: prev.name || `${prev.classical_pattern || 'Algorithm'} to ${p.target_pqc_algorithm}`,
    }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.classical_pattern.trim()) {
      alert('Please provide a rule name and classical algorithm pattern.');
      return;
    }

    const payload: Omit<PQCAlgorithmMapping, 'id'> = {
      name: formData.name.trim(),
      classical_pattern: formData.classical_pattern.trim(),
      category: formData.category,
      target_pqc_algorithm: formData.target_pqc_algorithm.trim(),
      target_nist_standard: formData.target_nist_standard.trim(),
      nist_security_level: formData.nist_security_level,
      claimed_quantum_security_bits: Number(formData.claimed_quantum_security_bits),
      key_sizes: {
        public_key_bytes: Number(formData.public_key_bytes),
        private_key_bytes: Number(formData.private_key_bytes),
        ciphertext_or_signature_bytes: Number(formData.ciphertext_or_signature_bytes),
      },
      is_hybrid: formData.is_hybrid,
      hybrid_classical_companion: formData.is_hybrid ? formData.hybrid_classical_companion : undefined,
      residual_risk_weight: Number(formData.residual_risk_weight),
      migration_phase_preference: formData.migration_phase_preference,
      description: formData.description.trim(),
      is_enabled: formData.is_enabled,
    };

    try {
      setIsProcessing(true);
      if (editingMappingId) {
        await onUpdateMapping(editingMappingId, payload);
        showNotification(`Updated mapping rule: ${formData.name}`);
      } else {
        await onAddMapping(payload);
        showNotification(`Created mapping rule: ${formData.name}`);
      }
      setIsEditing(false);
    } catch (err: any) {
      alert(`Error saving mapping: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete PQC mapping rule "${name}"?`)) return;
    try {
      setIsProcessing(true);
      await onDeleteMapping(id);
      showNotification(`Deleted mapping rule "${name}"`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPolicy = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      active_profile_id: activeProfileId,
      mappings,
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CAMP-Graph-PQC-Mappings-${activeProfileId}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Exported PQC Mapping Policy JSON.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportError(null);
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.mappings && Array.isArray(parsed.mappings)) {
          await onBulkUpdateMappings(parsed.mappings);
          showNotification(`Imported ${parsed.mappings.length} PQC algorithm mappings successfully.`);
        } else if (Array.isArray(parsed)) {
          await onBulkUpdateMappings(parsed);
          showNotification(`Imported ${parsed.length} PQC algorithm mappings.`);
        } else {
          throw new Error('Invalid JSON format: Expected a "mappings" array.');
        }
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetBaseline = async () => {
    if (!confirm('Reset all PQC algorithm mappings to NIST FIPS Primary Standards?')) return;
    try {
      setIsProcessing(true);
      await onResetDefaults();
      showNotification('Reset PQC mappings to default NIST FIPS baseline.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-[#30363d] bg-[#161b22]/95 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-[#0d1117] rounded-[6px] flex items-center justify-center">
                <Sliders className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#f0f6fc] tracking-tight">
                  PQC Algorithm Mappings & Cryptographic Policy Engine
                </h2>
                <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                  NIST FIPS 203 / 204 / 205 / 206
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Configure classical-to-post-quantum replacement rules, key sizes, security levels, and residual risk weights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {successMsg && (
              <span className="text-[11px] font-bold text-[#7ee787] bg-[#0d2d1a] border border-[#238636] px-2.5 py-1 rounded flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded-md transition-colors"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Preset Switcher Bar */}
        <div className="px-4 py-2.5 bg-[#090d16] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Profiles:</span>
            </span>

            {profiles.map((p) => {
              const isActive = activeProfileId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProfileSwitch(p.id)}
                  disabled={isProcessing}
                  title={p.description}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white border border-indigo-400 shadow-md'
                      : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] border border-[#30363d]'
                  }`}
                >
                  <span>{p.badge || p.name.split('(')[0].trim()}</span>
                  {isActive && <Check className="w-3 h-3 text-cyan-200" />}
                </button>
              );
            })}

            {activeProfileId === 'custom' && (
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-950/80 text-purple-200 border border-purple-700 shadow-sm flex items-center gap-1">
                <span>Custom Policy</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition-all border border-indigo-400 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Rule</span>
            </button>

            <button
              onClick={handleExportPolicy}
              className="px-2 py-1 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] rounded text-xs font-semibold flex items-center gap-1 border border-[#30363d] transition-colors"
              title="Export policy JSON"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <label className="px-2 py-1 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] rounded text-xs font-semibold flex items-center gap-1 border border-[#30363d] transition-colors cursor-pointer">
              <Upload className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={handleResetBaseline}
              className="p-1 text-[#8b949e] hover:text-[#ff7b72] hover:bg-[#21262d] rounded transition-colors"
              title="Reset to NIST FIPS default baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Body: Split or Full Screen */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {importError && (
            <div className="p-2.5 bg-[#381014] border border-[#da3633] rounded text-xs text-[#ff7b72] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Import error: {importError}</span>
            </div>
          )}

          {/* Form Modal / Drawer when Editing / Adding */}
          {isEditing ? (
            <div className="bg-[#161b22] p-4 rounded-xl border border-indigo-500/60 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-[#f0f6fc]">
                    {editingMappingId ? 'Edit Cryptographic Mapping Rule' : 'Create New PQC Replacement Rule'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#8b949e] hover:text-[#f0f6fc] px-2 py-0.5 rounded hover:bg-[#21262d]"
                >
                  Cancel
                </button>
              </div>

              {/* Preset Populator */}
              <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] space-y-1.5">
                <label className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Quick-Fill from Standard PQC Algorithm Catalog:</span>
                </label>
                <select
                  onChange={(e) => handlePresetSelect(Number(e.target.value))}
                  defaultValue=""
                  className="w-full bg-[#161b22] text-[#f0f6fc] text-xs font-mono rounded px-2.5 py-1.5 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                >
                  <option value="" disabled>-- Select a NIST FIPS / PQC Algorithm Preset to Populate Parameters --</option>
                  {PQC_CATALOG_PRESETS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Rule Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Mapping Rule Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. RSA-2048 to ML-KEM-768"
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Classical Pattern */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#ff7b72] uppercase">
                      Classical Pattern (Regex / String) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.classical_pattern}
                      onChange={(e) => setFormData({ ...formData, classical_pattern: e.target.value })}
                      placeholder="e.g. RSA-2048|PKCS#1 or ECDSA.*"
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Primitive Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="KEM">KEM (Key Encapsulation / Diffie-Hellman)</option>
                      <option value="SIGNATURE">SIGNATURE (Digital Signature / PKI)</option>
                      <option value="HYBRID_KEM">HYBRID_KEM (Dual Handshake / Ingress)</option>
                      <option value="HYBRID_SIGNATURE">HYBRID_SIGNATURE (Dual Signed Assertion)</option>
                      <option value="SYMMETRIC_BULK">SYMMETRIC_BULK (AES-256 / Storage)</option>
                      <option value="STATEFUL_HASH">STATEFUL_HASH (LMS / XMSS Firmware)</option>
                    </select>
                  </div>

                  {/* Target PQC Algorithm */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#7ee787] uppercase">Target PQC Algorithm *</label>
                    <input
                      type="text"
                      required
                      value={formData.target_pqc_algorithm}
                      onChange={(e) => setFormData({ ...formData, target_pqc_algorithm: e.target.value })}
                      placeholder="e.g. ML-KEM-768 or FN-DSA-512"
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Target NIST Standard */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">NIST Standard / Mandate</label>
                    <input
                      type="text"
                      value={formData.target_nist_standard}
                      onChange={(e) => setFormData({ ...formData, target_nist_standard: e.target.value })}
                      placeholder="e.g. NIST FIPS 203 or FIPS 206 (Falcon)"
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Security Level */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">NIST Security Level</label>
                    <select
                      value={formData.nist_security_level}
                      onChange={(e) => {
                        const lvl = e.target.value as NISTSecurityLevel;
                        let bits = 192;
                        let res = 0.5;
                        if (lvl === 'LEVEL_1') { bits = 128; res = 0.7; }
                        if (lvl === 'LEVEL_5') { bits = 256; res = 0.25; }
                        setFormData({
                          ...formData,
                          nist_security_level: lvl,
                          claimed_quantum_security_bits: bits,
                          residual_risk_weight: res,
                        });
                      }}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="LEVEL_1">Level 1 (AES-128 Equivalent / 128-bit)</option>
                      <option value="LEVEL_2">Level 2 (SHA-256 Collision Equivalent)</option>
                      <option value="LEVEL_3">Level 3 (AES-192 Equivalent / 192-bit)</option>
                      <option value="LEVEL_4">Level 4 (SHA-384 Collision Equivalent)</option>
                      <option value="LEVEL_5">Level 5 (AES-256 Equivalent / 256-bit CNSA 2.0)</option>
                    </select>
                  </div>

                  {/* Public Key Bytes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Public Key Size (Bytes)</label>
                    <input
                      type="number"
                      value={formData.public_key_bytes}
                      onChange={(e) => setFormData({ ...formData, public_key_bytes: Number(e.target.value) })}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Private Key Bytes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Private Key Size (Bytes)</label>
                    <input
                      type="number"
                      value={formData.private_key_bytes}
                      onChange={(e) => setFormData({ ...formData, private_key_bytes: Number(e.target.value) })}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Ciphertext / Signature Bytes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Ciphertext / Signature (Bytes)</label>
                    <input
                      type="number"
                      value={formData.ciphertext_or_signature_bytes}
                      onChange={(e) => setFormData({ ...formData, ciphertext_or_signature_bytes: Number(e.target.value) })}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Claimed Quantum Security Bits */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Quantum Security Bits</label>
                    <input
                      type="number"
                      value={formData.claimed_quantum_security_bits}
                      onChange={(e) => setFormData({ ...formData, claimed_quantum_security_bits: Number(e.target.value) })}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Residual Risk Multiplier */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-[#d29922] uppercase">Residual Risk Weight</label>
                      <span className="text-[10px] text-cyan-300 font-bold">{formData.residual_risk_weight}x</span>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="3.0"
                      value={formData.residual_risk_weight}
                      onChange={(e) => setFormData({ ...formData, residual_risk_weight: Number(e.target.value) })}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Migration Phase Preference */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Target Migration Phase</label>
                    <select
                      value={formData.migration_phase_preference}
                      onChange={(e) => setFormData({ ...formData, migration_phase_preference: Number(e.target.value) as any })}
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    >
                      <option value={1}>Phase 1: Ingress / Gateways / Hybrid</option>
                      <option value={2}>Phase 2: Internal Microservices / Databases</option>
                      <option value={3}>Phase 3: Root CA / HSM / Archival Storage</option>
                    </select>
                  </div>

                </div>

                {/* Hybrid Options & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#30363d]">
                  
                  {/* Hybrid Mode Toggle */}
                  <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_hybrid}
                        onChange={(e) => setFormData({ ...formData, is_hybrid: e.target.checked })}
                        className="rounded border-[#30363d] text-indigo-600 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-[#f0f6fc]">Enable Classical Hybrid Transition Mode</span>
                    </label>
                    {formData.is_hybrid && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] text-[#8b949e] uppercase block">Classical Companion Curve / Algorithm:</span>
                        <input
                          type="text"
                          value={formData.hybrid_classical_companion}
                          onChange={(e) => setFormData({ ...formData, hybrid_classical_companion: e.target.value })}
                          placeholder="e.g. X25519, Ed25519, secp256r1"
                          className="w-full bg-[#161b22] text-[#f0f6fc] text-xs rounded p-1.5 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase">Technical Rationale & Notes</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Security architecture justification, performance trade-offs, and compliance mapping..."
                      className="w-full bg-[#0d1117] text-[#f0f6fc] text-xs rounded p-2 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                </div>

                {/* Form Action Buttons */}
                <div className="flex justify-end items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow border border-indigo-400 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Apply Rule</span>
                  </button>
                </div>

              </form>
            </div>
          ) : null}

          {/* Search, Filter and Table Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search primitive, algorithm, NIST standard..."
                  className="w-full bg-[#161b22] text-[#f0f6fc] text-xs rounded-md pl-8 pr-2.5 py-1.5 border border-[#30363d] focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-[#8b949e] font-bold uppercase">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#161b22] text-[#f0f6fc] text-xs rounded px-2 py-1 border border-[#30363d] focus:outline-none"
              >
                <option value="ALL">All Categories ({mappings.length})</option>
                <option value="KEM">KEM ({mappings.filter((m) => m.category === 'KEM').length})</option>
                <option value="SIGNATURE">SIGNATURE ({mappings.filter((m) => m.category === 'SIGNATURE').length})</option>
                <option value="HYBRID_KEM">HYBRID_KEM ({mappings.filter((m) => m.category === 'HYBRID_KEM').length})</option>
                <option value="SYMMETRIC_BULK">SYMMETRIC_BULK ({mappings.filter((m) => m.category === 'SYMMETRIC_BULK').length})</option>
                <option value="STATEFUL_HASH">STATEFUL_HASH ({mappings.filter((m) => m.category === 'STATEFUL_HASH').length})</option>
              </select>
            </div>
          </div>

          {/* Mappings Table */}
          <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22]">
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090d16] text-[#8b949e] border-b border-[#30363d] text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10">
                    <th className="p-2.5 w-10 text-center">Status</th>
                    <th className="p-2.5">Classical Match Pattern</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Target PQC Algorithm & Standard</th>
                    <th className="p-2.5 text-center">Security Level</th>
                    <th className="p-2.5">Key / Sig Sizes (Bytes)</th>
                    <th className="p-2.5 text-center">Risk Mult.</th>
                    <th className="p-2.5 text-center">Matches</th>
                    <th className="p-2.5 text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#8b949e]">
                        No PQC algorithm mappings matched your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map((m) => {
                      const matchCount = mappingMatchCounts[m.id] || 0;
                      let lvlBadge = 'bg-cyan-950 text-cyan-300 border-cyan-800';
                      if (m.nist_security_level === 'LEVEL_5') {
                        lvlBadge = 'bg-purple-950 text-purple-200 border-purple-700 font-bold';
                      } else if (m.nist_security_level === 'LEVEL_1') {
                        lvlBadge = 'bg-slate-900 text-slate-300 border-slate-700';
                      }

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-[#1f242c] transition-colors ${!m.is_enabled ? 'opacity-50 bg-[#0d1117]' : ''}`}
                        >
                          {/* Active / Inactive Toggle */}
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleToggleEnabled(m)}
                              title={`Click to ${m.is_enabled ? 'disable' : 'enable'} this mapping`}
                              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                m.is_enabled
                                  ? 'bg-[#238636] text-white'
                                  : 'bg-[#30363d] text-[#8b949e]'
                              }`}
                            >
                              {m.is_enabled ? <Check className="w-3 h-3" /> : <X className="w-2.5 h-2.5" />}
                            </button>
                          </td>

                          {/* Classical Pattern */}
                          <td className="p-2.5 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#f0f6fc]">{m.name}</span>
                            </div>
                            <span className="font-mono text-[10px] text-[#ff7b72] bg-[#381014]/60 px-1.5 py-0.2 rounded border border-[#da3633]/40 block mt-0.5 max-w-[200px] truncate">
                              /{m.classical_pattern}/i
                            </span>
                          </td>

                          {/* Category */}
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-[#30363d] bg-[#0d1117] text-[#8b949e]">
                              {m.category}
                            </span>
                            {m.is_hybrid && (
                              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-800 bg-amber-950/60 text-[#e3b341]">
                                HYBRID
                              </span>
                            )}
                          </td>

                          {/* Target PQC Algorithm */}
                          <td className="p-2.5">
                            <div className="font-bold text-cyan-200">{m.target_pqc_algorithm}</div>
                            <div className="flex items-center gap-1 text-[10px] text-[#8b949e] mt-0.5">
                              <span>{m.target_nist_standard}</span>
                              <span>•</span>
                              <span>Phase {m.migration_phase_preference || 2}</span>
                            </div>
                          </td>

                          {/* Security Level */}
                          <td className="p-2.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] border font-mono ${lvlBadge}`}>
                              {m.nist_security_level.replace('LEVEL_', 'L')} ({m.claimed_quantum_security_bits}b)
                            </span>
                          </td>

                          {/* Key / Signature Sizes */}
                          <td className="p-2.5 text-[10px] font-mono text-[#8b949e] whitespace-nowrap">
                            <div><span className="text-[#c9d1d9]">PK:</span> {m.key_sizes?.public_key_bytes || 0} B</div>
                            <div><span className="text-[#c9d1d9]">SK:</span> {m.key_sizes?.private_key_bytes || 0} B</div>
                            <div><span className="text-[#c9d1d9]">CT/Sig:</span> {m.key_sizes?.ciphertext_or_signature_bytes || 0} B</div>
                          </td>

                          {/* Risk Multiplier */}
                          <td className="p-2.5 text-center font-mono font-bold text-[#d29922]">
                            {m.residual_risk_weight}x
                          </td>

                          {/* Live Matched Count */}
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              matchCount > 0
                                ? 'bg-indigo-950 text-cyan-300 border-cyan-700'
                                : 'bg-[#0d1117] text-[#6e7681] border-[#21262d]'
                            }`}>
                              {matchCount} {matchCount === 1 ? 'node' : 'nodes'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="p-1 hover:bg-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] rounded transition-colors"
                                title="Edit mapping parameters"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id, m.name)}
                                className="p-1 hover:bg-[#381014] text-[#8b949e] hover:text-[#ff7b72] rounded transition-colors"
                                title="Delete mapping rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Profile Info Banner */}
          <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] flex items-start gap-3 text-xs text-[#8b949e]">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#f0f6fc]">
                Active Profile: {profiles.find((p) => p.id === activeProfileId)?.name || 'Custom Policy'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {profiles.find((p) => p.id === activeProfileId)?.description ||
                  'Customized rule configurations active. Modifying these algorithm mappings recalculates node vulnerability weights and updates topological migration sequence targets.'}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#30363d] bg-[#161b22]/90 flex items-center justify-between text-xs text-[#8b949e] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span>Total Mappings: <strong className="text-[#f0f6fc]">{mappings.length}</strong></span>
            <span>•</span>
            <span>Active Rules: <strong className="text-[#7ee787]">{mappings.filter((m) => m.is_enabled).length}</strong></span>
            <span>•</span>
            <span>Graph Assets Matched: <strong className="text-cyan-300">{(Object.values(mappingMatchCounts) as number[]).reduce((a: number, b: number) => a + b, 0)}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all shadow border border-indigo-400"
          >
            Done & Return to Graph
          </button>
        </div>

      </div>
    </div>
  );
};
