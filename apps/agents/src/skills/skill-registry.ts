/**
 * RiskRadar Skill Registry
 *
 * Skills are OpenClaw-compatible SKILL.md-based capabilities that give agents
 * expert-level domain knowledge far beyond what general LLMs provide.
 *
 * Each skill includes:
 * - SKILL.md: YAML frontmatter + system prompt with PhD-level domain expertise
 * - Tool functions: Executable analysis tools the agent can call
 * - Knowledge base: Domain-specific patterns, thresholds, and regulatory rules
 *
 * Skill Tiers:
 * - Foundation: Core analysis primitives (statistics, anomaly detection)
 * - Domain Expert: Industry-specific knowledge (AML, HIPAA, SOX)
 * - Forensic: Investigation and evidence compilation
 * - Regulatory: Compliance mapping and report generation
 */

export interface Skill {
  id: string;
  name: string;
  version: string;
  domain: string;
  tier: 'foundation' | 'domain_expert' | 'forensic' | 'regulatory';
  description: string;
  systemPrompt: string;
  tools: SkillTool[];
  knowledgeBase?: Record<string, unknown>;
}

export interface SkillTool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
}

const registeredSkills = new Map<string, Skill>();

export function registerSkill(skill: Skill): void {
  registeredSkills.set(skill.id, skill);
}

export function getSkill(id: string): Skill | undefined {
  return registeredSkills.get(id);
}

export function getSkillsByDomain(domain: string): Skill[] {
  return [...registeredSkills.values()].filter((s) => s.domain === domain);
}

export function getSkillsByTier(tier: Skill['tier']): Skill[] {
  return [...registeredSkills.values()].filter((s) => s.tier === tier);
}

export function getAllSkills(): Skill[] {
  return [...registeredSkills.values()];
}

export function buildAgentSystemPrompt(agentDomain: string, additionalContext?: string): string {
  const skills = getSkillsByDomain(agentDomain);
  const foundationSkills = getSkillsByTier('foundation');

  const skillPrompts = [...foundationSkills, ...skills]
    .map((s) => s.systemPrompt)
    .join('\n\n---\n\n');

  return `${skillPrompts}${additionalContext ? `\n\n---\n\nAdditional Context:\n${additionalContext}` : ''}`;
}
