import { createLogger } from '@riskradar/logger';
import { ModelRouter, type ModelConfig } from './lib/model-router.js';
import { AgentBus } from './messaging/agent-bus.js';
import { FusionEngine } from './engine/fusion-engine.js';
import { AutoLearningEngine } from './engine/auto-learning.js';
import { TrajectoryEngine } from './engine/trajectory-engine.js';
import { NaturalLanguagePolicyBuilder } from './engine/natural-language-policy.js';
import { SARGenerator } from './engine/sar-generator.js';

const logger = createLogger('agent-service');

async function start(): Promise<void> {
  logger.info('Starting RiskRadar Agent Service');

  // Initialize model router with inference mode
  const inferenceMode = (process.env['INFERENCE_MODE'] ?? 'local') as 'local' | 'cloud' | 'hybrid';

  const modelConfig: ModelConfig = {
    endpoint: process.env['NEMOCLAW_ENDPOINT'] ?? 'http://localhost:8080',
    superModel: process.env['NEMOTRON_SUPER_MODEL'] ?? 'nemotron-3-super-120b-a12b',
    cascadeModel: process.env['NEMOTRON_CASCADE_MODEL'] ?? 'nemotron-cascade-2-30b-a3b',
    timeoutMs: parseInt(process.env['MODEL_TIMEOUT_MS'] ?? '30000', 10),
    privacyRouterEnabled: process.env['PRIVACY_ROUTER_ENABLED'] === 'true',
    inferenceMode,
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    openaiApiKey: process.env['OPENAI_API_KEY'],
  };

  const modelRouter = new ModelRouter(modelConfig);
  logger.info({
    inferenceMode,
    models: inferenceMode === 'cloud'
      ? ['cloud API (Claude/GPT)']
      : [modelConfig.superModel, modelConfig.cascadeModel],
  }, `Model router initialized — ${inferenceMode} mode`);

  // Initialize message bus
  const messageBus = new AgentBus();
  await messageBus.initialize();
  logger.info('Agent message bus initialized');

  // Initialize engines
  const fusionEngine = new FusionEngine(modelRouter);
  const _autoLearningEngine = new AutoLearningEngine();
  const _trajectoryEngine = new TrajectoryEngine();
  const _nlPolicyBuilder = new NaturalLanguagePolicyBuilder(modelRouter);
  const _sarGenerator = new SARGenerator(modelRouter);

  // Start fusion engine
  fusionEngine.start();

  // Subscribe to incoming signals for fusion
  messageBus.subscribeToSignals((signal) => {
    fusionEngine.ingestSignal(signal);
  });

  logger.info('All engines initialized and running');
  logger.info('RiskRadar Agent Service ready');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down agent service...');
    fusionEngine.stop();
    await messageBus.shutdown();
    logger.info('Agent service stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Export engines for external access (e.g., API workers)
  return;
}

start().catch((error) => {
  logger.fatal({ error }, 'Failed to start agent service');
  process.exit(1);
});
