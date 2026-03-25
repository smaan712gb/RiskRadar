import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';
import { TrajectoryEngine, type TrajectoryResult } from '../../engine/trajectory-engine.js';

/**
 * Trajectory Agent
 *
 * Wraps the TrajectoryEngine as a scheduled agent that:
 * 1. Periodically recalculates risk trajectories for all active subjects
 * 2. Identifies accelerating risk profiles
 * 3. Sends trajectory alerts when projected breach dates are imminent
 * 4. Provides intervention window recommendations to the alert router
 */
export class TrajectoryAgent extends BaseAgent {
  private engine!: TrajectoryEngine;

  static createConfig(): AgentConfig {
    return {
      id: 'trajectory-agent',
      name: 'Trajectory Engine',
      team: 'analysis',
      domain: undefined,
      schedule: '30m',
      modelTier: 'tier1_super',
      dataSources: ['risk_scores', 'signals'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.engine = new TrajectoryEngine();
    this.logger.info('Trajectory Agent initialized');
  }

  protected async onHeartbeat(): Promise<void> {
    this.logger.info('Running trajectory analysis cycle');

    // Get all subjects with recent risk scores
    const recentSubjects = await prisma.riskScore.findMany({
      where: {
        calculatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      distinct: ['tenantId', 'subjectType', 'subjectId'],
      select: { tenantId: true, subjectType: true, subjectId: true },
    });

    this.logger.info({ subjectCount: recentSubjects.length }, 'Analyzing trajectories');

    let alertCount = 0;

    for (const subject of recentSubjects) {
      try {
        const result = await this.engine.calculateTrajectory(
          subject.tenantId,
          subject.subjectType as any,
          subject.subjectId,
        );

        if (result.interventionRecommended) {
          await this.emitTrajectoryAlert(subject.tenantId, result);
          alertCount++;
        }
      } catch (error) {
        this.logger.error(
          { error, subjectId: subject.subjectId },
          'Failed to calculate trajectory',
        );
      }
    }

    this.logger.info(
      { processed: recentSubjects.length, alertsSent: alertCount },
      'Trajectory analysis cycle complete',
    );
  }

  protected async onSignal(signal: NormalizedSignalEvent): Promise<void> {
    // On high-value signals, immediately recalculate the subject's trajectory
    if (signal.value && signal.value >= 70) {
      this.logger.info(
        { subjectId: signal.subjectId, signalType: signal.signalType },
        'High-value signal received — recalculating trajectory',
      );

      const result = await this.engine.calculateTrajectory(
        signal.tenantId,
        signal.subjectType as any,
        signal.subjectId,
      );

      if (result.interventionRecommended) {
        await this.emitTrajectoryAlert(signal.tenantId, result);
      }
    }
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'calculate_trajectory') {
      const { tenantId, subjectType, subjectId } = message.payload as {
        tenantId: string;
        subjectType: string;
        subjectId: string;
      };

      const result = await this.engine.calculateTrajectory(tenantId, subjectType as any, subjectId);

      await this.sendMessage(message.fromAgentId, 'trajectory_result', {
        subjectId,
        ...result,
      });
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Trajectory Agent shutting down');
  }

  // ─── Private ──────────────────────────────────────────────

  private async emitTrajectoryAlert(tenantId: string, result: TrajectoryResult): Promise<void> {
    await this.sendMessage('alert-router', 'trajectory_alert', {
      tenantId,
      subjectId: result.subjectId,
      subjectType: result.subjectType,
      trajectory: result.trajectory,
      currentScore: result.currentScore,
      projectedScore: result.projectedScore,
      projectedBreachDate: result.projectedBreachDate,
      confidence: result.confidence,
      rateOfChange: result.rateOfChange,
      interventionRecommended: result.interventionRecommended,
    });

    this.logger.warn(
      {
        subjectId: result.subjectId,
        trajectory: result.trajectory,
        currentScore: result.currentScore,
        projectedBreachDate: result.projectedBreachDate,
      },
      'Trajectory alert sent to alert router',
    );
  }
}
