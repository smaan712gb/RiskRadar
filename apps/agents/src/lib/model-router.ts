import { createLogger } from '@riskradar/logger';
import type { ReasoningTier } from '@riskradar/shared';

const logger = createLogger('model-router');

export interface ModelInferenceRequest {
  prompt: string;
  systemPrompt: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  requireReasoning?: boolean;
}

export interface ModelInferenceResponse {
  content: string;
  reasoning?: string;
  tier: ReasoningTier;
  modelId: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
}

export interface ModelConfig {
  endpoint: string;
  superModel: string;
  cascadeModel: string;
  timeoutMs: number;
  privacyRouterEnabled: boolean;
}

/**
 * Three-tier model router:
 * - Tier 1 (Nemotron-3-Super-120B): Fast, always-on monitoring. Handles ~95% of requests.
 * - Tier 2 (Nemotron-Cascade-2-30B): Deep reasoning. Gold-medal level analysis. ~4% of requests.
 * - Tier 3 (Cloud fallback): PII-stripped, frontier models. <1% of requests.
 */
export class ModelRouter {
  private config: ModelConfig;
  private inferenceCache = new Map<string, { response: ModelInferenceResponse; expiresAt: number }>();

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async infer(request: ModelInferenceRequest): Promise<ModelInferenceResponse> {
    const startTime = Date.now();
    const tier = this.selectTier(request);

    // Check cache for identical prompts (short TTL)
    const cacheKey = this.computeCacheKey(request, tier);
    const cached = this.getCached(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    logger.info({ tier, promptLength: request.prompt.length }, 'Routing inference request');

    let response: ModelInferenceResponse;

    try {
      switch (tier) {
        case 'tier1_super':
          response = await this.inferTier1(request, startTime);
          break;
        case 'tier2_cascade':
          response = await this.inferTier2(request, startTime);
          break;
        case 'tier3_cloud':
          response = await this.inferTier3(request, startTime);
          break;
      }
    } catch (error) {
      // Fallback: if Tier 1 fails, try Tier 2. If Tier 2 fails, try Tier 3.
      logger.warn({ tier, error }, 'Inference failed, attempting fallback');
      response = await this.inferWithFallback(request, tier, startTime);
    }

    // Cache response (5 minute TTL)
    this.setCache(cacheKey, response, 5 * 60 * 1000);

    return response;
  }

  private selectTier(request: ModelInferenceRequest): ReasoningTier {
    if (request.requireReasoning) {
      return 'tier2_cascade';
    }

    // Heuristic: long prompts with complex context → Tier 2
    const promptComplexity = this.estimateComplexity(request.prompt);
    if (promptComplexity > 0.8) {
      return 'tier2_cascade';
    }

    return 'tier1_super';
  }

  private estimateComplexity(prompt: string): number {
    let score = 0;
    const indicators = [
      { pattern: /correlat/i, weight: 0.2 },
      { pattern: /multi.*step/i, weight: 0.3 },
      { pattern: /evidence.*chain/i, weight: 0.3 },
      { pattern: /regulatory|compliance|BSA|AML|SAR/i, weight: 0.2 },
      { pattern: /explain|reasoning|why/i, weight: 0.15 },
      { pattern: /compound.*risk|cross.*domain/i, weight: 0.25 },
      { pattern: /trajectory|predict|forecast/i, weight: 0.2 },
    ];

    for (const { pattern, weight } of indicators) {
      if (pattern.test(prompt)) {
        score += weight;
      }
    }

    // Long prompts are more likely to need deep reasoning
    if (prompt.length > 5000) score += 0.1;
    if (prompt.length > 20000) score += 0.2;

    return Math.min(score, 1.0);
  }

  private async inferTier1(
    request: ModelInferenceRequest,
    startTime: number,
  ): Promise<ModelInferenceResponse> {
    const response = await this.callNemoClaw(
      this.config.superModel,
      request,
    );

    return {
      content: response.content,
      tier: 'tier1_super',
      modelId: this.config.superModel,
      tokensUsed: response.tokensUsed,
      latencyMs: Date.now() - startTime,
      cached: false,
    };
  }

  private async inferTier2(
    request: ModelInferenceRequest,
    startTime: number,
  ): Promise<ModelInferenceResponse> {
    // Cascade-2 in "Thinking" mode for chain-of-thought reasoning
    const thinkingPrompt = `<thinking>\nAnalyze the following step by step, showing your reasoning:\n</thinking>\n\n${request.prompt}`;
    const response = await this.callNemoClaw(
      this.config.cascadeModel,
      { ...request, prompt: thinkingPrompt },
    );

    // Extract reasoning from <thinking> tags if present
    const reasoningMatch = response.content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    const reasoning = reasoningMatch?.[1]?.trim();
    const content = response.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();

    return {
      content,
      reasoning,
      tier: 'tier2_cascade',
      modelId: this.config.cascadeModel,
      tokensUsed: response.tokensUsed,
      latencyMs: Date.now() - startTime,
      cached: false,
    };
  }

  private async inferTier3(
    request: ModelInferenceRequest,
    startTime: number,
  ): Promise<ModelInferenceResponse> {
    if (!this.config.privacyRouterEnabled) {
      throw new Error('Privacy router is disabled. Cannot route to cloud models.');
    }

    // PII stripping would happen here via NemoClaw Privacy Router
    logger.info('Routing to cloud model via Privacy Router (PII-stripped)');

    // TODO: Implement cloud fallback via NemoClaw Privacy Router
    throw new Error('Cloud fallback not yet implemented');
  }

  private async inferWithFallback(
    request: ModelInferenceRequest,
    failedTier: ReasoningTier,
    startTime: number,
  ): Promise<ModelInferenceResponse> {
    const fallbackOrder: ReasoningTier[] = ['tier1_super', 'tier2_cascade', 'tier3_cloud'];
    const startIdx = fallbackOrder.indexOf(failedTier) + 1;

    for (let i = startIdx; i < fallbackOrder.length; i++) {
      const tier = fallbackOrder[i]!;
      try {
        switch (tier) {
          case 'tier1_super':
            return await this.inferTier1(request, startTime);
          case 'tier2_cascade':
            return await this.inferTier2(request, startTime);
          case 'tier3_cloud':
            return await this.inferTier3(request, startTime);
        }
      } catch {
        logger.warn({ tier }, 'Fallback tier also failed');
        continue;
      }
    }

    throw new Error('All inference tiers failed');
  }

  private async callNemoClaw(
    modelId: string,
    request: ModelInferenceRequest,
  ): Promise<{ content: string; tokensUsed: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.prompt },
          ],
          max_tokens: request.maxTokens ?? 4096,
          temperature: request.temperature ?? 0.1,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`NemoClaw inference failed (${response.status}): ${text}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage: { total_tokens: number };
      };

      return {
        content: data.choices[0]?.message.content ?? '',
        tokensUsed: data.usage?.total_tokens ?? 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private computeCacheKey(request: ModelInferenceRequest, tier: ReasoningTier): string {
    return `${tier}:${request.systemPrompt.slice(0, 50)}:${request.prompt.slice(0, 200)}`;
  }

  private getCached(key: string): ModelInferenceResponse | null {
    const entry = this.inferenceCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.response;
    }
    this.inferenceCache.delete(key);
    return null;
  }

  private setCache(key: string, response: ModelInferenceResponse, ttlMs: number): void {
    // Cap cache size
    if (this.inferenceCache.size > 500) {
      const firstKey = this.inferenceCache.keys().next().value;
      if (firstKey) this.inferenceCache.delete(firstKey);
    }
    this.inferenceCache.set(key, { response, expiresAt: Date.now() + ttlMs });
  }
}
