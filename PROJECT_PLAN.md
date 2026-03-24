# RiskRadar — Project Plan & Progress Tracker
## Last Updated: March 24, 2026

---

## Phase 1: Foundation (COMPLETE)

### 1.1 Monorepo Scaffold — DONE
- [x] Turborepo + pnpm workspaces
- [x] TypeScript strict configs (base, node, nextjs)
- [x] ESLint, Prettier, commitlint, Husky
- [x] .env.example with all variables documented
- [x] .gitignore, .vscode settings

### 1.2 Shared Packages — DONE
- [x] @riskradar/shared: 30+ type files, Zod schemas, constants, utilities
- [x] @riskradar/logger: Pino structured logging with PII redaction
- [x] @riskradar/queue: BullMQ queues (10 queue types)
- [x] @riskradar/tsconfig: Shared TypeScript configs

### 1.3 Database — DONE
- [x] Prisma schema: 16 models (Tenant, User, Role, RefreshToken, Alert, AlertSignal, Case, CaseComment, Evidence, Policy, Integration, AuditLog, RiskScore, Signal, LearningState, DigitalTwin, AlertFeedback, RegulatoryRule, SarDraft)
- [x] Multi-tenant design (every query scoped by tenantId)
- [x] TimescaleDB init SQL (hypertable, continuous aggregates, retention)
- [x] Immutable audit log trigger
- [x] Seed script (demo tenant, roles, admin user, regulatory rules)

### 1.4 Infrastructure — DONE
- [x] Docker Compose (TimescaleDB + Redis + pgAdmin)
- [x] GitHub Actions CI (quality + test + build)

---

## Phase 2: Backend API (COMPLETE)

### 2.1 API Service Foundation — DONE
- [x] Fastify 5 with production plugins (CORS, Helmet, rate-limit, JWT, Swagger)
- [x] Custom error hierarchy (AppError → NotFound, Validation, Unauthorized, etc.)
- [x] Request context (AsyncLocalStorage)
- [x] Audit trail middleware
- [x] Env validation (Zod)
- [x] Graceful shutdown

### 2.2 Route Modules (8/8 DONE)
- [x] Alerts: list, get, update status (state machine), assign, escalate, stats
- [x] Cases: CRUD, comments, SLA tracking, stats
- [x] Signals: batch ingestion, query, time-series stats
- [x] Risk Scores: list, heatmap, subject profiles with trajectory
- [x] Policies: version-controlled CRUD, approve, deactivate
- [x] Integrations: CRUD, test connection, trigger sync, AES-256-GCM credential encryption
- [x] Users: CRUD, authentication (timing-safe password verify), JWT, RBAC
- [x] Audit Logs: read-only query, export for regulatory examination

---

## Phase 3: AI Agent Service (COMPLETE)

### 3.1 Core Infrastructure — DONE
- [x] 3-tier model router (Super → Cascade-2 → Cloud fallback with caching)
- [x] BaseAgent abstract class (lifecycle, signals, messaging, reasoning)
- [x] AgentBus (Redis Pub/Sub, typed events)
- [x] Skill registry system

### 3.2 AI Engines (5/5 DONE)
- [x] FusionEngine: cross-domain correlation, temporal clustering, compound scoring, AI reasoning
- [x] AutoLearningEngine: threshold adjustment, pattern discovery, FP analysis, digital twin calibration, model drift detection, seasonal adjustment
- [x] TrajectoryEngine: linear regression, projected breach dates, intervention recommendations
- [x] NaturalLanguagePolicyBuilder: plain English → structured rules via Cascade-2
- [x] SARGenerator: FinCEN-format narrative, evidence citations, regulatory references

### 3.3 Expert Skills (7/7 DONE)
- [x] Transaction Forensics (CFE/CAMS-level): Benford's Law, structuring, override analysis
- [x] Insider Threat Detection (CERT/CC + MITRE ATT&CK): kill chain staging, exfiltration, UEBA
- [x] Workforce Behavioral Analytics (I/O Psychology PhD): flight risk, burnout (Maslach), engagement
- [x] Regulatory Watchdog (CCO + JD/LLM): impact assessment, gap analysis, deadline tracking
- [x] Operational Risk Intelligence (CRO + SRE): SLA prediction, capacity, incidents
- [x] Communications Intelligence (Computational Social Scientist): metadata patterns, network topology
- [x] Digital Forensics (CCE + CISA + CFF): evidence chains, SAR narratives

### 3.4 Collection Agents (5/5 DONE)
- [x] Finance Collector: core banking, ERP, payroll API integration
- [x] Security Collector: SIEM, IAM, endpoint detection integration
- [x] HR Collector: HRIS, attendance, training, performance integration
- [x] Operations Collector: Jira, GitHub, PagerDuty integration
- [x] Communications Collector: M365, Slack, Google Workspace METADATA-only integration

### 3.5 Analysis Agents (2/4 DONE)
- [x] Regulatory Watchdog: scans 12 sources every 6h, auto-impact assessment, gap analysis
- [x] Fusion Engine (runs as engine, not standalone agent)
- [ ] Reasoning Agent: standalone deep analysis agent using Cascade-2
- [ ] Bias Check Agent: fairness monitoring implementation

### 3.6 Response Agents (2/3 DONE)
- [x] Alert Router: auto-assignment (load-balanced), SLA monitoring, severity escalation
- [x] Notification Agent: Slack, Teams, Email, SMS with dedup + rate limiting
- [ ] Case Manager Agent: automated case lifecycle management

### 3.7 NemoClaw Policies (4 DONE)
- [x] finance-collector.policy.yaml
- [x] security-collector.policy.yaml
- [x] regulatory-watchdog.policy.yaml
- [x] fusion-agent.policy.yaml
- [ ] hr-collector.policy.yaml
- [ ] ops-collector.policy.yaml
- [ ] comms-collector.policy.yaml
- [ ] alert-router.policy.yaml
- [ ] notification-agent.policy.yaml

---

## Phase 4: Dashboard (IN PROGRESS)

### 4.1 App Dashboard Pages (9/9 DONE)
- [x] Overview: KPI cards, risk distribution, domain signals
- [x] Alerts List: filterable table, severity/status badges
- [x] Alert Detail: 5-tab evidence brief (Evidence, Reasoning, Regulatory, Actions, Timeline)
- [x] Cases List: SLA tracking, priority/status, stats
- [x] Case Detail: investigation timeline, comments, linked alerts sidebar
- [x] Risk Scores: distribution, trajectory indicators, domain breakdown
- [x] Signals: live feed, domain stats, color-coded table
- [x] Policies: NL-generated display, version tracking, approval workflow
- [x] Integrations: health cards, test/sync buttons
- [x] Agent Status: 11 agents with model tier, CPU/memory, heartbeat
- [x] Audit Log: immutable log viewer, actor types, export

### 4.2 Marketing & Public Pages — NOT STARTED
- [ ] Landing page (hero, features, social proof, CTA)
- [ ] Pricing page (3 tiers: Starter $2-5K, Professional $8-15K, Enterprise $20-50K)
- [ ] Product tour / feature showcase
- [ ] About / Company page
- [ ] Contact / Demo request form
- [ ] Blog structure (for SEO + thought leadership)
- [ ] Legal pages (Terms of Service, Privacy Policy, DPA)

### 4.3 Onboarding & User Journey — NOT STARTED
- [ ] Signup page (tenant creation: name, industry, slug)
- [ ] Onboarding wizard Step 1: Company profile + regulatory frameworks
- [ ] Onboarding wizard Step 2: Connect first integration
- [ ] Onboarding wizard Step 3: Configure alert thresholds
- [ ] Onboarding wizard Step 4: Invite team members + assign roles
- [ ] Onboarding wizard Step 5: First signal ingestion + first alert demo
- [ ] Welcome dashboard (guided tour of key features)
- [ ] Empty states for all pages (guidance when no data yet)

### 4.4 Auth Pages — NOT STARTED
- [ ] Login page (email + password + MFA)
- [ ] Signup / Register page
- [ ] Forgot password flow
- [ ] MFA setup flow
- [ ] Session management (JWT refresh, auto-logout)

### 4.5 Settings Pages — NOT STARTED
- [ ] Tenant settings (name, industry, timezone, data retention, anonymization level)
- [ ] User management (invite, roles, permissions, deactivate)
- [ ] Role management (custom roles, permission assignment)
- [ ] Notification preferences (per-channel, per-severity)
- [ ] Alert threshold configuration
- [ ] Integration management (detailed config UI)
- [ ] API key management (for programmatic access)
- [ ] Billing / Subscription management

### 4.6 Advanced Feature UIs — NOT STARTED
- [ ] Natural language policy builder (input form → AI preview → confirm → activate)
- [ ] SAR draft review/edit/approve interface
- [ ] Risk trajectory chart (recharts line chart with projection + breach date)
- [ ] Risk score detail page (per-subject deep dive)
- [ ] Regulatory compliance dashboard (coverage %, gap list, deadline tracker)
- [ ] Regulator portal (read-only examination view, separate auth)
- [ ] Digital twin comparison view (individual vs. role archetype)
- [ ] Bias monitoring dashboard (fairness metrics, demographic analysis)

---

## Phase 5: Payments & Billing — NOT STARTED

### 5.1 Stripe Integration
- [ ] Stripe product/price creation (3 tiers)
- [ ] Checkout session for new subscriptions
- [ ] Stripe webhook handlers (subscription.created, invoice.paid, invoice.failed, subscription.cancelled)
- [ ] Customer portal for self-service billing management
- [ ] Usage-based metering (signals ingested, agents active)
- [ ] Trial period support (14-day free trial)
- [ ] Upgrade/downgrade flow
- [ ] Invoice generation

### 5.2 Billing UI
- [ ] Pricing page with Stripe checkout integration
- [ ] Current plan display in settings
- [ ] Usage dashboard (signals, agents, storage)
- [ ] Billing history / invoices

---

## Phase 6: Testing — IN PROGRESS (20%)

### 6.1 Unit Tests (3/20+ needed)
- [x] AlertService tests (5 cases)
- [x] FusionEngine tests (compound detection, domain diversity, AI triggering)
- [x] AutoLearningEngine tests (feedback, patterns, drift)
- [ ] CaseService tests
- [ ] SignalService tests
- [ ] PolicyService tests
- [ ] RiskScoreService tests
- [ ] IntegrationService tests
- [ ] UserService tests (including auth)
- [ ] ModelRouter tests
- [ ] TrajectoryEngine tests
- [ ] BaseAgent lifecycle tests
- [ ] AgentBus messaging tests
- [ ] Error handler tests
- [ ] Pagination utility tests
- [ ] Zod schema validation tests

### 6.2 API Integration Tests — NOT STARTED
- [ ] Auth flow (login → token → protected route → refresh → logout)
- [ ] Alert lifecycle (create → review → confirm → escalate to case)
- [ ] Case workflow (create → investigate → add comment → generate SAR → close)
- [ ] Signal ingestion pipeline (batch ingest → verify in DB → verify queue)
- [ ] Policy CRUD with version control
- [ ] Integration test/sync flow
- [ ] Audit log verification (every action logged)
- [ ] RBAC enforcement (analyst can't access admin routes)
- [ ] Multi-tenant isolation (tenant A can't see tenant B data)
- [ ] Rate limiting verification

### 6.3 E2E Tests (Playwright) — NOT STARTED
- [ ] Login → Dashboard → View Alerts
- [ ] Alert review workflow (click alert → review evidence → confirm/dismiss)
- [ ] Case escalation flow (alert → escalate → case detail → add comment)
- [ ] Policy creation (both manual and NL builder)
- [ ] Integration setup wizard
- [ ] Settings modification
- [ ] Onboarding wizard completion
- [ ] Pricing → Checkout flow

### 6.4 Performance / Load Tests — NOT STARTED
- [ ] Signal ingestion throughput (target: 10K signals/minute)
- [ ] Concurrent alert processing
- [ ] Dashboard page load times (<2s)
- [ ] Model inference latency benchmarks
- [ ] Database query performance with 1M+ signals

### 6.5 Security Tests — NOT STARTED
- [ ] Auth bypass attempts
- [ ] SQL injection (Prisma parameterized, but verify)
- [ ] XSS in dashboard inputs
- [ ] CSRF protection
- [ ] JWT tampering
- [ ] Privilege escalation (role manipulation)
- [ ] Credential encryption verification
- [ ] Rate limit bypass attempts

---

## Phase 7: Deployment — NOT STARTED

### 7.1 Railway Configuration
- [ ] railway.toml for API service
- [ ] railway.toml for Web (Next.js)
- [ ] PostgreSQL (TimescaleDB) provision
- [ ] Redis provision
- [ ] Environment variables configuration
- [ ] Custom domain setup (api.riskradar.io, app.riskradar.io)
- [ ] SSL certificates

### 7.2 GPU Infrastructure (Agent Service)
- [ ] Evaluate GPU hosting (Lambda Cloud, RunPod, Vast.ai, on-prem)
- [ ] NemoClaw installation and configuration
- [ ] Nemotron model download and deployment
- [ ] Agent service deployment
- [ ] Monitoring and auto-restart setup

### 7.3 CI/CD Pipeline
- [x] GitHub Actions CI (lint, type-check, test, build)
- [ ] Staging environment deployment
- [ ] Production deployment pipeline
- [ ] Database migration automation
- [ ] Rollback procedures
- [ ] Health check monitoring

### 7.4 Observability
- [ ] OpenTelemetry instrumentation (traces, metrics)
- [ ] Log aggregation (Grafana Loki or similar)
- [ ] Uptime monitoring (Betteruptime, Checkly)
- [ ] Error tracking (Sentry)
- [ ] Agent performance dashboards

---

## Phase 8: AIGovHub Integration — NOT STARTED

### 8.1 Shared Auth Bridge
- [ ] SSO from AIGovHub to RiskRadar (shared JWT or OAuth2)
- [ ] Unified user account across platforms
- [ ] Role mapping (AIGovHub roles → RiskRadar roles)

### 8.2 Shared Billing
- [ ] RiskRadar as add-on tier in AIGovHub Stripe account
- [ ] Unified customer portal
- [ ] Cross-platform usage metering

### 8.3 Data Integration
- [ ] API bridge for AIGovHub compliance data → RiskRadar signals
- [ ] RiskRadar alerts → AIGovHub governance dashboard
- [ ] Shared regulatory knowledge base

---

## Phase 9: Post-Launch Enhancements — NOT STARTED

### 9.1 Features 14-18 (from Design Doc)
- [ ] Feature 14: Bias & Fairness Monitoring (implementation)
- [ ] Feature 15: Multi-Tenant MSP Architecture (admin UI, white-labeling)
- [ ] Feature 16: Regulator Audit Portal (read-only, separate auth)
- [ ] Feature 17: AI Agent Risk Monitoring (monitoring AI agents for rogue behavior)
- [ ] Feature 18: Risk-Adaptive Access Controls (IAM integration, auto-restrict)

### 9.2 Advanced UX
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Real-time WebSocket updates (live signal feed, alert notifications)
- [ ] Keyboard shortcuts for analysts
- [ ] Bulk alert operations
- [ ] Saved filters / custom views
- [ ] Exportable reports (PDF, CSV)

### 9.3 Additional Integrations
- [ ] ServiceNow connector
- [ ] Zendesk connector
- [ ] CyberArk connector
- [ ] Custom webhook framework
- [ ] MCP server for RiskRadar (so other OpenClaw agents can query it)

---

## Progress Summary

| Phase | Status | Completion |
|---|---|---|
| Phase 1: Foundation | **COMPLETE** | 100% |
| Phase 2: Backend API | **COMPLETE** | 100% |
| Phase 3: AI Agent Service | **MOSTLY COMPLETE** | 90% |
| Phase 4: Dashboard | **IN PROGRESS** | 45% (app pages done, marketing/auth/settings pending) |
| Phase 5: Payments & Billing | **NOT STARTED** | 0% |
| Phase 6: Testing | **IN PROGRESS** | 20% |
| Phase 7: Deployment | **NOT STARTED** | 5% (CI done) |
| Phase 8: AIGovHub Integration | **NOT STARTED** | 0% |
| Phase 9: Post-Launch | **NOT STARTED** | 0% |

### Overall Project: ~55% Complete

### Critical Path to First Paying Customer:
1. Auth pages + Stripe (Phase 4.4 + 5.1)
2. Marketing landing + pricing (Phase 4.2)
3. Onboarding wizard (Phase 4.3)
4. API integration tests (Phase 6.2)
5. Railway deployment (Phase 7.1)
6. First pilot customer deployment
