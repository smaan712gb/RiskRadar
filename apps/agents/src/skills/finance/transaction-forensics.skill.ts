import { registerSkill, type Skill, type SkillTool } from '../skill-registry.js';

/**
 * Transaction Forensics Skill
 *
 * Expert-level financial crime detection modeled on the knowledge of:
 * - Certified Fraud Examiners (CFE)
 * - Certified Anti-Money Laundering Specialists (CAMS)
 * - FinCEN analytical methodology
 * - Wolfsberg Group guidelines
 * - FATF 40 Recommendations
 *
 * Detects: layering, structuring, round-tripping, trade-based laundering,
 * invoice fraud, payroll fraud, expense fraud, kickback schemes,
 * embezzlement patterns, ghost employee schemes.
 */

const systemPrompt = `You are an expert financial crime analyst with the combined knowledge of a Certified Fraud Examiner (CFE), Certified Anti-Money Laundering Specialist (CAMS), and forensic accountant with 20+ years investigating white-collar crime at major financial institutions.

CORE EXPERTISE:
- Benford's Law analysis for detecting fabricated numbers
- Temporal pattern analysis (transaction timing anomalies, round-number bias, just-below-threshold structuring)
- Network analysis (hidden relationships between accounts, payees, and approvers)
- Override pattern forensics (supervisor absence correlation, approval chain manipulation)
- Velocity analysis (sudden changes in transaction frequency, amount distributions)
- Reciprocity detection (round-tripping between related entities)
- Invoice fraud markers (duplicate invoices, phantom vendors, pricing anomalies)

DETECTION PATTERNS YOU KNOW:

1. STRUCTURING (Smurfing):
   - Multiple transactions just below $10,000 CTR threshold
   - Multiple transactions just below internal authority limits
   - Round numbers or recurring exact amounts
   - Deposits/withdrawals across multiple branches on same day

2. LAYERING:
   - Rapid movement of funds through multiple accounts
   - Funds flowing to newly created accounts then immediately out
   - Complex chains of wire transfers with no apparent business purpose
   - Use of intermediary accounts that receive and immediately disburse

3. OVERRIDE ABUSE:
   - Transactions processed during supervisor absence
   - Single user responsible for >2 standard deviations of override volume
   - Override clustering (multiple overrides in short time window)
   - Override + new payee + large amount = highest risk combination

4. EXPENSE FRAUD:
   - Expenses submitted on weekends/holidays
   - Sequential receipt numbers from different dates
   - Round dollar amounts (psychological tendency in fabrication)
   - Same amounts appearing across multiple employees
   - Expenses submitted just below approval thresholds

5. GHOST EMPLOYEE / PAYROLL FRAUD:
   - Employees with no badge swipes but active payroll
   - Payroll direct deposits to accounts also receiving vendor payments
   - New employees with immediate access to financial systems
   - Terminated employees with continuing payroll deposits

6. VENDOR / PROCUREMENT FRAUD:
   - Vendors sharing addresses, phone numbers, or bank accounts with employees
   - Vendor creation followed immediately by large PO
   - Split purchase orders to avoid approval thresholds
   - Sole-source contracts with no competitive bidding documentation

ANALYTICAL METHODS:
- Benford's Law: Test first-digit, second-digit, and first-two-digit distributions
- Z-score analysis: Flag values >3 standard deviations from peer group mean
- Herfindahl index: Measure concentration of approvals or transactions per person
- Time-series decomposition: Separate trend, seasonal, and anomalous components
- Graph analysis: Build transaction networks and find unusual clustering coefficients

When analyzing data, always:
1. State your confidence level (0-100%)
2. Cite the specific detection pattern that triggered the finding
3. Reference applicable regulatory requirements
4. Calculate false positive probability based on base rates
5. Provide recommended investigative actions in priority order`;

const benfords_law_tool: SkillTool = {
  name: 'benfords_law_analysis',
  description: 'Apply Benfords Law analysis to a set of transaction amounts to detect fabricated or manipulated numbers',
  parameters: {
    amounts: { type: 'array', description: 'Array of transaction amounts', required: true },
    testType: { type: 'string', description: 'first_digit, second_digit, or first_two', required: false, enum: ['first_digit', 'second_digit', 'first_two'] },
  },
  execute: async (params) => {
    const amounts = params['amounts'] as number[];
    const testType = (params['testType'] as string) ?? 'first_digit';

    if (testType === 'first_digit') {
      const expected = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
      const observed = new Array(10).fill(0) as number[];

      for (const amount of amounts) {
        const firstDigit = parseInt(Math.abs(amount).toString()[0]!, 10);
        observed[firstDigit]!++;
      }

      const total = amounts.length;
      const chiSquare = expected.reduce((sum, exp, i) => {
        if (i === 0 || exp === 0) return sum;
        const obs = observed[i]! / total;
        return sum + ((obs - exp) ** 2) / exp;
      }, 0);

      // Chi-square critical value for 8 degrees of freedom at 0.05 significance = 15.507
      const suspicious = chiSquare > 15.507;
      const digitDistribution = observed.map((count, digit) => ({
        digit,
        observed: (count / total * 100).toFixed(1) + '%',
        expected: (expected[digit]! * 100).toFixed(1) + '%',
        deviation: digit > 0 ? ((count / total - expected[digit]!) * 100).toFixed(1) + 'pp' : 'N/A',
      }));

      return {
        testType: 'first_digit',
        sampleSize: amounts.length,
        chiSquare: chiSquare.toFixed(4),
        pValue: suspicious ? '<0.05' : '>0.05',
        suspicious,
        digitDistribution: digitDistribution.filter((d) => d.digit > 0),
        interpretation: suspicious
          ? 'Distribution deviates significantly from Benfords Law. Potential data manipulation or fabrication detected.'
          : 'Distribution conforms to Benfords Law. No evidence of systematic manipulation.',
      };
    }

    return { error: 'Only first_digit analysis implemented in this version' };
  },
};

const structuring_detection_tool: SkillTool = {
  name: 'structuring_detection',
  description: 'Detect potential structuring (smurfing) patterns in transaction data',
  parameters: {
    transactions: { type: 'array', description: 'Array of {amount, date, type, account}', required: true },
    threshold: { type: 'number', description: 'Regulatory reporting threshold (default 10000)', required: false },
    windowDays: { type: 'number', description: 'Analysis window in days (default 7)', required: false },
  },
  execute: async (params) => {
    const transactions = params['transactions'] as Array<{
      amount: number;
      date: string;
      type: string;
      account?: string;
    }>;
    const threshold = (params['threshold'] as number) ?? 10000;
    const windowDays = (params['windowDays'] as number) ?? 7;
    const buffer = threshold * 0.15; // 15% below threshold

    const justBelow = transactions.filter(
      (t) => t.amount >= threshold - buffer && t.amount < threshold,
    );

    // Group by date window
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const clusters: Array<{ transactions: typeof transactions; totalAmount: number; days: number }> = [];

    for (let i = 0; i < sorted.length; i++) {
      const cluster = [sorted[i]!];
      let total = sorted[i]!.amount;

      for (let j = i + 1; j < sorted.length; j++) {
        const daysDiff =
          (new Date(sorted[j]!.date).getTime() - new Date(sorted[i]!.date).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysDiff <= windowDays) {
          cluster.push(sorted[j]!);
          total += sorted[j]!.amount;
        } else break;
      }

      if (cluster.length >= 2 && total >= threshold) {
        clusters.push({
          transactions: cluster,
          totalAmount: total,
          days: Math.ceil(
            (new Date(cluster[cluster.length - 1]!.date).getTime() -
              new Date(cluster[0]!.date).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        });
      }
    }

    // Round number analysis
    const roundNumbers = transactions.filter(
      (t) => t.amount % 100 === 0 || t.amount % 500 === 0 || t.amount % 1000 === 0,
    );
    const roundNumberRate = roundNumbers.length / transactions.length;

    return {
      totalTransactions: transactions.length,
      justBelowThreshold: {
        count: justBelow.length,
        percentage: ((justBelow.length / transactions.length) * 100).toFixed(1) + '%',
        transactions: justBelow.slice(0, 10),
        suspicious: justBelow.length >= 3,
      },
      aggregationClusters: {
        count: clusters.length,
        clusters: clusters.slice(0, 5).map((c) => ({
          transactionCount: c.transactions.length,
          totalAmount: c.totalAmount,
          daySpan: c.days,
          exceedsThreshold: c.totalAmount >= threshold,
        })),
        suspicious: clusters.length >= 2,
      },
      roundNumberAnalysis: {
        roundNumberRate: (roundNumberRate * 100).toFixed(1) + '%',
        expectedRate: '15-25%',
        suspicious: roundNumberRate > 0.4,
      },
      overallRisk: justBelow.length >= 3 || clusters.length >= 2 ? 'HIGH' : roundNumberRate > 0.4 ? 'MEDIUM' : 'LOW',
    };
  },
};

const override_pattern_tool: SkillTool = {
  name: 'override_pattern_analysis',
  description: 'Analyze transaction override patterns for potential fraud indicators',
  parameters: {
    overrides: { type: 'array', description: 'Array of {userId, timestamp, amount, type, supervisorPresent}', required: true },
    baselineOverridesPerMonth: { type: 'number', description: 'Expected monthly override count per user', required: false },
  },
  execute: async (params) => {
    const overrides = params['overrides'] as Array<{
      userId: string;
      timestamp: string;
      amount: number;
      type: string;
      supervisorPresent: boolean;
    }>;
    const baseline = (params['baselineOverridesPerMonth'] as number) ?? 2;

    // Group by user
    const byUser = new Map<string, typeof overrides>();
    for (const override of overrides) {
      const existing = byUser.get(override.userId) ?? [];
      existing.push(override);
      byUser.set(override.userId, existing);
    }

    // Analyze each user
    const userAnalysis = [...byUser.entries()].map(([userId, userOverrides]) => {
      const withoutSupervisor = userOverrides.filter((o) => !o.supervisorPresent);
      const afterHours = userOverrides.filter((o) => {
        const hour = new Date(o.timestamp).getHours();
        return hour < 7 || hour > 19;
      });
      const totalAmount = userOverrides.reduce((sum, o) => sum + o.amount, 0);
      const avgAmount = totalAmount / userOverrides.length;

      // Check for temporal clustering (multiple overrides within 1 hour)
      const sorted = [...userOverrides].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      let maxClusterSize = 1;
      let currentCluster = 1;
      for (let i = 1; i < sorted.length; i++) {
        const gap = new Date(sorted[i]!.timestamp).getTime() - new Date(sorted[i - 1]!.timestamp).getTime();
        if (gap < 60 * 60 * 1000) {
          currentCluster++;
          maxClusterSize = Math.max(maxClusterSize, currentCluster);
        } else {
          currentCluster = 1;
        }
      }

      const riskScore = Math.min(100,
        (userOverrides.length > baseline * 2 ? 30 : 0) +
        (withoutSupervisor.length > userOverrides.length * 0.5 ? 25 : 0) +
        (afterHours.length > 0 ? 20 : 0) +
        (maxClusterSize >= 3 ? 25 : maxClusterSize >= 2 ? 10 : 0)
      );

      return {
        userId,
        totalOverrides: userOverrides.length,
        withoutSupervisor: withoutSupervisor.length,
        afterHours: afterHours.length,
        maxClusterSize,
        avgAmount: Math.round(avgAmount),
        totalAmount: Math.round(totalAmount),
        riskScore,
        riskLevel: riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW',
        redFlags: [
          ...(userOverrides.length > baseline * 3 ? [`Override volume ${userOverrides.length}x exceeds ${baseline} baseline`] : []),
          ...(withoutSupervisor.length > userOverrides.length * 0.5 ? [`${withoutSupervisor.length}/${userOverrides.length} overrides without supervisor present`] : []),
          ...(afterHours.length > 0 ? [`${afterHours.length} after-hours overrides`] : []),
          ...(maxClusterSize >= 3 ? [`Cluster of ${maxClusterSize} overrides within 1 hour`] : []),
        ],
      };
    });

    return {
      totalOverrides: overrides.length,
      uniqueUsers: byUser.size,
      baseline: `${baseline}/month expected`,
      highRiskUsers: userAnalysis.filter((u) => u.riskLevel === 'HIGH'),
      mediumRiskUsers: userAnalysis.filter((u) => u.riskLevel === 'MEDIUM'),
      allUsers: userAnalysis.sort((a, b) => b.riskScore - a.riskScore),
    };
  },
};

const skill: Skill = {
  id: 'finance.transaction_forensics',
  name: 'Transaction Forensics',
  version: '1.0.0',
  domain: 'finance',
  tier: 'domain_expert',
  description: 'Expert-level financial crime detection: structuring, layering, override abuse, expense fraud, vendor fraud',
  systemPrompt,
  tools: [benfords_law_tool, structuring_detection_tool, override_pattern_tool],
  knowledgeBase: {
    ctrThreshold: 10000,
    sarThreshold: 5000,
    structuringBuffer: 0.15,
    overrideBaselinePerMonth: 2,
    roundNumberExpectedRate: 0.2,
  },
};

registerSkill(skill);

export default skill;
