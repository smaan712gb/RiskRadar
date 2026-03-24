-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'analyst',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "compoundScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "falsePositiveLikelihood" TEXT NOT NULL DEFAULT 'medium',
    "domains" TEXT[],
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "dismissReason" TEXT,
    "caseId" TEXT,
    "evidenceBrief" JSONB,
    "regulatoryMapping" JSONB NOT NULL DEFAULT '[]',
    "modelVersion" TEXT NOT NULL,
    "reasoningModelUsed" TEXT NOT NULL,
    "processingTimeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_signals" (
    "alertId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,

    CONSTRAINT "alert_signals_pkey" PRIMARY KEY ("alertId","signalId")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "slaDeadline" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_comments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "alertId" TEXT,
    "caseId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "sourceId" TEXT,
    "dataSnapshot" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "naturalLanguage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "regulatoryRef" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "integrationType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "syncSchedule" TEXT,
    "healthCheckUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_scores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "domainScores" JSONB NOT NULL,
    "trajectory" TEXT NOT NULL DEFAULT 'new',
    "trendData" JSONB,
    "modelVersion" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL,
    "normalizedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_states" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learningType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "learning_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_twins" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleArchetype" TEXT NOT NULL,
    "department" TEXT,
    "baselineData" JSONB NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "digital_twins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "domains" TEXT[],
    "compoundScore" DOUBLE PRECISION NOT NULL,
    "outcome" TEXT NOT NULL,
    "feedbackBy" TEXT NOT NULL,
    "feedbackAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "alert_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_rules" (
    "id" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "signalMappings" JSONB NOT NULL,
    "industries" TEXT[],
    "jurisdictions" TEXT[],
    "effectiveDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sar_drafts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "alertIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "narrative" TEXT NOT NULL,
    "subjectInfo" JSONB NOT NULL,
    "activityDescription" TEXT NOT NULL,
    "timeline" JSONB NOT NULL,
    "evidenceCitations" JSONB NOT NULL,
    "regulatoryRefs" JSONB NOT NULL,
    "filingDeadline" TIMESTAMP(3),
    "generatedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sar_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenantId_isActive_idx" ON "users"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_name_key" ON "roles"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "alerts_tenantId_status_idx" ON "alerts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "alerts_tenantId_severity_idx" ON "alerts"("tenantId", "severity");

-- CreateIndex
CREATE INDEX "alerts_tenantId_subjectId_idx" ON "alerts"("tenantId", "subjectId");

-- CreateIndex
CREATE INDEX "alerts_tenantId_createdAt_idx" ON "alerts"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "alerts_tenantId_assignedTo_idx" ON "alerts"("tenantId", "assignedTo");

-- CreateIndex
CREATE INDEX "alerts_tenantId_alertType_idx" ON "alerts"("tenantId", "alertType");

-- CreateIndex
CREATE INDEX "cases_tenantId_status_idx" ON "cases"("tenantId", "status");

-- CreateIndex
CREATE INDEX "cases_tenantId_priority_idx" ON "cases"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "cases_tenantId_assignedTo_idx" ON "cases"("tenantId", "assignedTo");

-- CreateIndex
CREATE INDEX "cases_tenantId_createdAt_idx" ON "cases"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "case_comments_caseId_createdAt_idx" ON "case_comments"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "evidence_tenantId_alertId_idx" ON "evidence"("tenantId", "alertId");

-- CreateIndex
CREATE INDEX "evidence_tenantId_caseId_idx" ON "evidence"("tenantId", "caseId");

-- CreateIndex
CREATE INDEX "policies_tenantId_isActive_idx" ON "policies"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "policies_tenantId_domain_idx" ON "policies"("tenantId", "domain");

-- CreateIndex
CREATE INDEX "policies_tenantId_policyType_idx" ON "policies"("tenantId", "policyType");

-- CreateIndex
CREATE INDEX "integrations_tenantId_status_idx" ON "integrations"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_tenantId_provider_key" ON "integrations"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_timestamp_idx" ON "audit_logs"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_resource_resourceId_idx" ON "audit_logs"("tenantId", "resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_actorId_idx" ON "audit_logs"("tenantId", "actorId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "risk_scores_tenantId_subjectType_subjectId_idx" ON "risk_scores"("tenantId", "subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "risk_scores_tenantId_calculatedAt_idx" ON "risk_scores"("tenantId", "calculatedAt");

-- CreateIndex
CREATE INDEX "risk_scores_tenantId_overallScore_idx" ON "risk_scores"("tenantId", "overallScore");

-- CreateIndex
CREATE INDEX "signals_tenantId_domain_timestamp_idx" ON "signals"("tenantId", "domain", "timestamp");

-- CreateIndex
CREATE INDEX "signals_tenantId_subjectId_timestamp_idx" ON "signals"("tenantId", "subjectId", "timestamp");

-- CreateIndex
CREATE INDEX "signals_tenantId_signalType_timestamp_idx" ON "signals"("tenantId", "signalType", "timestamp");

-- CreateIndex
CREATE INDEX "learning_states_tenantId_learningType_idx" ON "learning_states"("tenantId", "learningType");

-- CreateIndex
CREATE UNIQUE INDEX "learning_states_tenantId_learningType_key_key" ON "learning_states"("tenantId", "learningType", "key");

-- CreateIndex
CREATE INDEX "digital_twins_tenantId_roleArchetype_idx" ON "digital_twins"("tenantId", "roleArchetype");

-- CreateIndex
CREATE UNIQUE INDEX "digital_twins_tenantId_roleArchetype_department_key" ON "digital_twins"("tenantId", "roleArchetype", "department");

-- CreateIndex
CREATE INDEX "alert_feedback_tenantId_alertType_outcome_idx" ON "alert_feedback"("tenantId", "alertType", "outcome");

-- CreateIndex
CREATE INDEX "alert_feedback_tenantId_feedbackAt_idx" ON "alert_feedback"("tenantId", "feedbackAt");

-- CreateIndex
CREATE INDEX "regulatory_rules_framework_section_idx" ON "regulatory_rules"("framework", "section");

-- CreateIndex
CREATE INDEX "regulatory_rules_isActive_idx" ON "regulatory_rules"("isActive");

-- CreateIndex
CREATE INDEX "sar_drafts_tenantId_status_idx" ON "sar_drafts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "sar_drafts_tenantId_caseId_idx" ON "sar_drafts"("tenantId", "caseId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_signals" ADD CONSTRAINT "alert_signals_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
