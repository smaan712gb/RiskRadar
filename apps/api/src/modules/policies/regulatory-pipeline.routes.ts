import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@riskradar/database';

/**
 * Regulatory Pipeline API
 *
 * CIO/CCO workflow for reviewing and approving auto-generated policy proposals
 * triggered by the Regulatory Watchdog agent.
 *
 * Flow: Watchdog detects → AI proposes → CIO reviews here → Approve/Reject → Auto-deploy
 */
export async function regulatoryPipelineRoutes(app: FastifyInstance): Promise<void> {

  // List all pending regulatory proposals for review
  app.get('/regulatory/proposals', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const proposals = await prisma.learningState.findMany({
      where: { tenantId: user.tenantId, learningType: 'regulatory_proposal' },
      orderBy: { lastUpdatedAt: 'desc' },
    });

    const formatted = proposals.map((p) => {
      const state = p.state as any;
      return {
        id: p.key,
        status: state.status,
        impactSummary: state.impactSummary,
        policyCount: state.proposedPolicies?.length ?? 0,
        thresholdChanges: state.thresholdChanges?.length ?? 0,
        newSignalTypes: state.newSignalTypes?.length ?? 0,
        urgency: state.urgency,
        proposedAt: state.proposedAt,
        reviewedBy: state.reviewedBy,
        reviewedAt: state.reviewedAt,
        deployedAt: state.deployedAt,
      };
    });

    return reply.send({ success: true, data: formatted });
  });

  // Get proposal detail (for CIO review)
  app.get('/regulatory/proposals/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const proposal = await prisma.learningState.findFirst({
      where: { tenantId: user.tenantId, learningType: 'regulatory_proposal', key: id },
    });

    if (!proposal) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Proposal not found' } });
    }

    return reply.send({ success: true, data: proposal.state });
  });

  // CIO approves a proposal — triggers auto-test and auto-deploy
  app.post('/regulatory/proposals/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const proposal = await prisma.learningState.findFirst({
      where: { tenantId: user.tenantId, learningType: 'regulatory_proposal', key: id },
    });

    if (!proposal) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Proposal not found' } });
    }

    const state = proposal.state as any;
    if (state.status !== 'proposed') {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_STATE', message: `Cannot approve proposal in ${state.status} status` },
      });
    }

    // Execute: test → deploy
    const testResults: Array<{ name: string; passed: boolean; details: string }> = [];

    // Validate each proposed policy
    for (const policy of (state.proposedPolicies ?? [])) {
      const rules = policy.rules;
      const hasConditions = rules?.conditions?.length > 0;
      const hasActions = rules?.actions?.length > 0;

      testResults.push({
        name: `Structure: ${policy.policyName}`,
        passed: hasConditions && hasActions,
        details: hasConditions && hasActions ? 'Valid' : 'Missing conditions or actions',
      });
    }

    const allPassed = testResults.every((r) => r.passed);

    if (allPassed) {
      // Deploy policies
      for (const policy of (state.proposedPolicies ?? [])) {
        if (policy.action === 'create') {
          await prisma.policy.create({
            data: {
              tenantId: user.tenantId,
              name: policy.policyName,
              description: policy.description,
              policyType: 'monitoring_rule',
              domain: policy.domain,
              rules: policy.rules as any,
              naturalLanguage: policy.naturalLanguage ?? null,
              regulatoryRef: policy.regulatoryRef ?? null,
              createdBy: user.id,
              approvedBy: user.id,
              approvedAt: new Date(),
              isActive: true,
            },
          });
        }
      }

      state.status = 'deployed';
      state.deployedAt = new Date().toISOString();
    } else {
      state.status = 'rejected';
    }

    state.reviewedBy = user.id;
    state.reviewedAt = new Date().toISOString();

    await prisma.learningState.updateMany({
      where: { tenantId: user.tenantId, learningType: 'regulatory_proposal', key: id },
      data: { state: state as any, lastUpdatedAt: new Date() },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        actorType: 'user',
        actorId: user.id,
        action: `regulatory_proposal.${state.status}`,
        resource: 'regulatory_proposal',
        resourceId: id,
        details: { testResults, policiesDeployed: allPassed ? state.proposedPolicies.length : 0 } as any,
      },
    });

    return reply.send({
      success: true,
      data: {
        status: state.status,
        testResults,
        policiesDeployed: allPassed ? state.proposedPolicies.length : 0,
      },
    });
  });

  // CIO rejects a proposal
  app.post('/regulatory/proposals/:id/reject', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const { reason } = (request.body as { reason?: string }) ?? {};

    const proposal = await prisma.learningState.findFirst({
      where: { tenantId: user.tenantId, learningType: 'regulatory_proposal', key: id },
    });

    if (!proposal) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Proposal not found' } });
    }

    const state = proposal.state as any;
    state.status = 'rejected';
    state.reviewedBy = user.id;
    state.reviewedAt = new Date().toISOString();
    state.rejectionReason = reason;

    await prisma.learningState.updateMany({
      where: { tenantId: user.tenantId, learningType: 'regulatory_proposal', key: id },
      data: { state: state as any, lastUpdatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        actorType: 'user',
        actorId: user.id,
        action: 'regulatory_proposal.rejected',
        resource: 'regulatory_proposal',
        resourceId: id,
        details: { reason: reason ?? 'No reason provided' } as any,
      },
    });

    return reply.send({ success: true, data: { status: 'rejected' } });
  });
}
