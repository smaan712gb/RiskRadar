import { createLogger } from '@riskradar/logger';
import { ModelRouter, type ModelConfig } from './lib/model-router.js';
import { AgentBus } from './messaging/agent-bus.js';
import { FusionEngine } from './engine/fusion-engine.js';
import { AutoLearningEngine } from './engine/auto-learning.js';
import { TrajectoryEngine } from './engine/trajectory-engine.js';
import { NaturalLanguagePolicyBuilder } from './engine/natural-language-policy.js';
import { SARGenerator } from './engine/sar-generator.js';
import { execSync } from 'node:child_process';

const logger = createLogger('agent-service');

/**
 * RisksRadarAI Agent Service
 *
 * Architecture:
 *   OpenClaw Gateway (runtime process) — manages agent sessions, skills, MCP
 *     └── NemoClaw (optional) — sandboxed execution, local Nemotron inference
 *
 *   This service connects to the OpenClaw Gateway via WebSocket and
 *   runs the RisksRadarAI analysis engines (fusion, auto-learning,
 *   trajectory, SAR generation) alongside the OpenClaw agent lifecycle.
 *
 * Deployment modes:
 *   - Cloud: OpenClaw + DeepSeek API (no GPU needed)
 *   - Local: OpenClaw + NemoClaw + Nemotron models (GPU required)
 *   - Hybrid: OpenClaw + NemoClaw for reasoning, DeepSeek for routine
 *
 * Installation:
 *   1. Run: deploy/scripts/setup-openclaw.sh [cloud|local|hybrid]
 *   2. Start OpenClaw: openclaw gateway
 *   3. Start this service: pnpm --filter @riskradar/agents dev
 */

async function start(): Promise<void> {
  logger.info('Starting RisksRadarAI Agent Service');

  // ─── Check OpenClaw Installation ──────────────────────────
  let openclawInstalled = false;
  try {
    const version = execSync('openclaw --version 2>/dev/null || echo "not found"', { encoding: 'utf8' }).trim();
    if (version && !version.includes('not found')) {
      openclawInstalled = true;
      logger.info({ version }, 'OpenClaw detected');
    }
  } catch {
    // OpenClaw not installed — run in standalone mode
  }

  if (!openclawInstalled) {
    logger.warn('OpenClaw not installed. Running in standalone mode.');
    logger.warn('For full capabilities, install OpenClaw: npm install -g openclaw@latest');
    logger.warn('Then run: deploy/scripts/setup-openclaw.sh');
  }

  // ─── Check NemoClaw Installation ──────────────────────────
  let nemoclawInstalled = false;
  try {
    const ncVersion = execSync('nemoclaw --version 2>/dev/null || echo "not found"', { encoding: 'utf8' }).trim();
    if (ncVersion && !ncVersion.includes('not found')) {
      nemoclawInstalled = true;
      logger.info({ version: ncVersion }, 'NemoClaw detected — sandboxed execution enabled');
    }
  } catch {
    // NemoClaw not installed
  }

  // ─── Initialize Model Router ──────────────────────────────
  const inferenceMode = (process.env['INFERENCE_MODE'] ?? 'cloud') as 'local' | 'cloud' | 'hybrid';

  const modelConfig: ModelConfig = {
    endpoint: nemoclawInstalled
      ? (process.env['NEMOCLAW_ENDPOINT'] ?? 'http://localhost:8080')
      : 'https://api.deepseek.com/v1',
    superModel: process.env['NEMOTRON_SUPER_MODEL'] ?? 'nemotron-3-super-120b-a12b',
    cascadeModel: process.env['NEMOTRON_CASCADE_MODEL'] ?? 'nemotron-cascade-2-30b-a3b',
    timeoutMs: parseInt(process.env['MODEL_TIMEOUT_MS'] ?? '30000', 10),
    privacyRouterEnabled: process.env['PRIVACY_ROUTER_ENABLED'] === 'true',
    inferenceMode: nemoclawInstalled ? inferenceMode : 'cloud',
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    openaiApiKey: process.env['OPENAI_API_KEY'],
    deepseekApiKey: process.env['DEEPSEEK_API_KEY'],
  };

  const modelRouter = new ModelRouter(modelConfig);

  const activeMode = nemoclawInstalled ? inferenceMode : 'cloud';
  const activeModels = activeMode === 'cloud'
    ? ['DeepSeek V3.2 (deepseek-chat)']
    : activeMode === 'hybrid'
    ? ['Nemotron-Cascade-2 (local reasoning)', 'DeepSeek V3.2 (routine)']
    : ['Nemotron-3-Super-120B', 'Nemotron-Cascade-2'];

  logger.info({
    inferenceMode: activeMode,
    models: activeModels,
    openclawInstalled,
    nemoclawInstalled,
  }, `Model router initialized — ${activeMode} inference`);

  // ─── Initialize Agent Communication ───────────────────────
  let messageBus: AgentBus | null = null;
  try {
    messageBus = new AgentBus();
    await messageBus.initialize();
    logger.info('Agent message bus initialized (Redis Pub/Sub)');
  } catch (error) {
    logger.warn('Redis unavailable — agent messaging disabled. Engines run in standalone mode.');
  }

  // ─── Initialize AI Engines ────────────────────────────────
  const fusionEngine = new FusionEngine(modelRouter);
  const autoLearningEngine = new AutoLearningEngine();
  const trajectoryEngine = new TrajectoryEngine();
  const nlPolicyBuilder = new NaturalLanguagePolicyBuilder(modelRouter);
  const sarGenerator = new SARGenerator(modelRouter);

  // Start fusion engine
  fusionEngine.start();

  // Subscribe to incoming signals for fusion (if message bus available)
  if (messageBus) {
    messageBus.subscribeToSignals((signal) => {
      fusionEngine.ingestSignal(signal);
    });
  }

  logger.info({
    engines: ['FusionEngine', 'AutoLearningEngine', 'TrajectoryEngine', 'NLPolicyBuilder', 'SARGenerator'],
    skills: 7,
    signalTypes: 40,
    agentTopology: '5 collectors + 4 analysis + 3 response',
  }, 'All engines initialized');

  logger.info('');
  logger.info('╔═══════════════════════════════════════════════╗');
  logger.info('║  RisksRadarAI Agent Service — READY           ║');
  logger.info(`║  OpenClaw: ${openclawInstalled ? 'INSTALLED' : 'NOT INSTALLED (standalone)'}             ║`);
  logger.info(`║  NemoClaw: ${nemoclawInstalled ? 'INSTALLED (sandboxed)' : 'NOT INSTALLED (cloud)'}       ║`);
  logger.info(`║  Inference: ${activeMode.toUpperCase()} (${activeModels[0]})  ║`);
  logger.info('╚═══════════════════════════════════════════════╝');

  // ─── Graceful Shutdown ────────────────────────────────────
  const shutdown = async () => {
    logger.info('Shutting down agent service...');
    fusionEngine.stop();
    if (messageBus) await messageBus.shutdown();
    logger.info('Agent service stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  logger.fatal({ error }, 'Failed to start agent service');
  process.exit(1);
});
