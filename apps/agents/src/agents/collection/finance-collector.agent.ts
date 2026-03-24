import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig, type AgentContext } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Finance Collector Agent
 *
 * Continuously ingests financial data from ERP, core banking, and expense systems.
 * Applies Transaction Forensics skill for expert-level analysis.
 *
 * Data Sources:
 * - Core Banking API (transaction logs, overrides, wire transfers)
 * - SAP/Oracle ERP (expense reports, purchase orders, invoice approvals)
 * - Payroll systems (payroll register, direct deposit changes)
 * - Treasury systems (cash flow, budget variance)
 *
 * Detection Capabilities:
 * - Structuring/smurfing
 * - Override abuse patterns
 * - Expense fraud (Benford's Law)
 * - Vendor fraud (network analysis)
 * - Payroll anomalies (ghost employees)
 * - Budget overrun velocity
 */
export class FinanceCollectorAgent extends BaseAgent {
  private lastSyncTimestamps = new Map<string, Date>();

  static createConfig(): AgentConfig {
    return {
      id: 'finance-collector',
      name: 'Finance Collector',
      team: 'collection',
      domain: 'finance',
      schedule: '5m',
      modelTier: 'tier1_super',
      dataSources: ['core_banking', 'erp', 'payroll', 'treasury'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Initializing Finance Collector Agent');

    // Load last sync timestamps from learning state
    const states = await prisma.learningState.findMany({
      where: {
        tenantId: this.context.tenantId,
        learningType: 'sync_timestamp',
        key: { startsWith: 'finance_' },
      },
    });

    for (const state of states) {
      const ts = (state.state as { lastSync: string })?.lastSync;
      if (ts) {
        this.lastSyncTimestamps.set(state.key, new Date(ts));
      }
    }

    this.logger.info(
      { dataSources: this.context.config.dataSources },
      'Finance Collector initialized',
    );
  }

  protected async onHeartbeat(): Promise<void> {
    this.logger.debug('Finance Collector heartbeat');

    // Fetch from each configured data source
    const integrations = await prisma.integration.findMany({
      where: {
        tenantId: this.context.tenantId,
        integrationType: 'erp_finance',
        status: 'active',
      },
    });

    for (const integration of integrations) {
      try {
        await this.syncDataSource(integration);
      } catch (error) {
        this.logger.error(
          { error, provider: integration.provider },
          'Failed to sync finance data source',
        );
      }
    }
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {
    // React to signals from other agents that might need financial correlation
    if (_signal.domain === 'security' && _signal.signalType === 'after_hours_access') {
      // Check if this user also has financial override activity
      await this.checkCorrelatedFinancialActivity(_signal.subjectId);
    }
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'force_sync') {
      await this.onHeartbeat();
    }

    if (message.type === 'analyze_subject') {
      const subjectId = message.payload['subjectId'] as string;
      if (subjectId) {
        await this.deepAnalyzeSubject(subjectId);
      }
    }
  }

  protected async onShutdown(): Promise<void> {
    // Persist sync timestamps
    for (const [key, timestamp] of this.lastSyncTimestamps) {
      await prisma.learningState.upsert({
        where: {
          tenantId_learningType_key: {
            tenantId: this.context.tenantId,
            learningType: 'sync_timestamp',
            key,
          },
        },
        update: { state: { lastSync: timestamp.toISOString() } },
        create: {
          tenantId: this.context.tenantId,
          learningType: 'sync_timestamp',
          key,
          state: { lastSync: timestamp.toISOString() },
        },
      });
    }
    this.logger.info('Finance Collector shut down');
  }

  // ─── Data Collection ──────────────────────────────────────

  private async syncDataSource(integration: {
    id: string;
    provider: string;
    config: unknown;
    credentials: unknown;
  }): Promise<void> {
    const lastSync = this.lastSyncTimestamps.get(`finance_${integration.provider}`) ??
      new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.logger.debug({ provider: integration.provider, lastSync }, 'Syncing finance data');

    const config = integration.config as {
      baseUrl: string;
      endpoints: Record<string, string>;
    };

    // Fetch transaction overrides
    if (config.endpoints['overrides']) {
      const overrides = await this.fetchFromAPI(
        config.baseUrl,
        config.endpoints['overrides'],
        integration.credentials,
        lastSync,
      );
      await this.processOverrides(overrides);
    }

    // Fetch large transactions
    if (config.endpoints['transactions']) {
      const transactions = await this.fetchFromAPI(
        config.baseUrl,
        config.endpoints['transactions'],
        integration.credentials,
        lastSync,
      );
      await this.processTransactions(transactions);
    }

    // Fetch expense reports
    if (config.endpoints['expenses']) {
      const expenses = await this.fetchFromAPI(
        config.baseUrl,
        config.endpoints['expenses'],
        integration.credentials,
        lastSync,
      );
      await this.processExpenses(expenses);
    }

    this.lastSyncTimestamps.set(`finance_${integration.provider}`, new Date());
  }

  private async fetchFromAPI(
    baseUrl: string,
    endpoint: string,
    credentials: unknown,
    since: Date,
  ): Promise<Record<string, unknown>[]> {
    try {
      const creds = credentials as { apiKey?: string; token?: string };
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (creds.apiKey) headers['X-API-Key'] = creds.apiKey;
      if (creds.token) headers['Authorization'] = `Bearer ${creds.token}`;

      const url = `${baseUrl}${endpoint}?since=${since.toISOString()}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : (data as { items: Record<string, unknown>[] }).items ?? [];
    } catch (error) {
      this.logger.error({ error, baseUrl, endpoint }, 'API fetch failed');
      return [];
    }
  }

  // ─── Signal Processing ────────────────────────────────────

  private async processOverrides(overrides: Record<string, unknown>[]): Promise<void> {
    for (const override of overrides) {
      const signal: NormalizedSignalEvent = {
        signalId: `ovr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tenantId: this.context.tenantId,
        domain: 'finance',
        signalType: 'override_transaction',
        subjectType: 'employee',
        subjectId: String(override['userId'] ?? override['employeeId'] ?? 'unknown'),
        sourceSystem: 'core_banking',
        value: Number(override['amount'] ?? 0),
        metadata: {
          transactionId: override['transactionId'],
          overrideType: override['overrideType'],
          originalApprover: override['originalApprover'],
          supervisorPresent: override['supervisorPresent'] ?? false,
          timestamp: override['timestamp'],
          role: override['role'] ?? override['jobTitle'],
        },
        timestamp: new Date(String(override['timestamp'] ?? Date.now())),
      };

      // Store signal
      await prisma.signal.create({
        data: {
          tenantId: signal.tenantId,
          domain: signal.domain,
          signalType: signal.signalType,
          subjectType: signal.subjectType,
          subjectId: signal.subjectId,
          sourceSystem: signal.sourceSystem,
          value: signal.value,
          metadata: signal.metadata,
          timestamp: signal.timestamp,
          normalizedAt: new Date(),
        },
      });

      // Emit to fusion engine
      await this.emitSignal(signal);
    }

    if (overrides.length > 0) {
      this.logger.info({ count: overrides.length }, 'Processed override transactions');
    }
  }

  private async processTransactions(transactions: Record<string, unknown>[]): Promise<void> {
    for (const tx of transactions) {
      const amount = Number(tx['amount'] ?? 0);

      // Only emit signals for unusual transactions
      const isUnusual = amount > 5000 ||
        String(tx['type']).includes('wire') ||
        Boolean(tx['isOverride']);

      if (!isUnusual) continue;

      let signalType = 'unusual_amount';
      if (Boolean(tx['newPayee'])) signalType = 'new_payee';
      if (Boolean(tx['isOverride'])) signalType = 'override_transaction';
      if (amount > 0 && amount < 10000 && amount > 8500) signalType = 'unusual_amount'; // Potential structuring

      const signal: NormalizedSignalEvent = {
        signalId: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tenantId: this.context.tenantId,
        domain: 'finance',
        signalType,
        subjectType: 'employee',
        subjectId: String(tx['userId'] ?? tx['initiatedBy'] ?? 'unknown'),
        sourceSystem: 'core_banking',
        value: amount,
        metadata: {
          transactionId: tx['id'],
          type: tx['type'],
          recipient: tx['recipient'],
          newPayee: tx['newPayee'],
          approvedBy: tx['approvedBy'],
          role: tx['role'],
        },
        timestamp: new Date(String(tx['timestamp'] ?? Date.now())),
      };

      await prisma.signal.create({
        data: {
          tenantId: signal.tenantId,
          domain: signal.domain,
          signalType: signal.signalType,
          subjectType: signal.subjectType,
          subjectId: signal.subjectId,
          sourceSystem: signal.sourceSystem,
          value: signal.value,
          metadata: signal.metadata,
          timestamp: signal.timestamp,
          normalizedAt: new Date(),
        },
      });

      await this.emitSignal(signal);
    }
  }

  private async processExpenses(expenses: Record<string, unknown>[]): Promise<void> {
    for (const expense of expenses) {
      const amount = Number(expense['amount'] ?? 0);
      const submittedDate = new Date(String(expense['submittedDate'] ?? Date.now()));
      const isWeekend = submittedDate.getDay() === 0 || submittedDate.getDay() === 6;
      const isRoundNumber = amount % 100 === 0;

      // Only flag anomalous expenses
      if (!isWeekend && !isRoundNumber && amount < 1000) continue;

      const signal: NormalizedSignalEvent = {
        signalId: `exp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tenantId: this.context.tenantId,
        domain: 'finance',
        signalType: 'expense_anomaly',
        subjectType: 'employee',
        subjectId: String(expense['userId'] ?? 'unknown'),
        sourceSystem: 'erp',
        value: amount,
        metadata: {
          expenseId: expense['id'],
          category: expense['category'],
          description: expense['description'],
          submittedOnWeekend: isWeekend,
          isRoundNumber,
          approvalThreshold: expense['approvalThreshold'],
          role: expense['role'],
        },
        timestamp: submittedDate,
      };

      await prisma.signal.create({
        data: {
          tenantId: signal.tenantId,
          domain: signal.domain,
          signalType: signal.signalType,
          subjectType: signal.subjectType,
          subjectId: signal.subjectId,
          sourceSystem: signal.sourceSystem,
          value: signal.value,
          metadata: signal.metadata,
          timestamp: signal.timestamp,
          normalizedAt: new Date(),
        },
      });

      await this.emitSignal(signal);
    }
  }

  // ─── Deep Analysis ────────────────────────────────────────

  private async checkCorrelatedFinancialActivity(subjectId: string): Promise<void> {
    const recentFinanceSignals = await prisma.signal.findMany({
      where: {
        tenantId: this.context.tenantId,
        domain: 'finance',
        subjectId,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (recentFinanceSignals.length > 0) {
      this.logger.info(
        { subjectId, signalCount: recentFinanceSignals.length },
        'Cross-domain correlation: after-hours access + financial activity detected',
      );

      // Notify fusion agent
      await this.sendMessage('fusion-agent', 'cross_domain_correlation', {
        subjectId,
        domains: ['security', 'finance'],
        securitySignal: 'after_hours_access',
        financialSignals: recentFinanceSignals.map((s) => ({
          type: s.signalType,
          value: s.value,
          timestamp: s.timestamp.toISOString(),
        })),
      });
    }
  }

  private async deepAnalyzeSubject(subjectId: string): Promise<void> {
    const signals = await prisma.signal.findMany({
      where: {
        tenantId: this.context.tenantId,
        domain: 'finance',
        subjectId,
        timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (signals.length < 3) return;

    // Use AI with Transaction Forensics skill for deep analysis
    const analysisPrompt = `Analyze the following financial signals for subject ${subjectId} over the past 90 days using your Transaction Forensics expertise:

${signals.map((s, i) => `${i + 1}. [${s.timestamp.toISOString()}] ${s.signalType}: value=${s.value}, source=${s.sourceSystem}`).join('\n')}

Apply:
1. Benford's Law analysis on transaction amounts
2. Structuring detection (look for just-below-threshold patterns)
3. Override pattern analysis (temporal clustering, supervisor absence)
4. Velocity analysis (rate of change in transaction frequency)
5. Network analysis if payee data is available

Return your assessment with confidence score and recommended actions.`;

    const analysis = await this.reason(
      analysisPrompt,
      'You are using the Transaction Forensics Expert skill. Apply CFE/CAMS-level analysis.',
      { requireReasoning: true, maxTokens: 2048 },
    );

    this.logger.info(
      { subjectId, signalCount: signals.length },
      'Deep financial analysis complete',
    );

    // Send analysis to reasoning agent for evidence brief compilation
    await this.sendMessage('reasoning-agent', 'analysis_complete', {
      subjectId,
      domain: 'finance',
      signalCount: signals.length,
      analysis: analysis.content,
      reasoning: analysis.reasoning,
      tier: analysis.tier,
    });
  }
}
