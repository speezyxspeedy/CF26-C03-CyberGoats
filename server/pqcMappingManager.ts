import { PQCAlgorithmMapping, PQCAlgorithmProfile, NISTSecurityLevel, CryptographicCategory } from '../src/types/cryptoGraph.js';

export const DEFAULT_NIST_FIPS_MAPPINGS: PQCAlgorithmMapping[] = [
  {
    id: 'map-rsa-2048-default',
    name: 'RSA-2048 to ML-KEM-768 / ML-DSA-65',
    classical_pattern: 'RSA-2048|PKCS#1|RSA_2048',
    category: 'KEM',
    target_pqc_algorithm: 'ML-KEM-768 (CRYSTALS-Kyber) & ML-DSA-65 (CRYSTALS-Dilithium)',
    target_nist_standard: 'NIST FIPS 203 / 204',
    nist_security_level: 'LEVEL_3',
    key_sizes: {
      public_key_bytes: 1184, // ML-KEM-768 PK
      private_key_bytes: 2400, // ML-KEM-768 SK
      ciphertext_or_signature_bytes: 1088, // ML-KEM-768 CT
    },
    claimed_quantum_security_bits: 192,
    is_hybrid: false,
    residual_risk_weight: 0.5,
    migration_phase_preference: 2,
    description: 'NIST primary standardized lattice-based Module-LWE KEM and signature scheme providing AES-192 equivalent post-quantum security.',
    is_enabled: true,
    is_default: true,
  },
  {
    id: 'map-rsa-4096-root',
    name: 'RSA-4096 / Root CA to SLH-DSA-256s (SPHINCS+)',
    classical_pattern: 'RSA-4096|RSA_4096|Root.*CA|Master.*KEK',
    category: 'SIGNATURE',
    target_pqc_algorithm: 'SLH-DSA-256s (SPHINCS+) Stateless Hash Signatures',
    target_nist_standard: 'NIST FIPS 205',
    nist_security_level: 'LEVEL_5',
    key_sizes: {
      public_key_bytes: 64, // SLH-DSA-256s PK (compact public key)
      private_key_bytes: 128,
      ciphertext_or_signature_bytes: 29792, // SLH-DSA signature size
    },
    claimed_quantum_security_bits: 256,
    is_hybrid: false,
    residual_risk_weight: 0.3,
    migration_phase_preference: 3,
    description: 'Stateless hash-based signature scheme providing conservative quantum security backed entirely by SHA-2 / SHAKE hash hardness.',
    is_enabled: true,
    is_default: true,
  },
  {
    id: 'map-ecdsa-jwt',
    name: 'ECDSA / ECC to ML-DSA-65 (CRYSTALS-Dilithium)',
    classical_pattern: 'ECDSA|secp256r1|P-256|P-384|Ed25519|JWT.*ECDSA',
    category: 'SIGNATURE',
    target_pqc_algorithm: 'ML-DSA-65 (NIST FIPS 204) Dual Signed Assertions',
    target_nist_standard: 'NIST FIPS 204',
    nist_security_level: 'LEVEL_3',
    key_sizes: {
      public_key_bytes: 1952, // ML-DSA-65 PK
      private_key_bytes: 4032, // ML-DSA-65 SK
      ciphertext_or_signature_bytes: 3309, // ML-DSA-65 Sig
    },
    claimed_quantum_security_bits: 192,
    is_hybrid: false,
    residual_risk_weight: 0.5,
    migration_phase_preference: 2,
    description: 'Replaces classical elliptic curve digital signatures (ECDSA/EdDSA) with Module-LWE lattice signatures across microservice tokens and mTLS.',
    is_enabled: true,
    is_default: true,
  },
  {
    id: 'map-aes-128-symmetric',
    name: 'AES-128 to AES-256-GCM + ML-KEM-768 Envelope',
    classical_pattern: 'AES-128|AES_128|DUKPT|3DES|CBC',
    category: 'SYMMETRIC_BULK',
    target_pqc_algorithm: 'AES-256-GCM with ML-KEM-768 Wrapped KEKs',
    target_nist_standard: 'NIST FIPS 203 / SP 800-38D',
    nist_security_level: 'LEVEL_5',
    key_sizes: {
      public_key_bytes: 1184,
      private_key_bytes: 2400,
      ciphertext_or_signature_bytes: 1088,
    },
    claimed_quantum_security_bits: 256,
    is_hybrid: false,
    residual_risk_weight: 0.4,
    migration_phase_preference: 2,
    description: 'Doubles symmetric block cipher key length to 256 bits to counter Grover search degradation, wrapped inside ML-KEM key encapsulation.',
    is_enabled: true,
    is_default: true,
  },
  {
    id: 'map-tls-edge-hybrid',
    name: 'TLS / ECDHE Ingress to X25519 + ML-KEM-768 Hybrid',
    classical_pattern: 'TLS.*|ECDHE.*|HTTPS|Gateway|Ingress|CDN',
    category: 'HYBRID_KEM',
    target_pqc_algorithm: 'X25519 + ML-KEM-768 Hybrid Key Exchange & Dual Auth',
    target_nist_standard: 'NIST FIPS 203 / IETF Draft TLS 1.3 PQC',
    nist_security_level: 'LEVEL_3',
    key_sizes: {
      public_key_bytes: 1216, // 32 (X25519) + 1184 (ML-KEM-768)
      private_key_bytes: 2432,
      ciphertext_or_signature_bytes: 1120, // 32 (X25519) + 1088 (ML-KEM-768)
    },
    claimed_quantum_security_bits: 192,
    is_hybrid: true,
    hybrid_classical_companion: 'X25519',
    residual_risk_weight: 2.0, // Hybrid maintains classical fallback during transitional window
    migration_phase_preference: 1,
    description: 'Combines classical elliptic curve Diffie-Hellman with ML-KEM-768 in dual-handshake mode to eliminate Harvest-Now-Decrypt-Later threats while preserving legacy FIPS 140-2 interoperability.',
    is_enabled: true,
    is_default: true,
  },
  {
    id: 'map-libcrypto-openssl',
    name: 'Legacy libcrypto to OpenSSL 3.4+ with liboqs-provider',
    classical_pattern: 'OpenSSL.*|libcrypto.*|Crypto.*Library',
    category: 'KEM',
    target_pqc_algorithm: 'OpenSSL 3.4+ with liboqs-provider (FIPS 203/204)',
    target_nist_standard: 'NIST IR 8547',
    nist_security_level: 'LEVEL_3',
    key_sizes: {
      public_key_bytes: 1184,
      private_key_bytes: 2400,
      ciphertext_or_signature_bytes: 1088,
    },
    claimed_quantum_security_bits: 192,
    is_hybrid: false,
    residual_risk_weight: 0.5,
    migration_phase_preference: 1,
    description: 'Upgrades foundation cryptographic runtime provider engine with native Open Quantum Safe liboqs plugin APIs.',
    is_enabled: true,
    is_default: true,
  },
];

export const PRESET_PQC_PROFILES: PQCAlgorithmProfile[] = [
  {
    id: 'nist-fips-primary',
    name: 'NIST FIPS Primary Standards (FIPS 203/204/205)',
    description: 'Standard NIST Post-Quantum suite centering ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205).',
    recommended_for: 'General enterprise, banking, and government systems migrating according to NIST FIPS timelines.',
    badge: 'NIST Standard',
    mappings: DEFAULT_NIST_FIPS_MAPPINGS,
  },
  {
    id: 'high-performance-falcon',
    name: 'High-Throughput / Compact Signatures (FN-DSA Falcon & ML-KEM-512)',
    description: 'Optimized for high-concurrency microservices, IoT edge, and constrained packet networks requiring compact signatures (666 bytes).',
    recommended_for: 'Microservice APIs, JWT authorization servers, and high-frequency transaction gateways where signature size overhead is constrained.',
    badge: 'High Performance',
    mappings: [
      {
        id: 'map-falcon-jwt',
        name: 'ECDSA / JWT to FN-DSA-512 (Falcon-512)',
        classical_pattern: 'ECDSA|secp256r1|P-256|P-384|Ed25519|JWT.*',
        category: 'SIGNATURE',
        target_pqc_algorithm: 'FN-DSA-512 (Falcon-512) Fast NTRU Signatures',
        target_nist_standard: 'NIST FIPS 206 (Draft) / FN-DSA',
        nist_security_level: 'LEVEL_1',
        key_sizes: {
          public_key_bytes: 897, // Falcon-512 PK
          private_key_bytes: 1281, // Falcon-512 SK
          ciphertext_or_signature_bytes: 666, // Ultra-compact 666-byte signature!
        },
        claimed_quantum_security_bits: 128,
        is_hybrid: false,
        residual_risk_weight: 0.6,
        migration_phase_preference: 1,
        description: 'Employs Fast Fourier Lattice (NTRU) signing providing the smallest signature size (666 bytes) among all NIST PQC finalists, ideal for JSON Web Tokens and high-load APIs.',
        is_enabled: true,
      },
      {
        id: 'map-falcon-kem',
        name: 'RSA-2048 to ML-KEM-512 (Kyber-512 Fast)',
        classical_pattern: 'RSA-2048|PKCS#1',
        category: 'KEM',
        target_pqc_algorithm: 'ML-KEM-512 (CRYSTALS-Kyber-512)',
        target_nist_standard: 'NIST FIPS 203 Level 1',
        nist_security_level: 'LEVEL_1',
        key_sizes: {
          public_key_bytes: 800,
          private_key_bytes: 1632,
          ciphertext_or_signature_bytes: 768,
        },
        claimed_quantum_security_bits: 128,
        is_hybrid: false,
        residual_risk_weight: 0.7,
        migration_phase_preference: 2,
        description: 'Lightweight ML-KEM-512 optimized for low latency and minimal network packet overhead.',
        is_enabled: true,
      },
      {
        id: 'map-falcon-root',
        name: 'RSA-4096 to FN-DSA-1024 (Falcon-1024)',
        classical_pattern: 'RSA-4096|Root.*CA',
        category: 'SIGNATURE',
        target_pqc_algorithm: 'FN-DSA-1024 (Falcon-1024) High Security',
        target_nist_standard: 'NIST FIPS 206 (Draft)',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 1793,
          private_key_bytes: 2305,
          ciphertext_or_signature_bytes: 1280,
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.4,
        migration_phase_preference: 3,
        description: 'Level 5 Falcon lattice signatures with compact 1280-byte signatures for Root Certificates.',
        is_enabled: true,
      },
      {
        id: 'map-falcon-symmetric',
        name: 'AES-128 to AES-256-GCM',
        classical_pattern: 'AES-128|3DES|CBC',
        category: 'SYMMETRIC_BULK',
        target_pqc_algorithm: 'AES-256-GCM + FN-DSA Authenticated Envelopes',
        target_nist_standard: 'NIST FIPS 206 / SP 800-38D',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 897,
          private_key_bytes: 1281,
          ciphertext_or_signature_bytes: 666,
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.4,
        migration_phase_preference: 2,
        description: 'High-speed authenticated AES-256-GCM bulk encryption.',
        is_enabled: true,
      },
      {
        id: 'map-falcon-tls',
        name: 'TLS Edge to Hybrid X25519 + ML-KEM-512',
        classical_pattern: 'TLS.*|ECDHE.*|HTTPS|Gateway|Ingress|CDN',
        category: 'HYBRID_KEM',
        target_pqc_algorithm: 'X25519 + ML-KEM-512 Fast Hybrid',
        target_nist_standard: 'NIST FIPS 203 / IETF',
        nist_security_level: 'LEVEL_1',
        key_sizes: {
          public_key_bytes: 832,
          private_key_bytes: 1664,
          ciphertext_or_signature_bytes: 800,
        },
        claimed_quantum_security_bits: 128,
        is_hybrid: true,
        hybrid_classical_companion: 'X25519',
        residual_risk_weight: 2.2,
        migration_phase_preference: 1,
        description: 'Low-latency hybrid key exchange for public web gateways.',
        is_enabled: true,
      },
    ],
  },
  {
    id: 'cnsa-2.0-strict',
    name: 'NSA CNSA 2.0 Strict Security (Level 5 / 256-Bit Pure PQC)',
    description: 'National Security Agency Commercial National Security Algorithm Suite 2.0 requiring strict Level 5 algorithms (ML-KEM-1024, ML-DSA-87, SLH-DSA-256, AES-256).',
    recommended_for: 'Defense, national intelligence, critical infrastructure, and high-assurance banking archives with 30+ year confidentiality requirements.',
    badge: 'NSA CNSA 2.0',
    mappings: [
      {
        id: 'map-cnsa-kem',
        name: 'All Public Key KEM to ML-KEM-1024 (Level 5)',
        classical_pattern: 'RSA-2048|RSA-4096|ECDHE|KEM|TLS.*',
        category: 'KEM',
        target_pqc_algorithm: 'Pure ML-KEM-1024 (NIST FIPS 203 Level 5)',
        target_nist_standard: 'NIST FIPS 203 / CNSA 2.0',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 1568, // ML-KEM-1024 PK
          private_key_bytes: 3168, // ML-KEM-1024 SK
          ciphertext_or_signature_bytes: 1568, // ML-KEM-1024 CT
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.25,
        migration_phase_preference: 1,
        description: 'Mandated by NSA CNSA 2.0 for Top Secret classified systems; eliminates all hybrid transition compromises.',
        is_enabled: true,
      },
      {
        id: 'map-cnsa-dsa',
        name: 'All Digital Signatures to ML-DSA-87 (Level 5)',
        classical_pattern: 'ECDSA|RSA-2048|P-256|P-384|Ed25519|JWT.*',
        category: 'SIGNATURE',
        target_pqc_algorithm: 'ML-DSA-87 (NIST FIPS 204 Level 5)',
        target_nist_standard: 'NIST FIPS 204 / CNSA 2.0',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 2592, // ML-DSA-87 PK
          private_key_bytes: 4896, // ML-DSA-87 SK
          ciphertext_or_signature_bytes: 4627, // ML-DSA-87 Sig
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.25,
        migration_phase_preference: 2,
        description: 'Maximum security lattice digital signatures resisting advanced quantum cryptanalysis.',
        is_enabled: true,
      },
      {
        id: 'map-cnsa-root-ca',
        name: 'Root CA & Archival HSM to SLH-DSA-SHAKE-256s (Level 5)',
        classical_pattern: 'Root.*CA|Master.*KEK|HSM.*|KMS.*|Vault.*',
        category: 'SIGNATURE',
        target_pqc_algorithm: 'SLH-DSA-SHAKE-256s (FIPS 205) Stateless Hash',
        target_nist_standard: 'NIST FIPS 205 / CNSA 2.0',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 64,
          private_key_bytes: 128,
          ciphertext_or_signature_bytes: 29792,
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.2,
        migration_phase_preference: 3,
        description: 'CNSA 2.0 compliant stateless hash signatures with 256-bit security for root trust anchors.',
        is_enabled: true,
      },
      {
        id: 'map-cnsa-symmetric',
        name: 'All Symmetric to AES-256-GCM / AES-256-XTS',
        classical_pattern: 'AES.*|3DES|CBC|TDE|DB.*',
        category: 'SYMMETRIC_BULK',
        target_pqc_algorithm: 'AES-256-GCM / AES-256-XTS + ML-KEM-1024 KEKs',
        target_nist_standard: 'NIST SP 800-38E / CNSA 2.0',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 1568,
          private_key_bytes: 3168,
          ciphertext_or_signature_bytes: 1568,
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.25,
        migration_phase_preference: 2,
        description: 'Full 256-bit symmetric block cryptography resisting Grover square-root speedups.',
        is_enabled: true,
      },
    ],
  },
  {
    id: 'conservative-code-based',
    name: 'Conservative Code-Based & Hash-Based (Classic McEliece & HQC)',
    description: 'Employs decades-old mathematical code-based hardness (Classic McEliece since 1978 and HQC) and SPHINCS+ for zero-lattice assumption risk.',
    recommended_for: 'Long-term archival vaults and high-assurance key storage where lattice reduction cryptanalysis risks must be hedged.',
    badge: 'Code-Based Fallback',
    mappings: [
      {
        id: 'map-mceliece-kem',
        name: 'RSA-4096 / Storage KEK to Classic McEliece-6960119',
        classical_pattern: 'RSA-4096|Master.*KEK|Vault.*|S3.*',
        category: 'KEM',
        target_pqc_algorithm: 'Classic McEliece-6960119 (Goppa Code KEM)',
        target_nist_standard: 'NIST Round 4 PQC / ISO 18033-2',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 1047319, // ~1MB Public Key (Archival KEK)
          private_key_bytes: 13948,
          ciphertext_or_signature_bytes: 226, // Tiny 226-byte ciphertext!
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.3,
        migration_phase_preference: 3,
        description: 'Based on Goppa codes unbroken since 1978. While public keys are ~1 MB, ciphertext is only 226 bytes, making it the most mathematically mature PQC KEM.',
        is_enabled: true,
      },
      {
        id: 'map-hqc-kem',
        name: 'RSA-2048 / TLS to HQC-192 (Hamming Quasi-Cyclic)',
        classical_pattern: 'RSA-2048|TLS.*|Ingress',
        category: 'KEM',
        target_pqc_algorithm: 'HQC-192 (Hamming Quasi-Cyclic Code KEM)',
        target_nist_standard: 'NIST Round 4 Finalist',
        nist_security_level: 'LEVEL_3',
        key_sizes: {
          public_key_bytes: 4522, // HQC-192 PK
          private_key_bytes: 4562,
          ciphertext_or_signature_bytes: 9000,
        },
        claimed_quantum_security_bits: 192,
        is_hybrid: false,
        residual_risk_weight: 0.45,
        migration_phase_preference: 2,
        description: 'NIST Round 4 code-based KEM alternative to lattice cryptography based on the Decisional Quasi-Cyclic Syndrome Decoding problem.',
        is_enabled: true,
      },
      {
        id: 'map-sphincs-sig',
        name: 'ECDSA / Signatures to SLH-DSA-SHA2-128s',
        classical_pattern: 'ECDSA|JWT.*|Sign.*',
        category: 'SIGNATURE',
        target_pqc_algorithm: 'SLH-DSA-SHA2-128s (SPHINCS+)',
        target_nist_standard: 'NIST FIPS 205',
        nist_security_level: 'LEVEL_1',
        key_sizes: {
          public_key_bytes: 32,
          private_key_bytes: 64,
          ciphertext_or_signature_bytes: 7856,
        },
        claimed_quantum_security_bits: 128,
        is_hybrid: false,
        residual_risk_weight: 0.4,
        migration_phase_preference: 2,
        description: 'Pure hash-based signature scheme completely independent of algebraic lattice assumptions.',
        is_enabled: true,
      },
    ],
  },
  {
    id: 'stateful-hash-infrastructure',
    name: 'Stateful Hash-Based Infrastructure (LMS / XMSS)',
    description: 'NIST SP 800-208 stateful hash-based signature schemes (Leighton-Micali Signatures and eXtended Merkle Signature Scheme) for secure boot and firmware.',
    recommended_for: 'Hardware Security Modules, firmware flashing, code signing, and root of trust infrastructure.',
    badge: 'SP 800-208',
    mappings: [
      {
        id: 'map-lms-firmware',
        name: 'Firmware & Root Keys to LMS / HSS (NIST SP 800-208)',
        classical_pattern: 'HSM.*|Root.*CA|Firmware|Boot',
        category: 'STATEFUL_HASH',
        target_pqc_algorithm: 'LMS / HSS (Leighton-Micali Hash Signatures)',
        target_nist_standard: 'NIST SP 800-208 / RFC 8554',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 60,
          private_key_bytes: 124,
          ciphertext_or_signature_bytes: 1452,
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.25,
        migration_phase_preference: 3,
        description: 'NIST standardized stateful hash-based signature scheme approved for firmware verification and hardware security module root anchors.',
        is_enabled: true,
      },
      {
        id: 'map-xmss-code-sign',
        name: 'Software Release Signing to XMSS / XMSS-MT',
        classical_pattern: 'Library|Sign.*|Audit',
        category: 'STATEFUL_HASH',
        target_pqc_algorithm: 'XMSS-MT Multi-Tree Hash Signatures',
        target_nist_standard: 'NIST SP 800-208 / RFC 8391',
        nist_security_level: 'LEVEL_5',
        key_sizes: {
          public_key_bytes: 64,
          private_key_bytes: 132,
          ciphertext_or_signature_bytes: 2800,
        },
        claimed_quantum_security_bits: 256,
        is_hybrid: false,
        residual_risk_weight: 0.3,
        migration_phase_preference: 2,
        description: 'Multi-tree XMSS supporting billions of signing operations without quantum compromise.',
        is_enabled: true,
      },
    ],
  },
];

export class PQCMappingManager {
  private mappings: PQCAlgorithmMapping[] = [];
  private activeProfileId: string = 'nist-fips-primary';

  constructor() {
    this.resetToDefaults();
  }

  public getMappings(): PQCAlgorithmMapping[] {
    return [...this.mappings];
  }

  public getProfiles(): PQCAlgorithmProfile[] {
    return PRESET_PQC_PROFILES;
  }

  public getActiveProfileId(): string {
    return this.activeProfileId;
  }

  public applyProfile(profileId: string): PQCAlgorithmMapping[] {
    const profile = PRESET_PQC_PROFILES.find((p) => p.id === profileId);
    if (!profile) {
      throw new Error(`PQC Profile "${profileId}" not found.`);
    }
    this.activeProfileId = profile.id;
    this.mappings = JSON.parse(JSON.stringify(profile.mappings));
    return this.getMappings();
  }

  public resetToDefaults(): PQCAlgorithmMapping[] {
    this.activeProfileId = 'nist-fips-primary';
    this.mappings = JSON.parse(JSON.stringify(DEFAULT_NIST_FIPS_MAPPINGS));
    return this.getMappings();
  }

  public setMappings(newMappings: PQCAlgorithmMapping[]): void {
    if (!Array.isArray(newMappings)) {
      throw new Error('Mappings must be an array.');
    }
    this.activeProfileId = 'custom';
    this.mappings = newMappings;
  }

  public addMapping(mapping: Omit<PQCAlgorithmMapping, 'id'>): PQCAlgorithmMapping {
    const id = `map-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullMapping: PQCAlgorithmMapping = {
      id,
      ...mapping,
      is_enabled: mapping.is_enabled !== undefined ? mapping.is_enabled : true,
    };
    this.mappings.unshift(fullMapping);
    this.activeProfileId = 'custom';
    return fullMapping;
  }

  public updateMapping(id: string, updates: Partial<PQCAlgorithmMapping>): PQCAlgorithmMapping {
    const idx = this.mappings.findIndex((m) => m.id === id);
    if (idx === -1) {
      throw new Error(`Mapping with id "${id}" not found.`);
    }
    const updated = {
      ...this.mappings[idx],
      ...updates,
    };
    this.mappings[idx] = updated;
    this.activeProfileId = 'custom';
    return updated;
  }

  public deleteMapping(id: string): boolean {
    const initialLen = this.mappings.length;
    this.mappings = this.mappings.filter((m) => m.id !== id);
    this.activeProfileId = 'custom';
    return this.mappings.length < initialLen;
  }

  /**
   * Matches a classical cryptographic primitive against active mapping rules.
   */
  public matchAlgorithm(primitive: string, context?: { nodeType?: string; isRoot?: boolean; label?: string }): PQCAlgorithmMapping | undefined {
    const textToMatch = `${primitive} ${context?.label || ''} ${context?.nodeType || ''}`.trim();

    // Iterate enabled mappings
    const enabledMappings = this.mappings.filter((m) => m.is_enabled);

    for (const mapping of enabledMappings) {
      try {
        const regex = new RegExp(mapping.classical_pattern, 'i');
        if (regex.test(textToMatch) || regex.test(primitive)) {
          return mapping;
        }
      } catch {
        // Fallback simple substring match if regex is invalid
        if (textToMatch.toLowerCase().includes(mapping.classical_pattern.toLowerCase())) {
          return mapping;
        }
      }
    }

    // Default fallback if no specific regex matched:
    // Check if asymmetric signature vs KEM vs symmetric
    const primUpper = primitive.toUpperCase();
    if (primUpper.includes('RSA-4096') || context?.isRoot || primUpper.includes('ROOT') || primUpper.includes('CA')) {
      return enabledMappings.find((m) => m.category === 'SIGNATURE' && m.nist_security_level === 'LEVEL_5') || enabledMappings[1];
    }
    if (primUpper.includes('ECDSA') || primUpper.includes('JWT') || primUpper.includes('SIGN')) {
      return enabledMappings.find((m) => m.category === 'SIGNATURE') || enabledMappings[2];
    }
    if (primUpper.includes('AES') || primUpper.includes('3DES') || primUpper.includes('CBC')) {
      return enabledMappings.find((m) => m.category === 'SYMMETRIC_BULK') || enabledMappings[3];
    }
    if (primUpper.includes('TLS') || primUpper.includes('ECDHE') || primUpper.includes('GATEWAY') || primUpper.includes('INGRESS')) {
      return enabledMappings.find((m) => m.category === 'HYBRID_KEM') || enabledMappings[4];
    }

    // Default fallback to first KEM mapping
    return enabledMappings[0] || DEFAULT_NIST_FIPS_MAPPINGS[0];
  }

  /**
   * Resolves target PQC attributes for a given primitive.
   */
  public resolveTargetPQC(primitive: string, context?: { nodeType?: string; isRoot?: boolean; label?: string }) {
    const matched = this.matchAlgorithm(primitive, context);
    if (!matched) {
      return {
        target_pqc_algorithm: 'ML-KEM-768 & ML-DSA-65',
        nist_standard: 'NIST FIPS 203 / 204',
        nist_security_level: 'LEVEL_3' as NISTSecurityLevel,
        key_sizes: { public_key_bytes: 1184, private_key_bytes: 2400, ciphertext_or_signature_bytes: 1088 },
        claimed_quantum_security_bits: 192,
        residual_risk_weight: 0.5,
        is_hybrid: false,
        matched_mapping_id: undefined,
        description: 'Default lattice PQC',
      };
    }

    return {
      target_pqc_algorithm: matched.target_pqc_algorithm,
      nist_standard: matched.target_nist_standard,
      nist_security_level: matched.nist_security_level,
      key_sizes: matched.key_sizes,
      claimed_quantum_security_bits: matched.claimed_quantum_security_bits,
      residual_risk_weight: matched.residual_risk_weight,
      is_hybrid: matched.is_hybrid,
      matched_mapping_id: matched.id,
      description: matched.description,
    };
  }
}

// Global Singleton Instance
export const globalPQCMappingManager = new PQCMappingManager();
