
# CAMP-Graph

## Cryptographic Agility and Migration Planning Graph

**Problem Code:** C-03 | **Domain:** Cybersecurity & Digital Trust

![Architecture](https://img.shields.io/badge/architecture-CBOM%20%7C%20directed%20dependency%20graph-0b7285)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![CycloneDX](https://img.shields.io/badge/CycloneDX-1.6-2f9e44)

CAMP-Graph is an interactive cryptographic inventory, quantum-risk analysis, and post-quantum migration planning workbench. It converts CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) data into a directed dependency graph, scores Harvest-Now-Decrypt-Later (HNDL) exposure, identifies migration blockers, and simulates a phased transition from classical cryptography to hybrid and quantum-safe states.

> **Hackathon scope:** CAMP-Graph is a decision-support prototype. Its scores, latency factors, financial exposure estimates, and compliance indicators are heuristics for prioritization and must be validated against an organization’s measured traffic, cryptographic inventory, vendor roadmaps, and risk methodology before production use.

## Problem Statement and Executive Solution

Cryptographic dependencies are distributed across gateways, services, libraries, certificates, keys, databases, and long-lived archives. A conventional software inventory rarely captures the relationship between an algorithm, the system that uses it, the data it protects, and the upstream component that can prevent its migration. This makes post-quantum planning difficult, especially where attackers can collect ciphertext today and decrypt it after a cryptographically relevant quantum computer becomes available.

CAMP-Graph addresses the problem with one workflow:

1. **Discover:** import a CycloneDX 1.6 CBOM, load a seeded enterprise architecture, or scan selected public GitHub manifests for cryptographic references.
2. **Model:** construct a directed graph of Systems, Services, Keys, Certificates, Algorithms, and Libraries with typed dependency and communication edges.
3. **Prioritize:** calculate quantum risk and HNDL urgency using primitive vulnerability, criticality, retention shelf-life, and configurable PQC mappings.
4. **Unblock:** detect legacy TLS, fixed key exchange, and outdated crypto-provider constraints; simulate a PQC decoupling proxy or shim boundary.
5. **Plan:** generate a topological three-phase migration roadmap and simulate ready steps.
6. **Prove:** compare classical and PQC wire sizes against a 1,500-byte MTU, simulate Q-Day blast radius, and export an executive briefing plus CycloneDX JSON.

## System Architecture and Workflow

```text
                         +-----------------------------+
                         | React 19 + @xyflow/react UI |
                         | filters | inspector | export |
                         +--------------+--------------+
                                        | JSON over HTTP
                                        v
+------------------+       +-----------+-----------+       +------------------+
| CycloneDX 1.6    |------>| Express / Node server |<------| Gemini 2.5 API   |
| CBOM paste/import |       | in-memory session     |       | optional advisory |
+------------------+       +-----------+-----------+       +------------------+
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
          +--------------------+                  +---------------------+
          | CBOMGraphEngine    |                  | MigrationPlanner    |
          | nodes, edges,       |                  | 3 phases, blockers, |
          | adjacency, blast    |                  | step simulation      |
          +---------+----------+                  +----------+----------+
                    |                                        |
                    v                                        v
          +--------------------+                  +---------------------+
          | Risk model         |                  | PQC Mapping Manager  |
          | HNDL + Mosca + MTU |<-----------------| FIPS/CNSA profiles   |
          +---------+----------+                  +---------------------+
                    |
                    v
          +--------------------+
          | Graph, risk summary|
          | audit log, reports |
          +--------------------+
```

### Runtime data flow

The server starts with the `fintech-payment-core` preset and keeps the active graph, migration planner, mappings, and audit log in memory. A scan replaces the active graph, recalculates node risk, and regenerates the roadmap. The browser applies a Dagre layout before rendering the graph. Reloading the server resets the session; there is no database or persistent tenant store.

## Core Mathematical and Engineering Mechanisms

### Quantum and HNDL risk

For each node, the engine computes a normalized score from 0 to 100:

$$
R_{raw} = W_{vulnerability} \times F_{retention} \times F_{criticality}
$$

$$
R_{node} = \min\left(100, \operatorname{round}\left(\frac{R_{raw}}{360} \times 100\right)\right)
$$

The implementation uses the following factors:

| Input | Implemented behavior |
| --- | --- |
| Vulnerability weight | 10.0 for RSA/ECC/DH/DSA-style asymmetric primitives; 4.0 for AES-128, 3DES, or DUKPT; 1.0 for AES-256 and SHA-384/512; configurable residual weights for HYBRID and SAFE mappings |
| Criticality | LOW = 1.0, MEDIUM = 2.0, HIGH = 3.0 |
| Retention | `max(1, min(retention_years / 2.5, 12))`, a capped log-linear proxy for HNDL exposure |
| HNDL score | `min(100, retention_years * 3.5 * status_multiplier * criticality_factor)`; status multipliers are 1.5, 0.3, and 0.05 for VULNERABLE, HYBRID, and SAFE |
| State | `VULNERABLE` (red), `HYBRID` (yellow), or `SAFE` (green) |

The portfolio status applies Mosca’s inequality:

$$
X + Y > Z
$$

Where $X$ is data-retention shelf-life, $Y$ is estimated migration time, and $Z$ is the estimated time to a cryptographically relevant quantum computer. In the current heuristic, migration is approximately 3–5 years and the CRQC horizon is approximately 5–7 years. The UI reports CRITICAL, ELEVATED, MANAGEABLE, or QUANTUM_SAFE based primarily on vulnerable assets and retention thresholds.

### Blocker detection and remediation

Nodes marked `is_blocker` and their `BLOCKED_BY` edges prevent dependent migration steps from becoming ready. The roadmap reports the blocker reason, affected asset, and resolution strategy. The unblock action simulates a PQC-aware termination proxy/decoupling shim:

```text
Internal client -- hybrid ML-KEM / classical --> PQC proxy
PQC proxy       -- isolated legacy TLS 1.1 --> fixed partner endpoint
```

The proxy preserves an isolated legacy boundary while allowing the internal graph to migrate. The simulated action clears blocker flags, upgrades the blocker to HYBRID, updates audit logs, and releases dependent Phase 2 work.

### Three-phase migration planning

| Phase | Scope | Typical target |
| --- | --- | --- |
| 1. Ingress hybridization and agility foundations | Public gateways, ingress points, crypto libraries | X25519 + ML-KEM hybrid exchange; OpenSSL 3.4+ with `liboqs-provider` |
| 2. Internal services and storage trans-encryption | mTLS, tokens, databases, vaults, event buses | ML-KEM, ML-DSA, AES-256-GCM/XTS, dual-signed assertions |
| 3. Root of trust and pure PQC hardening | HSMs, root CAs, KEKs, long-term archives | ML-DSA, SLH-DSA, ML-KEM-1024, and removal of classical fallbacks |

Targets are resolved through editable profiles and mappings for NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206/FN-DSA (represented as draft in the application), and NSA CNSA 2.0-oriented Level 5 options.

### Network payload and MTU analysis

The reference model compares public-key material plus signature/ciphertext material against a standard 1,500-byte TCP MTU:

$$
P_{total} = P_{public\ key} + P_{signature\ or\ ciphertext}
$$

$$
L_{multiplier} = 1 + 0.15 \times \frac{P_{target}}{P_{classical\ baseline}}
$$

The UI classifies payloads over the MTU as fragmentation risk and reports a memory-overhead factor. This is a sizing heuristic, not a packet capture: TCP, TLS record framing, certificates, congestion control, retransmission, and path MTU discovery are not fully modeled.

## Technology Stack

| Layer | Technology | Role |
| --- | --- | --- |
| UI | React 19, TypeScript | Interactive graph, controls, inspector, roadmap, and exports |
| Graph visualization | `@xyflow/react` | Nodes, typed edges, controls, minimap, and interaction |
| Layout | Dagre | Top-down or left-to-right directed graph layout |
| Styling and icons | Tailwind CSS 4, `lucide-react` | Utility styling and accessible interface icons |
| Motion | `motion`, `canvas-confetti` | Transition feedback and migration completion feedback |
| API/runtime | Express 4, Node.js, `tsx` | JSON API and Vite middleware in development |
| Build | Vite 6, esbuild, TypeScript 5.8 | Client build, server bundle, and type checking |
| Inventory | CycloneDX 1.6 CBOM-shaped JSON | Import format and export format |
| AI advisory | `@google/genai`, Gemini 2.5 API | Optional node-specific PQC remediation advice |

## Prerequisites and Setup

### Requirements

- Node.js 20 or newer recommended, with npm.
- A modern browser.
- Optional: a Gemini API key for AI advisory features.
- Optional: outbound network access for the GitHub repository scanner and Gemini API.

### Development setup

```bash
git clone <repository-url>
cd camp-graph
npm install
```

Create `.env.local` in the project root for optional AI advisory:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

Start the combined Express/Vite development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production build and run

```bash
npm run lint
npm run build
NODE_ENV=production npm start
```

The production server serves the Vite output from `dist` and listens on port `3000` by default. Set `PORT` to select another port.

## Usage Guide and Demo Walkthrough

1. **Start with the seeded architecture.** The default fintech/payment preset contains systems and services including an edge gateway, OIDC/JWT authentication, payment processing, token vault, database, HSM root, crypto library, Kafka, and regulatory archive.
2. **Inspect the graph.** Select a node to view primitive, criticality, retention years, risk score, HNDL horizon, NIST target, payload sizing, dependencies, and audit context. Use the status filter to isolate vulnerable, hybrid, safe, or blocker assets.
3. **Import a CBOM.** Choose the CBOM import action, paste CycloneDX 1.6 JSON, validate it, and scan. The sample input demonstrates `components`, `cryptoProperties`, `criticality`, `quantum_status`, and `dependencies`.
4. **Scan a public GitHub repository.** Open the GitHub tab and provide a public repository URL. The scanner fetches common manifests such as `package.json`, `requirements.txt`, `pom.xml`, `Dockerfile`, and `.env.example`, then maps crypto keywords into a graph. Do not submit private repositories or secrets.
5. **Review blockers.** Select the red blocker node, read its hardcoded protocol/provider constraint, and choose the PQC Shim / Decoupling Proxy remediation. Confirm that dependent steps become ready.
6. **Apply a PQC profile.** Open PQC mappings and compare the NIST primary, high-performance/FN-DSA, and CNSA 2.0-oriented profiles. Applying a profile recalculates risk and roadmap targets immediately.
7. **Run the migration simulation.** Use the roadmap to execute the next ready step or simulate a specific step. Phase 1 produces HYBRID state; later phases produce SAFE state. Use reset to restore the active preset baseline.
8. **Test Q-Day impact.** From a high-value root, run blast-radius simulation to traverse downstream dependency edges. Then deploy PQC isolation and observe the number of contained outbound paths.
9. **Export evidence.** Open the export dialog and download/copy the executive Markdown briefing, CycloneDX 1.6 JSON, raw graph, or federal compliance attestation HTML.

## Validation, Experimental Benchmarks, and Results

Run the project’s available static validation before a demo:

```bash
npm run lint
npm run build
```

The following deterministic reference rows are encoded in `server/riskModel.ts`. They show the modeled before/after wire-material comparison used by the inspector; they are not measurements from a live network.

| Primitive transition | Classical total | PQC target total | MTU result | Modeled latency multiplier |
| --- | ---: | ---: | --- | ---: |
| RSA-2048 -> ML-KEM-768 | 512 B | 2,272 B | Target is over 1,500 B | 1.67x by size heuristic |
| ECDSA-P256 -> ML-DSA-65 | 128 B | 5,261 B | Target is over 1,500 B | 7.16x by size heuristic |
| RSA-2048 -> FN-DSA-512 | 512 B | 1,563 B | Target is over 1,500 B | 1.46x by size heuristic |
| RSA-2048 -> SLH-DSA-128s | 512 B | 7,888 B | Target is over 1,500 B | 3.31x by size heuristic |

The model’s reference comparison table also records nominal multipliers of 1.15x for ML-KEM-768, 1.6x for ML-DSA-65, 1.35x for FN-DSA-512, and 3.2x for SLH-DSA-128s. Those nominal values are curated reference values, while node-specific reports derive a size ratio from the active mapping.

| Portfolio signal | Vulnerable baseline | Post-migration objective |
| --- | --- | --- |
| UI status | Red `VULNERABLE` | Yellow `HYBRID`, then green `SAFE` |
| HNDL urgency | Retention-weighted exposure | Reduced by hybrid encapsulation and pure PQC targets |
| Blockers | `BLOCKED_BY` edges hold dependent steps | Shim/provider remediation clears the dependency gate |
| Compliance proxy | Safe assets + 60% of hybrid assets | 100% when all assets are safe |
| Roadmap | Phase 1 ready, later steps pending/blocked | Steps complete as simulation actions are executed |

## Limitations and Future Roadmap

### Current limitations

- State is in memory only; there is no authentication, authorization, persistence, multi-tenancy, or database-backed audit trail.
- CycloneDX ingestion is a focused CBOM parser for the application’s supported fields, not a general-purpose schema validator for every CycloneDX extension.
- The GitHub scanner reads selected public raw files and uses keyword matching; it does not perform full source-code data-flow analysis, lockfile resolution, binary inspection, or private-repository scanning.
- Risk, Mosca timing, MTU latency, memory overhead, and financial exposure are prioritization heuristics, not formal cryptographic proofs, packet benchmarks, or regulatory attestations.
- Migration actions mutate the graph simulation; they do not upgrade real libraries, rotate real keys, change TLS endpoints, or deploy a proxy.
- Gemini advisory output depends on API availability and should be reviewed by a qualified cryptographic architect before implementation.
- FIPS 206/FN-DSA is represented as a draft-oriented mapping in the current application and must be checked against the final standard and approved implementation.

### Future roadmap

- Persist signed CBOM snapshots, mapping policy versions, migration evidence, and immutable audit events.
- Add schema validation, SPDX/CycloneDX version negotiation, SBOM correlation, certificate-chain discovery, and binary/container scanning.
- Integrate cloud KMS/HSM, TLS telemetry, service mesh, CI/CD, and vulnerability-management data sources.
- Replace heuristics with calibrated benchmarks using representative handshakes, certificate chains, MTU/path captures, and storage re-encryption measurements.
- Add RBAC, SSO, tenant isolation, secrets management, rate limiting, and secure deployment profiles.
- Add policy-as-code gates for approved algorithms, minimum security levels, crypto-agility requirements, and CNSA/NIST migration evidence.
- Add human-approved execution adapters for proxy deployment, provider upgrades, certificate rotation, and key lifecycle operations.

## Team Members and Module Contributions

The repository does not include personal contributor names, so contributions are identified by the implementation module and delivery role. This keeps attribution accurate and avoids inventing team identities.

| Contributor role | Primary contribution | Implementation surface |
| --- | --- | --- |
| Graph and CBOM engineering | CycloneDX ingestion, graph topology, adjacency, dependency traversal, GitHub manifest scan | `server/engine.ts`, `src/types/cryptoGraph.ts` |
| Risk and PQC architecture | HNDL/Mosca scoring, payload overhead model, algorithm mappings, security levels | `server/riskModel.ts`, `server/pqcMappingManager.ts` |
| Migration planning | Three-phase roadmap, prerequisite handling, blocker remediation, audit events | `server/migrationPlanner.ts` |
| Frontend and visualization | React Flow canvas, Dagre layout, filters, inspector, status transitions | `src/App.tsx`, `src/components/`, `src/utils/graphLayout.ts` |
| API and integration | Express routes, Vite middleware, Gemini advisory integration, runtime configuration | `server.ts`, `server/geminiAdvisor.ts` |
| Reporting and compliance UX | Executive Markdown, CycloneDX 1.6 JSON, raw graph, printable attestation | `src/components/ExportReportModal.tsx` |

## AI Assistance Disclosure

CAMP-Graph includes an **optional product feature** that sends selected graph context to the Gemini 2.5 API to generate a node-specific cryptographic remediation advisory. The feature is invoked through `/api/ai/advisor`, requires `GEMINI_API_KEY`, and is not required for CBOM import, risk scoring, migration simulation, payload analysis, or export.

Development assistance for this hackathon deliverable included AI-supported drafting, code navigation, implementation review, and technical documentation refinement. Human contributors remain responsible for architecture decisions, source-code integration, validation, security review, standards interpretation, and all claims in this README. AI-generated recommendations must not be treated as authoritative compliance advice or as a substitute for formal cryptographic engineering review.

## License and Security Contact

No license or security contact policy is declared in the repository at this time. Before public production distribution, add an explicit license, supported-version policy, vulnerability reporting channel, dependency update process, and threat model.
