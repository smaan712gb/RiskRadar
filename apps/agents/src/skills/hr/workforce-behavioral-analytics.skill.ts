import { registerSkill, type Skill, type SkillTool } from '../skill-registry.js';

/**
 * Workforce Behavioral Analytics Skill
 *
 * Expert-level organizational psychology and workforce analytics modeled on:
 * - Industrial-Organizational Psychology (I/O Psychology PhD level)
 * - Organizational Behavior research (Academy of Management)
 * - Gallup Q12 engagement methodology
 * - Maslach Burnout Inventory (MBI)
 * - IBM Watson attrition prediction research
 * - Society for Human Resource Management (SHRM) best practices
 */

const systemPrompt = `You are an expert workforce behavioral analyst with combined knowledge of Industrial-Organizational Psychology (PhD), organizational behavior research, and HR analytics with 20+ years studying workforce dynamics at Fortune 500 companies.

CORE EXPERTISE:
- Employee disengagement early detection (6-12 months pre-departure)
- Burnout prediction using Maslach dimensions (exhaustion, cynicism, inefficacy)
- Flight risk scoring using multi-signal behavioral fusion
- Team dysfunction detection (Lencioni's 5 Dysfunctions)
- Compliance behavior degradation patterns
- Quiet quitting indicator detection
- Manager effectiveness assessment through team metrics
- Cultural drift and morale decline detection

ATTRITION PREDICTION SIGNALS (from IBM research + Gallup):

1. COMMUNICATION DECLINE (Weight: 0.25):
   - Reduction in email/chat response frequency (>30% decline over 4 weeks)
   - Decreased meeting participation (camera off, fewer contributions)
   - Shortened message length (terse responses)
   - Reduced peer interaction diversity (talking to fewer colleagues)
   - Withdrawal from optional channels/groups

2. SCHEDULE PATTERN CHANGES (Weight: 0.20):
   - Shift from consistent to irregular hours
   - Increased sick day usage (especially Mondays/Fridays)
   - Declining overtime/discretionary effort
   - Interview pattern: 2-3 hour blocks disappearing midday
   - PTO clustering near month boundaries (transition timing)

3. PRODUCTIVITY SHIFTS (Weight: 0.20):
   - Task completion rate decline (>20% over baseline)
   - Sprint velocity drop for engineering
   - Reduced code commit frequency/size
   - Fewer proactive contributions (RFCs, proposals, documentation)
   - Shift from creation to maintenance work

4. ENGAGEMENT INDICATORS (Weight: 0.20):
   - Training/certification completion stalls
   - Reduced internal mobility exploration
   - Declining participation in voluntary programs
   - Feedback survey non-response or negative shifts
   - Reduced mentoring activity

5. ORGANIZATIONAL CONTEXT (Weight: 0.15):
   - Recent manager change
   - Passed over for promotion
   - Compensation below peer band
   - Team restructuring or layoff proximity
   - Tenure at critical turnover points (18mo, 3yr, 5yr)

BURNOUT DETECTION (Maslach Burnout Inventory dimensions):
- Emotional Exhaustion: Meeting overload, weekend work, declining response quality
- Depersonalization/Cynicism: Terse communications, withdrawal from team events
- Reduced Personal Accomplishment: Declining output quality, fewer completed goals

When analyzing workforce data:
1. Score each signal dimension independently (0-100)
2. Apply appropriate weights for compound risk score
3. Factor in tenure, role, and department context
4. Distinguish between attrition risk, burnout, and disengagement
5. Always recommend human-centric interventions (support, not punishment)
6. Flag any data that could indicate personal crisis requiring wellbeing support`;

const flight_risk_tool: SkillTool = {
  name: 'flight_risk_assessment',
  description: 'Calculate comprehensive flight risk score from multi-dimensional behavioral signals',
  parameters: {
    employee: { type: 'object', description: '{id, role, tenure_months, department, manager_tenure_months}', required: true },
    signals: { type: 'object', description: '{comm_change_pct, sick_days_30d, productivity_change_pct, training_completion_pct, meeting_participation_pct, peer_interaction_change_pct}', required: true },
    context: { type: 'object', description: '{recent_manager_change, passed_over_promotion, below_peer_comp, team_restructuring}', required: false },
  },
  execute: async (params) => {
    const emp = params['employee'] as { id: string; role: string; tenure_months: number; department: string; manager_tenure_months: number };
    const sig = params['signals'] as { comm_change_pct: number; sick_days_30d: number; productivity_change_pct: number; training_completion_pct: number; meeting_participation_pct: number; peer_interaction_change_pct: number };
    const ctx = (params['context'] as { recent_manager_change: boolean; passed_over_promotion: boolean; below_peer_comp: boolean; team_restructuring: boolean }) ?? {};

    // Score each dimension (0-100, higher = higher risk)
    const commScore = Math.min(100, Math.max(0, -sig.comm_change_pct * 2));
    const scheduleScore = Math.min(100, sig.sick_days_30d * 20);
    const prodScore = Math.min(100, Math.max(0, -sig.productivity_change_pct * 2));
    const engagementScore = Math.min(100, Math.max(0, 100 - sig.training_completion_pct));
    const meetingScore = Math.min(100, Math.max(0, 100 - sig.meeting_participation_pct));
    const peerScore = Math.min(100, Math.max(0, -sig.peer_interaction_change_pct * 2.5));

    // Context modifiers
    let contextBoost = 0;
    const contextFactors: string[] = [];
    if (ctx.recent_manager_change) { contextBoost += 10; contextFactors.push('Recent manager change'); }
    if (ctx.passed_over_promotion) { contextBoost += 15; contextFactors.push('Passed over for promotion'); }
    if (ctx.below_peer_comp) { contextBoost += 12; contextFactors.push('Below peer compensation band'); }
    if (ctx.team_restructuring) { contextBoost += 8; contextFactors.push('Team restructuring'); }

    // Tenure risk curve (peaks at 18mo and 36mo)
    const tenureRisk = emp.tenure_months <= 6 ? 15
      : emp.tenure_months <= 18 ? 25
      : emp.tenure_months <= 24 ? 20
      : emp.tenure_months <= 36 ? 22
      : emp.tenure_months <= 60 ? 10
      : 5;

    const weights = { comm: 0.25, schedule: 0.15, prod: 0.20, engagement: 0.15, meeting: 0.10, peer: 0.15 };
    const weightedScore =
      commScore * weights.comm +
      scheduleScore * weights.schedule +
      prodScore * weights.prod +
      engagementScore * weights.engagement +
      meetingScore * weights.meeting +
      peerScore * weights.peer +
      contextBoost +
      tenureRisk * 0.15;

    const finalScore = Math.min(100, Math.round(weightedScore));

    // Burnout vs. attrition differentiation
    const burnoutIndicators = (commScore > 50 ? 1 : 0) + (prodScore > 50 ? 1 : 0) + (scheduleScore > 30 ? 1 : 0);
    const attritionIndicators = (peerScore > 50 ? 1 : 0) + (engagementScore > 50 ? 1 : 0) + (contextBoost > 15 ? 1 : 0);

    const primaryConcern = burnoutIndicators > attritionIndicators ? 'burnout'
      : attritionIndicators > burnoutIndicators ? 'attrition_risk'
      : 'general_disengagement';

    return {
      employeeId: emp.id,
      overallRiskScore: finalScore,
      riskLevel: finalScore >= 70 ? 'HIGH' : finalScore >= 45 ? 'MEDIUM' : 'LOW',
      primaryConcern,
      dimensionScores: {
        communication: { score: Math.round(commScore), weight: weights.comm },
        schedule: { score: Math.round(scheduleScore), weight: weights.schedule },
        productivity: { score: Math.round(prodScore), weight: weights.prod },
        engagement: { score: Math.round(engagementScore), weight: weights.engagement },
        meetingParticipation: { score: Math.round(meetingScore), weight: weights.meeting },
        peerInteraction: { score: Math.round(peerScore), weight: weights.peer },
      },
      contextFactors,
      tenureRisk: { months: emp.tenure_months, riskContribution: tenureRisk },
      interventions: finalScore >= 70
        ? ['Schedule immediate 1:1 with skip-level manager', 'Review compensation against market', 'Offer development plan or lateral move', 'Consider workload redistribution']
        : finalScore >= 45
        ? ['Schedule manager check-in within 1 week', 'Review recent engagement survey responses', 'Consider stretch assignment or training opportunity']
        : ['Continue standard engagement monitoring'],
      maslachDimensions: {
        emotionalExhaustion: burnoutIndicators >= 2 ? 'elevated' : 'normal',
        cynicism: peerScore > 50 && commScore > 50 ? 'elevated' : 'normal',
        reducedAccomplishment: prodScore > 50 && engagementScore > 50 ? 'elevated' : 'normal',
      },
    };
  },
};

const skill: Skill = {
  id: 'hr.workforce_behavioral_analytics',
  name: 'Workforce Behavioral Analytics',
  version: '1.0.0',
  domain: 'hr',
  tier: 'domain_expert',
  description: 'I/O Psychology-level workforce analytics: attrition prediction, burnout detection, engagement scoring, Maslach Burnout Inventory',
  systemPrompt,
  tools: [flight_risk_tool],
};

registerSkill(skill);
export default skill;
