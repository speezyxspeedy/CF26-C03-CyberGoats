import { CryptoNodeData, MigrationPlan, MigrationStep, AuditLogEntry, GraphData } from '../src/types/cryptoGraph.js';
import { CBOMGraphEngine } from './engine.js';
import { PQCMappingManager, globalPQCMappingManager } from './pqcMappingManager.js';

export class MigrationPlanner {
  private engine: CBOMGraphEngine;
  private mappingManager: PQCMappingManager;
  private plan: MigrationPlan | null = null;
  private auditLogs: AuditLogEntry[] = [];

  constructor(engine: CBOMGraphEngine, mappingManager: PQCMappingManager = globalPQCMappingManager) {
    this.engine = engine;
    this.mappingManager = mappingManager;
    this.initAuditLog();
  }

  private initAuditLog(): void {
    this.auditLogs = [
      {
        id: 'log-0',
        timestamp: new Date().toISOString(),
        level: 'INFO',
        category: 'SYSTEM',
        message: 'CAMP-Graph Post-Quantum Migration Planner engine initialized with active PQC algorithm policy mappings.',
      },
    ];
  }

  public setMappingManager(mappingManager: PQCMappingManager): void {
    this.mappingManager = mappingManager;
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const newLog: AuditLogEntry = {
      id: `log-${this.auditLogs.length + 1}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(newLog);
    // Keep max 100 logs
    if (this.auditLogs.length > 100) {
      this.auditLogs.pop();
    }
    return newLog;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  public generatePlan(): MigrationPlan {
    const graph = this.engine.getGraphData();
    const nodes = graph.nodes;
    const steps: MigrationStep[] = [];
    let stepCounter = 1;

    // Detect active blockers
    const activeBlockers: MigrationPlan['active_blockers'] = [];
    nodes.filter((n) => n.is_blocker).forEach((blocker) => {
      // Find what it blocks
      const blockedNodes = graph.edges
        .filter((e) => e.target === blocker.id && e.relationship === 'BLOCKED_BY')
        .map((e) => e.source);

      activeBlockers.push({
        node_id: blocker.id,
        reason: blocker.blocker_reason || 'Cryptographic rigidity or legacy protocol constraint',
        blocked_by: blocker.label,
        suggested_action: blocker.resolution_strategy || 'Deploy PQC Decoupling Proxy / Upgrade base library',
      });
    });

    // Phase 1: Ingress, Gateways, Base Libraries (Hybrid Deployment)
    const phase1Nodes = nodes.filter((n) => n.migration_phase === 1 || n.type === 'Library' || n.id.includes('ingress') || n.id.includes('edge'));
    phase1Nodes.forEach((node) => {
      const isLibrary = node.type === 'Library';
      const resolved = this.mappingManager.resolveTargetPQC(node.crypto_primitive, {
        nodeType: node.type,
        label: node.label,
      });

      const toAlgo = isLibrary 
        ? 'OpenSSL 3.4+ with liboqs-provider (FIPS 203/204)' 
        : (resolved.is_hybrid ? resolved.target_pqc_algorithm : `Hybrid (${resolved.target_pqc_algorithm})`);
      const isAlreadySafe = node.quantum_status === 'SAFE';
      
      steps.push({
        step_id: stepCounter++,
        phase: 1,
        phase_name: 'Phase 1: Ingress Hybridization & Crypto Agility Foundations',
        target_node_id: node.id,
        node_label: node.label,
        action_type: isLibrary ? 'UNBLOCK_REMEDIATION' : 'HYBRID_DEPLOY',
        from_primitive: node.crypto_primitive,
        to_primitive: toAlgo,
        nist_standard: resolved.nist_standard,
        description: isLibrary 
          ? `Upgrade foundational cryptographic provider to support configured PQC suites.`
          : `Deploy hybrid quantum-classical key exchange (${toAlgo}) at public entry points to eliminate HNDL threats.`,
        prerequisites: [],
        status: isAlreadySafe ? 'COMPLETED' : 'READY',
        risk_reduction_points: 25,
      });
    });

    // Phase 2: Core Microservices, Storage, Databases, Token Vaults
    const phase2Nodes = nodes.filter((n) => (n.migration_phase === 2 || !n.migration_phase) && !phase1Nodes.some(p => p.id === n.id) && n.type !== 'Key');
    phase2Nodes.forEach((node) => {
      // Check if blocked by any un-remediated blocker
      const blockerEdge = graph.edges.find((e) => e.source === node.id && e.relationship === 'BLOCKED_BY' && e.is_blocked);
      const isBlocked = Boolean(blockerEdge);
      const isAlreadySafe = node.quantum_status === 'SAFE';

      const resolved = this.mappingManager.resolveTargetPQC(node.crypto_primitive, {
        nodeType: node.type,
        label: node.label,
      });

      steps.push({
        step_id: stepCounter++,
        phase: 2,
        phase_name: 'Phase 2: Internal Microservices & Storage Trans-encryption',
        target_node_id: node.id,
        node_label: node.label,
        action_type: 'PQC_UPGRADE',
        from_primitive: node.crypto_primitive,
        to_primitive: resolved.target_pqc_algorithm,
        nist_standard: resolved.nist_standard,
        description: `Upgrade internal service mTLS and storage envelope keys to configured ${resolved.target_pqc_algorithm} (${resolved.nist_standard} ${resolved.nist_security_level}).`,
        prerequisites: phase1Nodes.map(p => p.id),
        blocker_id: blockerEdge?.target,
        status: isAlreadySafe ? 'COMPLETED' : (isBlocked ? 'BLOCKED' : 'PENDING'),
        risk_reduction_points: 35,
      });
    });

    // Phase 3: Hardware Security Modules, Root of Trust & Archival Vaults
    const phase3Nodes = nodes.filter((n) => n.migration_phase === 3 || n.type === 'Key' || n.id.includes('kms') || n.id.includes('hsm') || n.id.includes('s3') || n.id.includes('vault'));
    phase3Nodes.forEach((node) => {
      const isAlreadySafe = node.quantum_status === 'SAFE';
      const resolved = this.mappingManager.resolveTargetPQC(node.crypto_primitive, {
        nodeType: node.type,
        label: node.label,
        isRoot: true,
      });

      steps.push({
        step_id: stepCounter++,
        phase: 3,
        phase_name: 'Phase 3: Root of Trust & Pure Post-Quantum Hardening',
        target_node_id: node.id,
        node_label: node.label,
        action_type: 'DEPRECATE_CLASSICAL',
        from_primitive: node.crypto_primitive,
        to_primitive: resolved.target_pqc_algorithm,
        nist_standard: resolved.nist_standard,
        description: `Rotate master Root CAs and archival long-retention storage to ${resolved.target_pqc_algorithm} [${resolved.nist_security_level}]; deprecate classical fallbacks.`,
        prerequisites: phase2Nodes.map(p => p.id),
        status: isAlreadySafe ? 'COMPLETED' : 'PENDING',
        risk_reduction_points: 40,
      });
    });

    const phases = [
      {
        phase_number: 1 as const,
        title: 'Phase 1: Ingress Hybridization & Crypto Agility Foundations',
        description: 'Deploy hybrid key exchange at public edge gateways to eliminate ongoing Harvest-Now-Decrypt-Later (HNDL) data harvesting.',
        status: 'IN_PROGRESS' as const,
        steps: steps.filter((s) => s.phase === 1),
      },
      {
        phase_number: 2 as const,
        title: 'Phase 2: Internal Microservices & Storage Trans-encryption',
        description: 'Upgrade internal service-to-service communication, trans-encrypt databases to PQC envelopes, and remediate legacy blockers.',
        status: 'NOT_STARTED' as const,
        steps: steps.filter((s) => s.phase === 2),
      },
      {
        phase_number: 3 as const,
        title: 'Phase 3: Root of Trust & Pure Post-Quantum Hardening',
        description: 'Re-key Root CAs and HSM master envelopes with high-assurance PQC signature and KEM suites, sunsetting classical primitives.',
        status: 'NOT_STARTED' as const,
        steps: steps.filter((s) => s.phase === 3),
      },
    ];

    const completedSteps = steps.filter((s) => s.status === 'COMPLETED').length;

    this.plan = {
      plan_id: `plan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      total_steps: steps.length,
      completed_steps: completedSteps,
      current_phase: completedSteps >= phase1Nodes.length ? (completedSteps >= phase1Nodes.length + phase2Nodes.length ? 3 : 2) : 1,
      phases,
      active_blockers: activeBlockers,
    };

    this.addAuditLog({
      level: 'INFO',
      category: 'MIGRATION',
      message: `Generated 3-Phase NIST PQC Roadmap (${steps.length} steps, ${activeBlockers.length} blockers) aligned with active algorithm mappings.`,
      details: { total_steps: steps.length, blockers: activeBlockers.length },
    });

    return this.plan;
  }

  public simulateStep(stepId: number): { success: boolean; updatedNode?: CryptoNodeData; plan: MigrationPlan; log: AuditLogEntry } {
    if (!this.plan) {
      this.generatePlan();
    }

    const allSteps = this.plan!.phases.flatMap((p) => p.steps);
    const targetStep = allSteps.find((s) => s.step_id === stepId);

    if (!targetStep) {
      throw new Error(`Step ${stepId} not found in current migration plan.`);
    }

    if (targetStep.status === 'BLOCKED') {
      const log = this.addAuditLog({
        level: 'CRITICAL',
        category: 'MIGRATION',
        message: `Execution blocked for "${targetStep.node_label}". Must resolve prerequisite blocker (Node ID: ${targetStep.blocker_id}) before applying ${targetStep.to_primitive}.`,
        node_id: targetStep.target_node_id,
      });
      return { success: false, plan: this.plan!, log };
    }

    if (targetStep.status === 'COMPLETED') {
      const log = this.addAuditLog({
        level: 'INFO',
        category: 'MIGRATION',
        message: `Step ${stepId} for "${targetStep.node_label}" is already completed.`,
        node_id: targetStep.target_node_id,
      });
      return { success: true, plan: this.plan!, log };
    }

    // Determine target quantum status based on phase / action
    const newStatus = targetStep.phase === 1 ? 'HYBRID' : 'SAFE';
    
    // Update node in the engine
    const updated = this.engine.updateNode(targetStep.target_node_id, {
      quantum_status: newStatus,
      crypto_primitive: targetStep.to_primitive,
      migrated_algorithm: targetStep.to_primitive,
      is_migrated: true,
      notes: `Migrated during ${targetStep.phase_name}. Aligned with ${targetStep.nist_standard}.`,
    });

    // Mark step completed
    targetStep.status = 'COMPLETED';

    // If this node was a blocker or library, resolve blockers
    if (targetStep.action_type === 'UNBLOCK_REMEDIATION' || targetStep.target_node_id.includes('lib')) {
      this.engine.unblockNode(targetStep.target_node_id, 'OpenSSL 3.4 OQS Upgrade');
      // Update any steps that were blocked by this node to READY
      allSteps.forEach((s) => {
        if (s.blocker_id === targetStep.target_node_id && s.status === 'BLOCKED') {
          s.status = 'READY';
          this.addAuditLog({
            level: 'SUCCESS',
            category: 'UNBLOCK',
            message: `Dependency unlocked! Step ${s.step_id} ("${s.node_label}") is now READY for PQC migration.`,
            node_id: s.target_node_id,
          });
        }
      });
    }

    // Check if subsequent phase steps can become READY
    this.refreshStepReadiness();

    const log = this.addAuditLog({
      level: 'SUCCESS',
      category: 'MIGRATION',
      message: `[MIGRATION SUCCESS] ${targetStep.node_label} upgraded from ${targetStep.from_primitive} to ${targetStep.to_primitive} (${newStatus} state, ${targetStep.nist_standard}).`,
      node_id: targetStep.target_node_id,
      details: {
        step_id: stepId,
        from: targetStep.from_primitive,
        to: targetStep.to_primitive,
        new_risk_score: updated?.risk_score,
      },
    });

    return { success: true, updatedNode: updated, plan: this.plan!, log };
  }

  public simulateNextReadyStep(): { success: boolean; stepCompleted?: MigrationStep; plan: MigrationPlan; log?: AuditLogEntry } {
    if (!this.plan) {
      this.generatePlan();
    }

    const allSteps = this.plan!.phases.flatMap((p) => p.steps);
    const readyStep = allSteps.find((s) => s.status === 'READY');

    if (!readyStep) {
      // Check if there are blocked steps or if all completed
      const pendingStep = allSteps.find((s) => s.status === 'PENDING');
      if (pendingStep) {
        pendingStep.status = 'READY';
        return this.simulateStep(pendingStep.step_id);
      }

      const blockedStep = allSteps.find((s) => s.status === 'BLOCKED');
      if (blockedStep) {
        const log = this.addAuditLog({
          level: 'WARN',
          category: 'MIGRATION',
          message: `Cannot auto-advance: Next step "${blockedStep.node_label}" is blocked by legacy constraint (${blockedStep.blocker_id}). Please trigger an Unblock Remediation action.`,
          node_id: blockedStep.target_node_id,
        });
        return { success: false, plan: this.plan!, log };
      }

      const log = this.addAuditLog({
        level: 'SUCCESS',
        category: 'MIGRATION',
        message: 'All migration phases have been successfully executed! Architecture is 100% NIST FIPS 203/204/205 Post-Quantum compliant.',
      });
      return { success: true, plan: this.plan!, log };
    }

    const result = this.simulateStep(readyStep.step_id);
    return {
      success: result.success,
      stepCompleted: readyStep,
      plan: result.plan,
      log: result.log,
    };
  }

  public unblockAndRemediate(blockerNodeId: string, customStrategy?: string): { success: boolean; unblockedNodes: string[]; log: AuditLogEntry } {
    const unblockResult = this.engine.unblockNode(blockerNodeId, customStrategy || 'PQC Decoupling Transcoding Proxy / Shim');
    
    if (this.plan) {
      // Remove from active blockers
      this.plan.active_blockers = this.plan.active_blockers.filter((b) => b.node_id !== blockerNodeId);

      // Unlock any steps
      const allSteps = this.plan.phases.flatMap((p) => p.steps);
      allSteps.forEach((s) => {
        if (s.blocker_id === blockerNodeId && s.status === 'BLOCKED') {
          s.status = 'READY';
        }
      });
      this.refreshStepReadiness();
    }

    const log = this.addAuditLog({
      level: 'SUCCESS',
      category: 'UNBLOCK',
      message: `[BLOCKER REMEDIATED] Successfully deployed PQC Shim for "${blockerNodeId}". Unblocked dependent systems: [${unblockResult.unblockedNodes.join(', ')}].`,
      node_id: blockerNodeId,
      details: { unblocked: unblockResult.unblockedNodes, strategy: customStrategy },
    });

    return {
      success: unblockResult.success,
      unblockedNodes: unblockResult.unblockedNodes,
      log,
    };
  }

  private refreshStepReadiness(): void {
    if (!this.plan) return;
    const allSteps = this.plan.phases.flatMap((p) => p.steps);
    const completedCount = allSteps.filter((s) => s.status === 'COMPLETED').length;
    this.plan.completed_steps = completedCount;

    // Check phase statuses
    this.plan.phases.forEach((phase) => {
      const phaseSteps = phase.steps;
      const allDone = phaseSteps.every((s) => s.status === 'COMPLETED');
      const someDone = phaseSteps.some((s) => s.status === 'COMPLETED' || s.status === 'IN_PROGRESS');

      if (allDone) {
        phase.status = 'COMPLETED';
      } else if (someDone) {
        phase.status = 'IN_PROGRESS';
      } else {
        phase.status = 'NOT_STARTED';
      }

      // If phase 1 is done, unlock phase 2 non-blocked steps
      if (phase.phase_number === 2 && this.plan?.phases[0].status === 'COMPLETED') {
        phaseSteps.forEach((s) => {
          if (s.status === 'PENDING') {
            s.status = 'READY';
          }
        });
      }

      // If phase 2 is done, unlock phase 3 steps
      if (phase.phase_number === 3 && this.plan?.phases[1].status === 'COMPLETED') {
        phaseSteps.forEach((s) => {
          if (s.status === 'PENDING') {
            s.status = 'READY';
          }
        });
      }
    });

    // Update current phase pointer
    if (this.plan.phases[0].status !== 'COMPLETED') {
      this.plan.current_phase = 1;
    } else if (this.plan.phases[1].status !== 'COMPLETED') {
      this.plan.current_phase = 2;
    } else {
      this.plan.current_phase = 3;
    }
  }
}
