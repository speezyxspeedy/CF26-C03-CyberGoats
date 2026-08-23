import { CryptoNodeData, RiskSummary, NISTSecurityLevel, PayloadOverheadEntry, PayloadOverheadReport } from '../src/types/cryptoGraph.js';
import { PQCMappingManager, globalPQCMappingManager } from './pqcMappingManager.js';

/**
 * Quantum Risk and HNDL (Harvest-Now-Decrypt-Later) Scoring Engine
 * 
 * Formula:
 * Node_Risk = Quantum_Vulnerability_Weight * Data_Retention_Factor * Criticality_Factor * Security_Level_Modifier
 * 
 * Dynamic Vulnerability Weights & PQC Algorithm Mapping Parameters:
 * - VULNERABLE: Asymmetric Public Key (RSA, ECC, ECDSA, DH, DSA) = 10.0
 *   Symmetric 128-bit (AES-128 under Grover) = 4.0
 * - HYBRID: User-defined Hybrid mapping weight (typically 1.8 - 2.5)
 * - SAFE: Pure NIST PQC according to User-Defined Security Level & Residual Risk Weight:
 *     * Level 5 (256-bit quantum security, ML-KEM-1024, SLH-DSA-256s, AES-256): 0.25 - 0.35 weight
 *     * Level 3 (192-bit quantum security, ML-KEM-768, ML-DSA-65, HQC-192): 0.45 - 0.55 weight
 *     * Level 1 (128-bit quantum security, ML-KEM-512, FN-DSA-512 Falcon): 0.65 - 0.8 weight
 */

export function calculateNodeRisk(
  node: Partial<CryptoNodeData>,
  mappingManager: PQCMappingManager = globalPQCMappingManager
): {
  risk_score: number;
  hndl_score: number;
  hndl_exposure_horizon: string;
  recommended_pqc: string;
  nist_standard: string;
  nist_security_level: NISTSecurityLevel;
  pqc_key_sizes?: { public_key_bytes: number; private_key_bytes: number; ciphertext_or_signature_bytes: number };
  claimed_quantum_security_bits: number;
  matched_mapping_id?: string;
} {
  const status = node.quantum_status || 'VULNERABLE';
  const criticality = node.criticality || 'MEDIUM';
  const retention = node.data_retention_years || 5;
  const primitive = (node.crypto_primitive || '').trim();

  // Match active user-configured PQC algorithm mapping
  const matchedMapping = mappingManager.matchAlgorithm(primitive, {
    nodeType: node.type,
    label: node.label,
    isRoot: Boolean(node.type === 'Key' || node.id?.includes('hsm') || node.id?.includes('kms') || node.id?.includes('root')),
  });

  const targetPqc = matchedMapping?.target_pqc_algorithm || 'ML-KEM-768 & ML-DSA-65';
  const targetStandard = matchedMapping?.target_nist_standard || 'NIST FIPS 203 / 204';
  const targetLevel: NISTSecurityLevel = matchedMapping?.nist_security_level || 'LEVEL_3';
  const keySizes = matchedMapping?.key_sizes || { public_key_bytes: 1184, private_key_bytes: 2400, ciphertext_or_signature_bytes: 1088 };
  const quantumBits = matchedMapping?.claimed_quantum_security_bits || 192;
  const residualWeight = matchedMapping?.residual_risk_weight ?? 0.5;

  // Quantum Vulnerability Weight
  let vulnWeight = 10.0;
  if (status === 'SAFE') {
    vulnWeight = residualWeight;
  } else if (status === 'HYBRID') {
    vulnWeight = matchedMapping?.is_hybrid ? residualWeight : 2.5;
  } else {
    // Check if it's symmetric AES-128 vs asymmetric
    const primUpper = primitive.toUpperCase();
    if (primUpper.includes('AES-128') || primUpper.includes('AES_128') || primUpper.includes('3DES') || primUpper.includes('DUKPT')) {
      vulnWeight = 4.0; // Grover algorithm halves security bits
    } else if (primUpper.includes('AES-256') || primUpper.includes('SHA-384') || primUpper.includes('SHA-512')) {
      vulnWeight = 1.0;
    } else {
      vulnWeight = 10.0; // Vulnerable to Shor's algorithm (RSA, ECC, ECDSA, DH)
    }
  }

  // Criticality Factor
  let critFactor = 2.0;
  if (criticality === 'HIGH') critFactor = 3.0;
  else if (criticality === 'LOW') critFactor = 1.0;

  // Data Retention Years Factor (log-linear scale for HNDL risk)
  const retentionFactor = Math.max(1, Math.min(retention / 2.5, 12));

  // Base raw risk calculation
  const rawRisk = vulnWeight * retentionFactor * critFactor;

  // Normalize risk score to 0 - 100 (Max theoretical raw = 10 * 12 * 3 = 360 -> 100)
  const normalizedRisk = Math.min(100, Math.round((rawRisk / 360) * 100));

  // HNDL Urgency Score
  const hndlMultiplier = status === 'VULNERABLE' ? 1.5 : (status === 'HYBRID' ? 0.3 : 0.05);
  const hndlScore = Math.min(100, Math.round(retention * 3.5 * hndlMultiplier * critFactor));

  // Exposure Horizon label
  let exposureHorizon = 'Safe from HNDL window';
  if (status === 'VULNERABLE') {
    const targetYear = 2026 + retention;
    if (retention >= 10) {
      exposureHorizon = `CRITICAL HNDL: Retained data exposed through ${targetYear} (Q-Day Horizon)`;
    } else if (retention >= 5) {
      exposureHorizon = `HIGH HNDL: Intercepted ciphertexts valid through ${targetYear}`;
    } else {
      exposureHorizon = `MODERATE: Short-lived session data (${retention} yrs retention)`;
    }
  } else if (status === 'HYBRID') {
    exposureHorizon = `PROTECTED: Hybrid encapsulation (${matchedMapping?.hybrid_classical_companion || 'X25519'} + ${targetPqc}) resists retrospective quantum decryption`;
  } else {
    exposureHorizon = `SECURE: ${targetStandard} [${targetLevel}] (${quantumBits}-bit quantum strength, PK:${keySizes.public_key_bytes}B, Sig/CT:${keySizes.ciphertext_or_signature_bytes}B)`;
  }

  return {
    risk_score: normalizedRisk,
    hndl_score: hndlScore,
    hndl_exposure_horizon: exposureHorizon,
    recommended_pqc: targetPqc,
    nist_standard: targetStandard,
    nist_security_level: targetLevel,
    pqc_key_sizes: keySizes,
    claimed_quantum_security_bits: quantumBits,
    matched_mapping_id: matchedMapping?.id,
  };
}

/**
 * Network Payload & Packet Size Overhead Benchmarking
 *
 * Standard reference sizes (bytes) for classical vs. NIST PQC primitives.
 * Sources: NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), and the
 * round-3/round-4 Falcon (FN-DSA) specification. Classical figures are typical
 * wire-format sizes for the given key/signature scheme.
 */
const TCP_MTU_BYTES = 1500;

const CLASSICAL_REFERENCE_SIZES: Record<string, { public_key_bytes: number; signature_or_ciphertext_bytes: number }> = {
  'RSA-2048': { public_key_bytes: 256, signature_or_ciphertext_bytes: 256 },
  'RSA-3072': { public_key_bytes: 384, signature_or_ciphertext_bytes: 384 },
  'RSA-4096': { public_key_bytes: 512, signature_or_ciphertext_bytes: 512 },
  'ECDSA-P256': { public_key_bytes: 64, signature_or_ciphertext_bytes: 64 },
  'ECDHE-P256': { public_key_bytes: 64, signature_or_ciphertext_bytes: 64 },
  'X25519': { public_key_bytes: 32, signature_or_ciphertext_bytes: 32 },
  'Ed25519': { public_key_bytes: 32, signature_or_ciphertext_bytes: 64 },
};

const PQC_REFERENCE_TABLE: PayloadOverheadEntry[] = [
  {
    algorithm: 'RSA-2048',
    category: 'CLASSICAL',
    public_key_bytes: 256,
    signature_or_ciphertext_bytes: 256,
    total_bytes: 512,
    exceeds_tcp_mtu: false,
    fragmentation_risk: 'NONE',
    latency_multiplier: 1.0,
    memory_overhead_factor: 1.0,
  },
  {
    algorithm: 'ML-KEM-768',
    category: 'KEM',
    public_key_bytes: 1184,
    signature_or_ciphertext_bytes: 1088,
    total_bytes: 2272,
    exceeds_tcp_mtu: false,
    fragmentation_risk: 'LOW',
    latency_multiplier: 1.15,
    memory_overhead_factor: 4.4,
  },
  {
    algorithm: 'ML-DSA-65',
    category: 'SIGNATURE',
    public_key_bytes: 1952,
    signature_or_ciphertext_bytes: 3309,
    total_bytes: 5261,
    exceeds_tcp_mtu: false,
    fragmentation_risk: 'MODERATE',
    latency_multiplier: 1.6,
    memory_overhead_factor: 10.3,
  },
  {
    algorithm: 'FN-DSA-512 (Falcon)',
    category: 'SIGNATURE',
    public_key_bytes: 897,
    signature_or_ciphertext_bytes: 666,
    total_bytes: 1563,
    exceeds_tcp_mtu: false,
    fragmentation_risk: 'LOW',
    latency_multiplier: 1.35,
    memory_overhead_factor: 3.1,
  },
  {
    algorithm: 'SLH-DSA-128s',
    category: 'STATEFUL_HASH',
    public_key_bytes: 32,
    signature_or_ciphertext_bytes: 7856,
    total_bytes: 7888,
    exceeds_tcp_mtu: true,
    fragmentation_risk: 'HIGH',
    latency_multiplier: 3.2,
    memory_overhead_factor: 15.4,
  },
];

function classifyFragmentationRisk(totalBytes: number): { exceeds: boolean; risk: PayloadOverheadEntry['fragmentation_risk'] } {
  if (totalBytes > TCP_MTU_BYTES) return { exceeds: true, risk: totalBytes > TCP_MTU_BYTES * 3 ? 'HIGH' : 'MODERATE' };
  if (totalBytes > TCP_MTU_BYTES * 0.6) return { exceeds: false, risk: 'LOW' };
  return { exceeds: false, risk: 'NONE' };
}

function buildOverheadEntry(
  algorithm: string,
  category: PayloadOverheadEntry['category'],
  publicKeyBytes: number,
  sigOrCtBytes: number,
  latencyMultiplier: number,
  memoryOverheadFactor: number
): PayloadOverheadEntry {
  const totalBytes = publicKeyBytes + sigOrCtBytes;
  const { exceeds, risk } = classifyFragmentationRisk(totalBytes);
  return {
    algorithm,
    category,
    public_key_bytes: publicKeyBytes,
    signature_or_ciphertext_bytes: sigOrCtBytes,
    total_bytes: totalBytes,
    exceeds_tcp_mtu: exceeds,
    fragmentation_risk: risk,
    latency_multiplier: latencyMultiplier,
    memory_overhead_factor: memoryOverheadFactor,
  };
}

export function computePayloadOverhead(
  node: CryptoNodeData,
  mappingManager: PQCMappingManager = globalPQCMappingManager
): PayloadOverheadReport {
  // Resolve a classical baseline size estimate for the node's current primitive.
  const primUpper = (node.crypto_primitive || '').toUpperCase();
  let classicalKey = Object.keys(CLASSICAL_REFERENCE_SIZES).find((k) => primUpper.includes(k.toUpperCase()));
  if (!classicalKey) {
    // Sensible fallback based on common families
    if (primUpper.includes('RSA') && primUpper.includes('4096')) classicalKey = 'RSA-4096';
    else if (primUpper.includes('RSA') && primUpper.includes('3072')) classicalKey = 'RSA-3072';
    else if (primUpper.includes('RSA')) classicalKey = 'RSA-2048';
    else if (primUpper.includes('ECDSA') || primUpper.includes('ECDHE') || primUpper.includes('ECC')) classicalKey = 'ECDSA-P256';
    else classicalKey = 'RSA-2048';
  }
  const classicalSizes = CLASSICAL_REFERENCE_SIZES[classicalKey];
  const classicalBaseline = buildOverheadEntry(classicalKey, 'CLASSICAL', classicalSizes.public_key_bytes, classicalSizes.signature_or_ciphertext_bytes, 1.0, 1.0);

  // Resolve target PQC sizing from the active mapping, if matched, else from node's own pqc_key_sizes.
  const matched = mappingManager.matchAlgorithm(node.crypto_primitive || '', { nodeType: node.type, label: node.label });
  const targetKeySizes = matched?.key_sizes || node.pqc_key_sizes || { public_key_bytes: 1184, private_key_bytes: 2400, ciphertext_or_signature_bytes: 1088 };
  const targetName = matched?.target_pqc_algorithm || node.recommended_pqc || 'ML-KEM-768';
  const targetCategory = matched?.category || 'KEM';

  // Latency & memory heuristics scale with total wire bytes relative to the classical baseline.
  const targetTotal = targetKeySizes.public_key_bytes + targetKeySizes.ciphertext_or_signature_bytes;
  const classicalTotal = classicalSizes.public_key_bytes + classicalSizes.signature_or_ciphertext_bytes;
  const latencyMultiplier = Math.round(((1 + (targetTotal / Math.max(classicalTotal, 1)) * 0.15)) * 100) / 100;
  const memoryOverheadFactor = Math.round((targetTotal / Math.max(classicalTotal, 1)) * 100) / 100;

  const targetPqc = buildOverheadEntry(
    targetName,
    targetCategory,
    targetKeySizes.public_key_bytes,
    targetKeySizes.ciphertext_or_signature_bytes,
    latencyMultiplier,
    memoryOverheadFactor
  );

  return {
    node_id: node.id,
    classical_baseline: classicalBaseline,
    target_pqc: targetPqc,
    reference_comparisons: PQC_REFERENCE_TABLE,
    tcp_mtu_bytes: TCP_MTU_BYTES,
  };
}

export function computeRiskSummary(nodes: CryptoNodeData[]): RiskSummary {
  if (!nodes || nodes.length === 0) {
    return {
      overall_risk_score: 0,
      vulnerable_nodes_count: 0,
      hybrid_nodes_count: 0,
      safe_nodes_count: 0,
      blockers_count: 0,
      total_assets: 0,
      hndl_critical_count: 0,
      nist_compliance_percent: 100,
      max_retention_years: 0,
      mosca_timeline_status: 'QUANTUM_SAFE',
    };
  }

  let totalWeightedRisk = 0;
  let vulnerableCount = 0;
  let hybridCount = 0;
  let safeCount = 0;
  let blockersCount = 0;
  let hndlCriticalCount = 0;
  let maxRetention = 0;

  nodes.forEach((n) => {
    totalWeightedRisk += n.risk_score;
    if (n.quantum_status === 'VULNERABLE') {
      vulnerableCount++;
      if (n.data_retention_years >= 10) {
        hndlCriticalCount++;
      }
    } else if (n.quantum_status === 'HYBRID') {
      hybridCount++;
    } else if (n.quantum_status === 'SAFE') {
      safeCount++;
    }

    if (n.is_blocker) {
      blockersCount++;
    }

    if (n.data_retention_years > maxRetention) {
      maxRetention = n.data_retention_years;
    }
  });

  const overallRisk = Math.round(totalWeightedRisk / nodes.length);
  const nistCompliance = Math.round(((safeCount + hybridCount * 0.6) / nodes.length) * 100);

  // Mosca's Theorem: X (Retention) + Y (Migration Time, approx 3-5 yrs) > Z (Time to CRQC ~ 5-7 yrs)
  let moscaStatus: RiskSummary['mosca_timeline_status'] = 'QUANTUM_SAFE';
  if (vulnerableCount > 0) {
    if (maxRetention >= 10 || hndlCriticalCount > 0) {
      moscaStatus = 'CRITICAL_RISK';
    } else if (maxRetention >= 5) {
      moscaStatus = 'ELEVATED_RISK';
    } else {
      moscaStatus = 'MANAGEABLE';
    }
  } else if (hybridCount > 0) {
    moscaStatus = 'MANAGEABLE';
  } else {
    moscaStatus = 'QUANTUM_SAFE';
  }

  return {
    overall_risk_score: overallRisk,
    vulnerable_nodes_count: vulnerableCount,
    hybrid_nodes_count: hybridCount,
    safe_nodes_count: safeCount,
    blockers_count: blockersCount,
    total_assets: nodes.length,
    hndl_critical_count: hndlCriticalCount,
    nist_compliance_percent: nistCompliance,
    max_retention_years: maxRetention,
    mosca_timeline_status: moscaStatus,
  };
}
