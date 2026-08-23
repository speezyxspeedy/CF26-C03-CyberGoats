import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  HelpCircle, 
  Info, 
  AlertTriangle,
  ArrowRight,
  Maximize2,
  ChevronRight,
  CheckCircle2,
  Zap,
  Skull,
  Wrench,
  DollarSign
} from 'lucide-react';

import { CryptoNodeData, CryptoEdgeData, RiskSummary, MigrationPlan, AuditLogEntry, PQCAlgorithmMapping, PQCAlgorithmProfile, BlastRadiusResult, PayloadOverheadReport, GithubScanResult } from './types/cryptoGraph.js';
import { CustomCryptoNode } from './components/CustomCryptoNode.js';
import { CustomCryptoEdge } from './components/CustomCryptoEdge.js';
import { HeaderBar } from './components/HeaderBar.js';
import { ExecutiveMetrics } from './components/ExecutiveMetrics.js';
import { InspectorDrawer } from './components/InspectorDrawer.js';
import { CBOMImportModal } from './components/CBOMImportModal.js';
import { ExportReportModal } from './components/ExportReportModal.js';
import { UnblockModal } from './components/UnblockModal.js';
import { PQCMappingsModal } from './components/PQCMappingsModal.js';
import { getLayoutedElements } from './utils/graphLayout.js';

const nodeTypes = {
  cryptoNode: CustomCryptoNode,
};

const edgeTypes = {
  cryptoEdge: CustomCryptoEdge,
};

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CryptoNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CryptoEdgeData>>([]);
  const reactFlowInstance = useReactFlow();

  const [presets, setPresets] = useState<{ id: string; name: string; industry: string }[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('fintech-payment-core');
  const [riskSummary, setRiskSummary] = useState<RiskSummary>({
    overall_risk_score: 85,
    vulnerable_nodes_count: 8,
    hybrid_nodes_count: 0,
    safe_nodes_count: 0,
    blockers_count: 2,
    total_assets: 10,
    hndl_critical_count: 5,
    nist_compliance_percent: 0,
    max_retention_years: 30,
    mosca_timeline_status: 'CRITICAL_RISK',
  });
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  
  // PQC Algorithm Mappings state
  const [mappings, setMappings] = useState<PQCAlgorithmMapping[]>([]);
  const [profiles, setProfiles] = useState<PQCAlgorithmProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('nist-fips-primary');
  const [isMappingsOpen, setIsMappingsOpen] = useState<boolean>(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoPiloting, setIsAutoPiloting] = useState<boolean>(false);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importInitialTab, setImportInitialTab] = useState<'PASTE' | 'GITHUB'>('PASTE');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [unblockTargetNode, setUnblockTargetNode] = useState<CryptoNodeData | null>(null);

  // AI Advisory state
  const [aiAdvisoryData, setAiAdvisoryData] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Q-Day Compromise & Blast Radius Simulation state
  const [isQDaySimulating, setIsQDaySimulating] = useState<boolean>(false);
  const [blastRadiusResult, setBlastRadiusResult] = useState<BlastRadiusResult | null>(null);
  const [isBlastRadiusLoading, setIsBlastRadiusLoading] = useState<boolean>(false);

  // Helper to map backend graph data to React Flow nodes and edges with Dagre layout
  const applyGraphToFlow = useCallback((
    rawNodes: CryptoNodeData[],
    rawEdges: CryptoEdgeData[],
    direction: 'TB' | 'LR' = layoutDirection
  ) => {
    const flowNodes: Node<CryptoNodeData>[] = rawNodes.map((n) => ({
      id: n.id,
      type: 'cryptoNode',
      data: n,
      position: { x: 0, y: 0 },
    }));

    const flowEdges: Edge<CryptoEdgeData>[] = rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'cryptoEdge',
      data: e,
      animated: e.is_blocked || e.relationship === 'COMMUNICATES_WITH',
    }));

    const layouted = getLayoutedElements(flowNodes, flowEdges, direction);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);

    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [layoutDirection, reactFlowInstance, setNodes, setEdges]);

  // Initial Load: Fetch presets, mappings, and scan default graph
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const [presetsRes, mappingsRes, scanRes] = await Promise.all([
          fetch('/api/presets'),
          fetch('/api/pqc-mappings'),
          fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presetId: 'fintech-payment-core' }),
          }),
        ]);

        const presetsData = await presetsRes.json();
        if (presetsData.presets) {
          setPresets(presetsData.presets);
        }

        const mappingsData = await mappingsRes.json();
        if (mappingsData.mappings) {
          setMappings(mappingsData.mappings);
          setProfiles(mappingsData.profiles || []);
          setActiveProfileId(mappingsData.activeProfileId || 'nist-fips-primary');
        }

        const scanData = await scanRes.json();
        if (scanData.graph) {
          applyGraphToFlow(scanData.graph.nodes, scanData.graph.edges);
          setRiskSummary(scanData.riskSummary);
          setMigrationPlan(scanData.plan);
          setAuditLogs(scanData.auditLogs || []);
          if (scanData.graph.nodes.length > 0) {
            setSelectedNodeId(scanData.graph.nodes[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize CAMP-Graph:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [applyGraphToFlow]);

  // PQC Algorithm Mapping Handlers
  const handleApplyPQCProfile = async (profileId: string) => {
    const res = await fetch('/api/pqc-mappings/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId }),
    });
    const data = await res.json();
    if (data.mappings) {
      setMappings(data.mappings);
      setProfiles(data.profiles);
      setActiveProfileId(data.activeProfileId);
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    }
  };

  const handleUpdatePQCMapping = async (id: string, updates: Partial<PQCAlgorithmMapping>) => {
    const res = await fetch(`/api/pqc-mappings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.mappings) {
      setMappings(data.mappings);
      setProfiles(data.profiles);
      setActiveProfileId(data.activeProfileId);
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    }
  };

  const handleAddPQCMapping = async (mapping: Omit<PQCAlgorithmMapping, 'id'>) => {
    const res = await fetch('/api/pqc-mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapping }),
    });
    const data = await res.json();
    if (data.mappings) {
      setMappings(data.mappings);
      setProfiles(data.profiles);
      setActiveProfileId(data.activeProfileId);
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    }
  };

  const handleDeletePQCMapping = async (id: string) => {
    const res = await fetch(`/api/pqc-mappings/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.mappings) {
      setMappings(data.mappings);
      setProfiles(data.profiles);
      setActiveProfileId(data.activeProfileId);
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    }
  };

  const handleResetPQCDefaults = async () => {
    const res = await fetch('/api/pqc-mappings/reset', {
      method: 'POST',
    });
    const data = await res.json();
    if (data.mappings) {
      setMappings(data.mappings);
      setProfiles(data.profiles);
      setActiveProfileId(data.activeProfileId);
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    }
  };

  const handleBulkUpdatePQCMappings = async (newMappings: PQCAlgorithmMapping[]) => {
    const res = await fetch('/api/pqc-mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mappings: newMappings }),
    });
    const data = await res.json();
    if (data.mappings) {
      setMappings(data.mappings);
      setProfiles(data.profiles);
      setActiveProfileId(data.activeProfileId);
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = async (presetId: string) => {
    setIsLoading(true);
    setIsAutoPiloting(false);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      if (data.graph) {
        setActivePresetId(presetId);
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
        setSelectedNodeId(data.graph.nodes[0]?.id || null);
        setAiAdvisoryData(null);
      }
    } catch (err) {
      console.error('Failed to load preset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run CBOM Scan
  const handleRunScan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: activePresetId }),
      });
      const data = await res.json();
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to run scan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute a single step by ID
  const handleExecuteStep = async (stepId: number) => {
    try {
      const res = await fetch('/api/simulate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      });
      const data = await res.json();
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);

        if (data.riskSummary.overall_risk_score <= 15 && data.riskSummary.vulnerable_nodes_count === 0) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error('Failed to execute step:', err);
    }
  };

  // Auto-advance next step
  const handleSimulateNext = async () => {
    try {
      const res = await fetch('/api/simulate-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);

        if (data.riskSummary.overall_risk_score <= 15 && data.riskSummary.vulnerable_nodes_count === 0) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
        return data;
      }
    } catch (err) {
      console.error('Failed to simulate next step:', err);
    }
  };

  // Auto-pilot Loop
  useEffect(() => {
    let interval: any = null;
    if (isAutoPiloting) {
      interval = setInterval(async () => {
        // If there's an active blocker, resolve it first
        const blockerNode = nodes.find((n) => n.data.is_blocker);
        if (blockerNode) {
          await handleUnblockNode(blockerNode.id, 'Auto-Deployed PQC Decoupling Proxy');
          return;
        }

        const data = await handleSimulateNext();
        if (!data || data.riskSummary?.vulnerable_nodes_count === 0 || !data.success) {
          setIsAutoPiloting(false);
        }
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPiloting, nodes]);

  // Reset Graph to baseline
  const handleReset = async () => {
    setIsAutoPiloting(false);
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to reset graph:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Unblock a blocker node
  const handleUnblockNode = async (nodeId: string, strategy?: string) => {
    try {
      const res = await fetch('/api/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, strategy: strategy || 'PQC Decoupling Proxy' }),
      });
      const data = await res.json();
      if (data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to unblock node:', err);
    }
  };

  // Import Custom CBOM
  const handleImportCBOM = async (jsonString: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCBOM: jsonString }),
      });
      const data = await res.json();
      if (data.graph) {
        setActivePresetId('custom-cbom');
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setMigrationPlan(data.plan);
        setAuditLogs(data.auditLogs || []);
        setSelectedNodeId(data.graph.nodes[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to import CBOM:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run AI Advisor
  const handleRunAIAdvisory = async (nodeId: string) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId }),
      });
      const data = await res.json();
      if (data.advisory) {
        setAiAdvisoryData(data);
      }
    } catch (err) {
      console.error('Failed to run AI advisory:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle Layout Direction (TB / LR)
  const handleToggleDirection = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(nextDir);
    const rawNodes = nodes.map((n) => n.data);
    const rawEdges = edges.map((e) => e.data as CryptoEdgeData);
    applyGraphToFlow(rawNodes, rawEdges, nextDir);
  };

  // ============ Q-Day Compromise & Blast Radius Simulation ============
  // Picks the most attractive compromise origin: a vulnerable Root Key or Key
  // Exchange asset (Key-type node, or one whose id/label suggests a root/HSM/KMS/
  // ingress key-exchange role), preferring the highest risk score.
  const pickQDayOriginNode = useCallback((): CryptoNodeData | null => {
    const candidates = nodes
      .map((n) => n.data)
      .filter((n) => n.quantum_status === 'VULNERABLE')
      .filter((n) => {
        const idLabel = `${n.id} ${n.label}`.toLowerCase();
        return (
          n.type === 'Key' ||
          idLabel.includes('root') ||
          idLabel.includes('hsm') ||
          idLabel.includes('kms') ||
          idLabel.includes('ecdhe') ||
          idLabel.includes('ingress') ||
          idLabel.includes('gateway')
        );
      });
    const pool = candidates.length > 0 ? candidates : nodes.map((n) => n.data).filter((n) => n.quantum_status === 'VULNERABLE');
    if (pool.length === 0) return null;
    return pool.sort((a, b) => b.risk_score - a.risk_score)[0];
  }, [nodes]);

  const handleToggleQDaySimulation = async () => {
    if (isQDaySimulating) {
      // Deactivate: clear compromise overlay
      setIsQDaySimulating(false);
      setBlastRadiusResult(null);
      return;
    }

    const origin = pickQDayOriginNode();
    if (!origin) {
      console.warn('No vulnerable Root Key or Key Exchange node available to simulate a Q-Day compromise.');
      return;
    }

    setIsBlastRadiusLoading(true);
    try {
      const res = await fetch('/api/blast-radius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: origin.id }),
      });
      const data = await res.json();
      if (data.blastRadius) {
        setBlastRadiusResult(data.blastRadius);
        setIsQDaySimulating(true);
        setSelectedNodeId(origin.id);
        setIsInspectorOpen(true);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to compute Q-Day blast radius:', err);
    } finally {
      setIsBlastRadiusLoading(false);
    }
  };

  const handleMitigateBlastRadius = async () => {
    if (!blastRadiusResult) return;
    try {
      const res = await fetch('/api/blast-radius/mitigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: blastRadiusResult.origin_node_id }),
      });
      const data = await res.json();
      if (data.success && data.graph) {
        applyGraphToFlow(data.graph.nodes, data.graph.edges);
        setRiskSummary(data.riskSummary);
        setAuditLogs(data.auditLogs || []);
      }
      // Cascade contained: end the simulation overlay
      setIsQDaySimulating(false);
      setBlastRadiusResult(null);
    } catch (err) {
      console.error('Failed to mitigate blast radius:', err);
    }
  };

  // ============ Network Payload & Packet Overhead Benchmarking ============
  const handleFetchPayloadOverhead = async (nodeId: string) => {
    try {
      const res = await fetch(`/api/payload-overhead/${encodeURIComponent(nodeId)}`);
      const data = await res.json();
      if (data.report) {
        return data.report;
      }
    } catch (err) {
      console.error('Failed to fetch payload overhead report:', err);
    }
  };

  // ============ Live GitHub Repository Auto-Scanner ============
  const handleScanGithub = async (repoUrl: string) => {
    const res = await fetch('/api/scan/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to scan GitHub repository.');
    }
    if (data.graph) {
      setActivePresetId('custom-cbom');
      applyGraphToFlow(data.graph.nodes, data.graph.edges);
      setRiskSummary(data.riskSummary);
      setMigrationPlan(data.plan);
      setAuditLogs(data.auditLogs || []);
      setSelectedNodeId(data.graph.nodes[0]?.id || null);
      setIsQDaySimulating(false);
      setBlastRadiusResult(null);
    }
    return data.scan as GithubScanResult;
  };

  // Blast radius lookup maps (hop distance per compromised node) for the active Q-Day simulation
  const compromiseHopMap = useMemo(() => {
    const map = new Map<string, number>();
    if (isQDaySimulating && blastRadiusResult) {
      blastRadiusResult.impacted_nodes.forEach((n) => map.set(n.node_id, n.hop_distance));
    }
    return map;
  }, [isQDaySimulating, blastRadiusResult]);

  // Filtered nodes based on status or search, with Q-Day compromise flags overlaid
  const visibleNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchesSearch = searchQuery === '' || 
        node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.crypto_primitive.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.id.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (filterStatus === 'VULNERABLE') matchesFilter = node.data.quantum_status === 'VULNERABLE';
      if (filterStatus === 'HYBRID') matchesFilter = node.data.quantum_status === 'HYBRID';
      if (filterStatus === 'SAFE') matchesFilter = node.data.quantum_status === 'SAFE';
      if (filterStatus === 'BLOCKER') matchesFilter = Boolean(node.data.is_blocker);

      const isDimmed = !matchesSearch || !matchesFilter;
      const isCompromised = compromiseHopMap.has(node.id);

      return {
        ...node,
        data: isCompromised
          ? { ...node.data, is_compromised: true, compromise_hop_distance: compromiseHopMap.get(node.id) }
          : (node.data.is_compromised ? { ...node.data, is_compromised: false, compromise_hop_distance: undefined } : node.data),
        style: {
          ...node.style,
          opacity: isDimmed ? 0.2 : 1,
          filter: isDimmed ? 'grayscale(80%)' : 'none',
        },
      };
    });
  }, [nodes, searchQuery, filterStatus, compromiseHopMap]);

  // Selected Node Data
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const found = nodes.find((n) => n.id === selectedNodeId);
    return found ? found.data : null;
  }, [selectedNodeId, nodes]);

  const migrationComplete = riskSummary.vulnerable_nodes_count === 0 && riskSummary.overall_risk_score <= 15;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-[#f0f6fc] overflow-hidden font-sans select-none">
      
      {/* Top Header Bar */}
      <HeaderBar
        presets={presets}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onRunScan={handleRunScan}
        onSimulateStep={handleSimulateNext}
        onAutoPilot={() => setIsAutoPiloting(!isAutoPiloting)}
        onReset={handleReset}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenMappings={() => setIsMappingsOpen(true)}
        activeProfileName={profiles.find((p) => p.id === activeProfileId)?.badge || profiles.find((p) => p.id === activeProfileId)?.name}
        isLoading={isLoading}
        isAutoPiloting={isAutoPiloting}
        migrationComplete={migrationComplete}
        direction={layoutDirection}
        onToggleDirection={handleToggleDirection}
        isQDaySimulating={isQDaySimulating}
        onToggleQDaySimulation={handleToggleQDaySimulation}
        onOpenGithubScan={() => {
          setImportInitialTab('GITHUB');
          setIsImportOpen(true);
        }}
      />

      {/* Executive Risk Metrics Ribbon */}
      <ExecutiveMetrics
        summary={riskSummary}
        filterStatus={filterStatus}
        onFilterChange={(st) => setFilterStatus(st)}
      />

      {/* Main Graph Canvas & Inspector Area */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* React Flow Graph Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={visibleNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setIsInspectorOpen(true);
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            minZoom={0.2}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          >
            <Background color="#21262d" gap={18} size={1} />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap
              position="bottom-left"
              style={{ bottom: 45, left: 10 }}
              nodeStrokeColor={(n: any) => {
                if (n.data?.quantum_status === 'SAFE') return '#3fb950';
                if (n.data?.quantum_status === 'HYBRID') return '#d29922';
                return '#f85149';
              }}
              nodeColor={(n: any) => {
                if (n.data?.quantum_status === 'SAFE') return '#0d2d1a';
                if (n.data?.quantum_status === 'HYBRID') return '#382306';
                return '#381014';
              }}
            />

            {/* Canvas Floating Top Search & Legend Overlay */}
            <Panel position="top-left" className="m-2.5 flex items-center gap-2">
              <div className="bg-[#161b22]/95 border border-[#30363d] rounded-md px-2 py-1 flex items-center gap-1.5 shadow-md backdrop-blur-md">
                <Search className="w-3.5 h-3.5 text-[#8b949e] ml-0.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter asset name, RSA, ECDSA, AES..."
                  className="bg-transparent text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none w-56 font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#8b949e] hover:text-[#f0f6fc] text-xs px-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status Legend Pills */}
              <div className="bg-[#161b22]/95 border border-[#30363d] rounded-md px-2.5 py-1.5 flex items-center gap-2.5 shadow-md backdrop-blur-md text-[10.5px] font-bold text-[#8b949e] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#f85149] shadow-sm" />
                  <span className="text-[#ff7b72]">Vulnerable</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#d29922] shadow-sm" />
                  <span className="text-[#e3b341]">Hybrid</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#3fb950] shadow-sm" />
                  <span className="text-[#7ee787]">Quantum Safe</span>
                </span>
              </div>
            </Panel>

            {/* Q-Day Compromise & Blast Radius Banner */}
            {isQDaySimulating && blastRadiusResult && (
              <Panel position="top-center" className="m-2.5">
                <div className="bg-[#1a0507]/97 border border-[#ff2d2d] rounded-md px-3.5 py-2 flex items-center gap-4 shadow-lg shadow-red-950/60 backdrop-blur-md font-mono animate-pulse">
                  <div className="flex items-center gap-1.5 text-[#ff2d2d]">
                    <Skull className="w-4 h-4" />
                    <span className="text-xs font-black tracking-wide">Q-DAY COMPROMISE ACTIVE</span>
                  </div>
                  <div className="h-4 w-px bg-[#5c1414]" />
                  <div className="text-[10.5px] text-[#ffb3b3]">
                    <span className="text-[#8b949e] uppercase text-[9px] block leading-none mb-0.5">Compromised Assets</span>
                    <span className="font-bold text-[#ff7b72]">{blastRadiusResult.compromised_count} / {blastRadiusResult.total_assets}</span>
                  </div>
                  <div className="text-[10.5px] text-[#ffb3b3]">
                    <span className="text-[#8b949e] uppercase text-[9px] block leading-none mb-0.5">Exposed Data Lifetime</span>
                    <span className="font-bold text-[#ff7b72]">{blastRadiusResult.max_exposed_data_lifetime_years} yrs</span>
                  </div>
                  <div className="text-[10.5px] text-[#ffb3b3]">
                    <span className="text-[#8b949e] uppercase text-[9px] block leading-none mb-0.5">Est. Financial/Regulatory Exposure</span>
                    <span className="font-bold text-[#ff7b72]">${blastRadiusResult.estimated_financial_exposure_usd.toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-px bg-[#5c1414]" />
                  <button
                    onClick={handleMitigateBlastRadius}
                    className="px-2.5 py-1 bg-[#ff2d2d] hover:bg-[#ff4d4d] text-white rounded text-[11px] font-bold flex items-center gap-1.5 shadow transition-all active:scale-95 border border-[#ffb3b3]"
                    title="Deploy PQC hybrid isolation boundary to stop the cascade"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Mitigate with PQC Isolation</span>
                  </button>
                </div>
              </Panel>
            )}

            {/* Toggle Drawer Button if closed */}
            {!isInspectorOpen && (
              <Panel position="top-right" className="m-2.5">
                <button
                  onClick={() => setIsInspectorOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-md transition-all border border-indigo-400"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>PQC Inspector</span>
                </button>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right-side Inspector & AI Advisory Drawer */}
        <InspectorDrawer
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          selectedNode={selectedNode}
          migrationPlan={migrationPlan}
          auditLogs={auditLogs}
          riskSummary={riskSummary}
          onExecuteStep={handleExecuteStep}
          onUnblockNode={(nodeId) => {
            const n = nodes.find((node) => node.id === nodeId);
            if (n) setUnblockTargetNode(n.data);
          }}
          onRunAIAdvisory={handleRunAIAdvisory}
          aiAdvisoryData={aiAdvisoryData}
          isAiLoading={isAiLoading}
          isQDaySimulating={isQDaySimulating}
          blastRadiusResult={blastRadiusResult}
          onFetchPayloadOverhead={handleFetchPayloadOverhead}
        />
      </div>

      {/* Modals */}
      <PQCMappingsModal
        isOpen={isMappingsOpen}
        onClose={() => setIsMappingsOpen(false)}
        mappings={mappings}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onApplyProfile={handleApplyPQCProfile}
        onUpdateMapping={handleUpdatePQCMapping}
        onAddMapping={handleAddPQCMapping}
        onDeleteMapping={handleDeletePQCMapping}
        onResetDefaults={handleResetPQCDefaults}
        onBulkUpdateMappings={handleBulkUpdatePQCMappings}
        nodes={nodes.map((n) => n.data)}
      />

      <CBOMImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportCBOM}
        onScanGithub={handleScanGithub}
        initialTab={importInitialTab}
      />

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        graph={{
          nodes: nodes.map((n) => n.data),
          edges: edges.map((e) => e.data as CryptoEdgeData),
        }}
        riskSummary={riskSummary}
        migrationPlan={migrationPlan}
      />

      <UnblockModal
        isOpen={Boolean(unblockTargetNode)}
        onClose={() => setUnblockTargetNode(null)}
        node={unblockTargetNode}
        onConfirmUnblock={handleUnblockNode}
      />

    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}
