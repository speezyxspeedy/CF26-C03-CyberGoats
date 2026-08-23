import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { CBOMGraphEngine } from './server/engine.js';
import { MigrationPlanner } from './server/migrationPlanner.js';
import { ALL_PRESETS, PRESET_FINTECH_PAYMENT } from './server/mockData.js';
import { generateNodeAdvisory } from './server/geminiAdvisor.js';
import { globalPQCMappingManager } from './server/pqcMappingManager.js';
import { computePayloadOverhead } from './server/riskModel.js';

// Load local secrets first, then fall back to a generic .env file.
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '10mb' }));

  // In-memory state for active session
  let activePresetId = PRESET_FINTECH_PAYMENT.id;
  let currentEngine = new CBOMGraphEngine(JSON.parse(JSON.stringify(PRESET_FINTECH_PAYMENT.graph)), globalPQCMappingManager);
  let currentPlanner = new MigrationPlanner(currentEngine, globalPQCMappingManager);
  currentPlanner.generatePlan();

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'CAMP-Graph PQC Migration Engine', timestamp: new Date().toISOString() });
  });

  // Get available enterprise preset architectures
  app.get('/api/presets', (req, res) => {
    res.json({
      presets: ALL_PRESETS.map((p) => ({
        id: p.id,
        name: p.name,
        industry: p.industry,
        description: p.description,
        nodeCount: p.graph.nodes.length,
        edgeCount: p.graph.edges.length,
      })),
      activePresetId,
    });
  });

  // ================= PQC ALGORITHM MAPPINGS API =================
  // GET /api/pqc-mappings - Retrieve active mappings, profiles, and active profile ID
  app.get('/api/pqc-mappings', (req, res) => {
    res.json({
      mappings: globalPQCMappingManager.getMappings(),
      profiles: globalPQCMappingManager.getProfiles(),
      activeProfileId: globalPQCMappingManager.getActiveProfileId(),
    });
  });

  // POST /api/pqc-mappings/profile - Apply a preset PQC profile
  app.post('/api/pqc-mappings/profile', (req, res) => {
    try {
      const { profileId } = req.body;
      if (!profileId) {
        return res.status(400).json({ error: 'profileId is required.' });
      }

      globalPQCMappingManager.applyProfile(profileId);
      currentEngine.recalculateAllRisks();
      const plan = currentPlanner.generatePlan();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      currentPlanner.addAuditLog({
        level: 'INFO',
        category: 'SYSTEM',
        message: `Applied PQC Algorithm Profile: "${profileId}". Recalculated quantum risk scores and updated migration roadmap targets.`,
      });

      res.json({
        mappings: globalPQCMappingManager.getMappings(),
        profiles: globalPQCMappingManager.getProfiles(),
        activeProfileId: globalPQCMappingManager.getActiveProfileId(),
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/pqc-mappings - Create custom mapping or bulk replace
  app.post('/api/pqc-mappings', (req, res) => {
    try {
      const { mapping, mappings } = req.body;

      if (mappings && Array.isArray(mappings)) {
        globalPQCMappingManager.setMappings(mappings);
      } else if (mapping) {
        globalPQCMappingManager.addMapping(mapping);
      } else {
        return res.status(400).json({ error: 'Either mapping object or mappings array must be provided.' });
      }

      currentEngine.recalculateAllRisks();
      const plan = currentPlanner.generatePlan();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      currentPlanner.addAuditLog({
        level: 'INFO',
        category: 'SYSTEM',
        message: 'Updated PQC algorithm mapping configurations and refreshed dependency graph risk models.',
      });

      res.json({
        mappings: globalPQCMappingManager.getMappings(),
        profiles: globalPQCMappingManager.getProfiles(),
        activeProfileId: globalPQCMappingManager.getActiveProfileId(),
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT /api/pqc-mappings/:id - Update specific algorithm mapping
  app.put('/api/pqc-mappings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = globalPQCMappingManager.updateMapping(id, updates);

      currentEngine.recalculateAllRisks();
      const plan = currentPlanner.generatePlan();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      currentPlanner.addAuditLog({
        level: 'INFO',
        category: 'SYSTEM',
        message: `Modified PQC mapping rule "${updated.name}" -> ${updated.target_pqc_algorithm} (${updated.target_nist_standard} ${updated.nist_security_level}).`,
      });

      res.json({
        updatedMapping: updated,
        mappings: globalPQCMappingManager.getMappings(),
        profiles: globalPQCMappingManager.getProfiles(),
        activeProfileId: globalPQCMappingManager.getActiveProfileId(),
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE /api/pqc-mappings/:id - Delete an algorithm mapping rule
  app.delete('/api/pqc-mappings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deleted = globalPQCMappingManager.deleteMapping(id);
      if (!deleted) {
        return res.status(404).json({ error: `Mapping "${id}" not found.` });
      }

      currentEngine.recalculateAllRisks();
      const plan = currentPlanner.generatePlan();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      currentPlanner.addAuditLog({
        level: 'WARN',
        category: 'SYSTEM',
        message: `Deleted PQC algorithm mapping rule "${id}".`,
      });

      res.json({
        mappings: globalPQCMappingManager.getMappings(),
        profiles: globalPQCMappingManager.getProfiles(),
        activeProfileId: globalPQCMappingManager.getActiveProfileId(),
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/pqc-mappings/reset - Reset to default NIST FIPS mappings
  app.post('/api/pqc-mappings/reset', (req, res) => {
    try {
      globalPQCMappingManager.resetToDefaults();
      currentEngine.recalculateAllRisks();
      const plan = currentPlanner.generatePlan();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      currentPlanner.addAuditLog({
        level: 'INFO',
        category: 'SYSTEM',
        message: 'Reset PQC Algorithm Mappings to NIST FIPS primary baseline.',
      });

      res.json({
        mappings: globalPQCMappingManager.getMappings(),
        profiles: globalPQCMappingManager.getProfiles(),
        activeProfileId: globalPQCMappingManager.getActiveProfileId(),
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/scan - Ingests preset or custom CBOM and returns full graph + risk evaluation
  app.post('/api/scan', (req, res) => {
    try {
      const { presetId, customCBOM } = req.body;

      if (presetId) {
        const found = ALL_PRESETS.find((p) => p.id === presetId);
        if (!found) {
          return res.status(404).json({ error: `Preset with id ${presetId} not found.` });
        }
        activePresetId = found.id;
        currentEngine = new CBOMGraphEngine(JSON.parse(JSON.stringify(found.graph)), globalPQCMappingManager);
        currentPlanner = new MigrationPlanner(currentEngine, globalPQCMappingManager);
        currentPlanner.generatePlan();
      } else if (customCBOM) {
        const parsedGraph = currentEngine.parseCustomCBOM(typeof customCBOM === 'string' ? customCBOM : JSON.stringify(customCBOM));
        currentEngine = new CBOMGraphEngine(parsedGraph, globalPQCMappingManager);
        currentPlanner = new MigrationPlanner(currentEngine, globalPQCMappingManager);
        currentPlanner.generatePlan();
        activePresetId = 'custom-cbom';
      }

      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();
      const plan = currentPlanner.generatePlan();
      const auditLogs = currentPlanner.getAuditLogs();

      currentPlanner.addAuditLog({
        level: 'INFO',
        category: 'SCAN',
        message: `Cryptographic Bill of Materials (CBOM) scan completed. Discovered ${graph.nodes.length} assets and ${graph.edges.length} cryptographic dependency vectors.`,
      });

      res.json({
        graph,
        riskSummary,
        plan,
        auditLogs,
        activePresetId,
      });
    } catch (err: any) {
      console.error('Scan error:', err);
      res.status(400).json({ error: err.message || 'Failed to scan CBOM infrastructure.' });
    }
  });

  // POST /api/generate-plan - Returns step-by-step phased migration sequence
  app.post('/api/generate-plan', (req, res) => {
    try {
      const plan = currentPlanner.generatePlan();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();
      res.json({ plan, graph, riskSummary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/simulate-step - Progresses a specific migration step
  app.post('/api/simulate-step', (req, res) => {
    try {
      const { stepId } = req.body;
      if (typeof stepId !== 'number') {
        return res.status(400).json({ error: 'stepId number is required.' });
      }

      const result = currentPlanner.simulateStep(stepId);
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      res.json({
        ...result,
        graph,
        riskSummary,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/simulate-next - Auto-advances the next ready migration step
  app.post('/api/simulate-next', (req, res) => {
    try {
      const result = currentPlanner.simulateNextReadyStep();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      res.json({
        ...result,
        graph,
        riskSummary,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/unblock - Remediates a blocker node via PQC Shim / Decoupling Proxy
  app.post('/api/unblock', (req, res) => {
    try {
      const { nodeId, strategy } = req.body;
      if (!nodeId) {
        return res.status(400).json({ error: 'nodeId is required.' });
      }

      const result = currentPlanner.unblockAndRemediate(nodeId, strategy);
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();
      const plan = currentPlanner.generatePlan();

      res.json({
        ...result,
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/reset - Resets graph to initial vulnerable state
  app.post('/api/reset', (req, res) => {
    try {
      const found = ALL_PRESETS.find((p) => p.id === activePresetId) || PRESET_FINTECH_PAYMENT;
      currentEngine = new CBOMGraphEngine(JSON.parse(JSON.stringify(found.graph)), globalPQCMappingManager);
      currentPlanner = new MigrationPlanner(currentEngine, globalPQCMappingManager);
      const plan = currentPlanner.generatePlan();
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      currentPlanner.addAuditLog({
        level: 'INFO',
        category: 'SYSTEM',
        message: `Reset graph to baseline initial state for preset "${found.name}".`,
      });

      res.json({
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/ai/advisor - Gemini AI Cryptographic Architect review
  app.post('/api/ai/advisor', async (req, res) => {
    try {
      const { nodeId } = req.body;
      let targetNode = currentEngine.getNode(nodeId);

      if (!targetNode) {
        // Fallback to highest risk node if none selected
        const allNodes = currentEngine.getGraphData().nodes;
        targetNode = allNodes.sort((a, b) => b.risk_score - a.risk_score)[0];
      }

      if (!targetNode) {
        return res.status(400).json({ error: 'No node available for AI advisory.' });
      }

      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      const advisory = await generateNodeAdvisory(targetNode, graph, riskSummary);

      currentPlanner.addAuditLog({
        level: 'INFO',
        category: 'AI_ADVISOR',
        message: `Gemini AI Cryptographic Architect generated PQC remediation playbook for ${targetNode.label} (${targetNode.crypto_primitive}).`,
        node_id: targetNode.id,
      });

      res.json({
        nodeId: targetNode.id,
        nodeLabel: targetNode.label,
        advisory,
      });
    } catch (err: any) {
      console.error('AI Advisor error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate AI advisory.' });
    }
  });

  // GET /api/audit-logs - Retrieve real-time telemetry logs
  app.get('/api/audit-logs', (req, res) => {
    res.json({ logs: currentPlanner.getAuditLogs() });
  });

  // ================= Q-DAY BLAST RADIUS SIMULATION =================
  // POST /api/blast-radius - Compute cascading compromise from a broken root node
  app.post('/api/blast-radius', (req, res) => {
    try {
      const { nodeId } = req.body;
      if (!nodeId) {
        return res.status(400).json({ error: 'nodeId is required.' });
      }

      const result = currentEngine.computeBlastRadius(nodeId);

      currentPlanner.addAuditLog({
        level: 'CRITICAL',
        category: 'RISK_EVAL',
        message: `Q-DAY SIMULATION: Adversary compromise of "${result.origin_label}" cascades to ${result.compromised_count}/${result.total_assets} assets. Estimated financial/regulatory exposure: $${result.estimated_financial_exposure_usd.toLocaleString()}.`,
        node_id: nodeId,
      });

      res.json({ blastRadius: result, auditLogs: currentPlanner.getAuditLogs() });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to compute blast radius.' });
    }
  });

  // POST /api/blast-radius/mitigate - Deploy PQC Isolation to stop the cascade
  app.post('/api/blast-radius/mitigate', (req, res) => {
    try {
      const { nodeId } = req.body;
      if (!nodeId) {
        return res.status(400).json({ error: 'nodeId is required.' });
      }

      const result = currentEngine.mitigateBlastRadiusWithPQCIsolation(nodeId);
      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();

      currentPlanner.addAuditLog({
        level: 'SUCCESS',
        category: 'MIGRATION',
        message: `PQC Isolation Boundary deployed at node "${nodeId}" — ${result.isolatedEdgeCount} outbound cascade path(s) contained.`,
        node_id: nodeId,
      });

      res.json({ ...result, graph, riskSummary, auditLogs: currentPlanner.getAuditLogs() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to mitigate blast radius.' });
    }
  });

  // ================= NETWORK PAYLOAD OVERHEAD BENCHMARKING =================
  // GET /api/payload-overhead/:nodeId - Classical vs. PQC packet size comparison
  app.get('/api/payload-overhead/:nodeId', (req, res) => {
    try {
      const { nodeId } = req.params;
      const node = currentEngine.getNode(nodeId);
      if (!node) {
        return res.status(404).json({ error: `Node "${nodeId}" not found.` });
      }
      const report = computePayloadOverhead(node, globalPQCMappingManager);
      res.json({ report });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to compute payload overhead.' });
    }
  });

  // ================= LIVE GITHUB REPOSITORY AUTO-SCANNER =================
  // POST /api/scan/github - Fetch and parse a public GitHub repo for crypto usage
  app.post('/api/scan/github', async (req, res) => {
    try {
      const { repoUrl } = req.body;
      if (!repoUrl || typeof repoUrl !== 'string') {
        return res.status(400).json({ error: 'repoUrl is required.' });
      }

      const scanResult = await currentEngine.scanGithubRepository(repoUrl);

      // Load the discovered topology directly into the active graph engine.
      currentEngine = new CBOMGraphEngine(scanResult.graph, globalPQCMappingManager);
      currentPlanner = new MigrationPlanner(currentEngine, globalPQCMappingManager);
      currentPlanner.generatePlan();
      activePresetId = 'custom-cbom';

      const graph = currentEngine.getGraphData();
      const riskSummary = currentEngine.getRiskSummary();
      const plan = currentPlanner.generatePlan();

      currentPlanner.addAuditLog({
        level: scanResult.findings.length > 0 ? 'WARN' : 'INFO',
        category: 'SCAN',
        message: `GitHub scan of ${scanResult.owner}/${scanResult.repo} complete. Scanned ${scanResult.files_scanned.length} manifest file(s), found ${scanResult.findings.length} cryptographic reference(s).`,
      });

      res.json({
        scan: scanResult,
        graph,
        riskSummary,
        plan,
        auditLogs: currentPlanner.getAuditLogs(),
        activePresetId,
      });
    } catch (err: any) {
      console.error('GitHub scan error:', err);
      res.status(400).json({ error: err.message || 'Failed to scan GitHub repository.' });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        watch: process.env.DISABLE_HMR === 'true' ? null : undefined,
        ws: process.env.DISABLE_HMR === 'true' ? false : undefined,
      } as any,
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CAMP-Graph Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
