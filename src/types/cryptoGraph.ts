export type QuantumStatus = 'VULNERABLE' | 'HYBRID' | 'SAFE';
export type Criticality = 'HIGH' | 'MEDIUM' | 'LOW';
export type NodeType = 'System' | 'Service' | 'Algorithm' | 'Key' | 'Certificate' | 'Library';
export type EdgeRelationship = 'USES_ALGORITHM' | 'COMMUNICATES_WITH' | 'DEPENDS_ON' | 'REPLACED_BY' | 'BLOCKED_BY';

export type NISTSecurityLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5';
export type CryptographicCategory = 'KEM' | 'SIGNATURE' | 'SYMMETRIC_BULK' | 'STATEFUL_HASH' | 'HYBRID_KEM' | 'HYBRID_SIGNATURE';

export interface PQCKeySizes {
  public_key_bytes: number;
  private_key_bytes: number;
  ciphertext_or_signature_bytes: number;
}

export interface PQCAlgorithmMapping {
  id: string;
  name: string;
  classical_pattern: string; // Match regex or exact string (e.g., "RSA-2048", "ECDSA.*", "AES-128.*")
  category: CryptographicCategory;
  target_pqc_algorithm: string; // e.g. "ML-KEM-768", "ML-DSA-65", "FN-DSA-512 (Falcon)", "SLH-DSA-256s"
  target_nist_standard: string; // e.g. "NIST FIPS 203", "NIST FIPS 204", "NIST FIPS 205", "NIST FIPS 206 (Falcon)", "CNSA 2.0"
  nist_security_level: NISTSecurityLevel;
  key_sizes: PQCKeySizes;
  claimed_quantum_security_bits: number; // e.g. 128, 192, 256
  is_hybrid: boolean;
  hybrid_classical_companion?: string; // e.g. "X25519", "Ed25519", "ECDSA-P256"
  residual_risk_weight: number; // 0.2 - 2.5
  migration_phase_preference?: 1 | 2 | 3;
  description: string;
  is_enabled: boolean;
  is_default?: boolean;
}

export interface PQCAlgorithmProfile {
  id: string;
  name: string;
  description: string;
  recommended_for: string;
  badge?: string;
  mappings: PQCAlgorithmMapping[];
}

export interface CryptoNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  type: NodeType;
  crypto_primitive: string;
  quantum_status: QuantumStatus;
  criticality: Criticality;
  data_retention_years: number;
  is_blocker?: boolean;
  blocker_reason?: string;
  recommended_pqc: string;
  nist_standard: string;
  nist_security_level?: NISTSecurityLevel;
  pqc_key_sizes?: PQCKeySizes;
  claimed_quantum_security_bits?: number;
  matched_mapping_id?: string;
  migration_phase: 1 | 2 | 3;
  migrated_algorithm?: string;
  risk_score: number;
  hndl_score: number;
  hndl_exposure_horizon: string;
  owner?: string;
  location?: string;
  compliance_tags?: string[];
  notes?: string;
  // Execution metadata
  migration_step?: number;
  is_migrated?: boolean;
  resolution_strategy?: string;
  // Client-side only: set during an active Q-Day Blast Radius simulation.
  is_compromised?: boolean;
  compromise_hop_distance?: number;
}

export interface CryptoEdgeData extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
  relationship: EdgeRelationship;
  label?: string;
  is_blocked?: boolean;
  animated?: boolean;
  protocol?: string;
}

export interface GraphData {
  nodes: CryptoNodeData[];
  edges: CryptoEdgeData[];
}

export interface RiskSummary {
  overall_risk_score: number; // 0 - 100
  vulnerable_nodes_count: number;
  hybrid_nodes_count: number;
  safe_nodes_count: number;
  blockers_count: number;
  total_assets: number;
  hndl_critical_count: number; // nodes with retention >= 10 yrs and vulnerable
  nist_compliance_percent: number;
  max_retention_years: number;
  mosca_timeline_status: 'CRITICAL_RISK' | 'ELEVATED_RISK' | 'MANAGEABLE' | 'QUANTUM_SAFE';
}

export interface MigrationStep {
  step_id: number;
  phase: 1 | 2 | 3;
  phase_name: string;
  target_node_id: string;
  node_label: string;
  action_type: 'HYBRID_DEPLOY' | 'PQC_UPGRADE' | 'UNBLOCK_REMEDIATION' | 'DEPRECATE_CLASSICAL';
  from_primitive: string;
  to_primitive: string;
  nist_standard: string;
  description: string;
  prerequisites: string[];
  blocker_id?: string;
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  risk_reduction_points: number;
}

export interface MigrationPlan {
  plan_id: string;
  timestamp: string;
  total_steps: number;
  completed_steps: number;
  current_phase: 1 | 2 | 3;
  phases: {
    phase_number: 1 | 2 | 3;
    title: string;
    description: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    steps: MigrationStep[];
  }[];
  active_blockers: {
    node_id: string;
    reason: string;
    blocked_by: string;
    suggested_action: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
  category: 'SCAN' | 'RISK_EVAL' | 'MIGRATION' | 'UNBLOCK' | 'AI_ADVISOR' | 'SYSTEM';
  message: string;
  node_id?: string;
  details?: Record<string, any>;
}

export interface PresetArchitecture {
  id: string;
  name: string;
  industry: string;
  description: string;
  graph: GraphData;
}

// ============ Q-Day Blast Radius Simulation ============
export interface BlastRadiusNodeImpact {
  node_id: string;
  label: string;
  hop_distance: number;
  criticality: Criticality;
  data_retention_years: number;
  quantum_status: QuantumStatus;
}

export interface BlastRadiusResult {
  origin_node_id: string;
  origin_label: string;
  compromised_node_ids: string[];
  impacted_nodes: BlastRadiusNodeImpact[];
  total_assets: number;
  compromised_count: number;
  max_exposed_data_lifetime_years: number;
  estimated_financial_exposure_usd: number;
  estimated_regulatory_exposure_note: string;
  generated_at: string;
}

// ============ Network Payload / Packet Overhead Benchmarking ============
export interface PayloadOverheadEntry {
  algorithm: string;
  category: CryptographicCategory | 'CLASSICAL';
  public_key_bytes: number;
  signature_or_ciphertext_bytes: number;
  total_bytes: number;
  exceeds_tcp_mtu: boolean;
  fragmentation_risk: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
  latency_multiplier: number;
  memory_overhead_factor: number;
}

export interface PayloadOverheadReport {
  node_id: string;
  classical_baseline: PayloadOverheadEntry;
  target_pqc: PayloadOverheadEntry;
  reference_comparisons: PayloadOverheadEntry[];
  tcp_mtu_bytes: number;
}

// ============ GitHub / Source Repository Auto-Scanner ============
export interface GithubScanFinding {
  file_path: string;
  matched_keyword: string;
  crypto_primitive_guess: string;
  context_snippet: string;
}

export interface GithubScanResult {
  repo_url: string;
  owner: string;
  repo: string;
  default_branch: string;
  files_scanned: string[];
  findings: GithubScanFinding[];
  graph: GraphData;
}
