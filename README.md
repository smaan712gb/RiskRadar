# RiskRadar

**AI-driven organizational risk intelligence platform.**

Detects compound risk patterns across HR, finance, security, operations, and communications using on-premises reasoning AI with regulator-ready explainability.

## Why RiskRadar

| Problem | Competitors | RiskRadar |
|---|---|---|
| Single-domain | Each tool monitors one area | **Cross-domain fusion** across all signals |
| Cloud-only | Forced to send data off-premises | **Your infrastructure, your data** |
| Black-box AI | Opaque risk scores | **Evidence briefs with reasoning chains** |
| Months to deploy | 3-12 month implementations | **First alerts in days** |
| Enterprise-only pricing | $67K-$500K+/year | **Open-source core, free to self-host** |

## Deployment Options

RiskRadar gives clients full control over where their data lives:

| Mode | Description | GPU Required | Data Location |
|---|---|---|---|
| **Self-Hosted** | Everything on your hardware | Optional | 100% on-prem |
| **Private Cloud** | Your AWS/GCP/Azure account | Optional | Your VPC |
| **Managed SaaS** | We host it | No | Our infrastructure |
| **Hybrid** | Dashboard in cloud, AI on-prem | Yes (on-prem) | Data stays local |

### Quick Start (Self-Hosted)

```bash
# One-command installation
git clone https://github.com/smaan712gb/RiskRadar.git
cd RiskRadar/deploy/docker
cp .env.example .env        # Edit with your secrets
docker compose -f docker-compose.production.yml up -d

# With GPU (local AI inference)
docker compose -f docker-compose.production.yml --profile gpu up -d
```

### Quick Start (Development)

```bash
git clone https://github.com/smaan712gb/RiskRadar.git
cd RiskRadar
pnpm install
docker compose -f infrastructure/docker/docker-compose.yml up -d  # DB + Redis
pnpm db:generate && pnpm db:migrate dev --name init && pnpm db:seed
pnpm dev  # Starts API (3001), Web (3000), Agents
```

## AI Inference Modes

```
INFERENCE_MODE=local   → Full on-premises (Nemotron models, requires NVIDIA GPU)
INFERENCE_MODE=cloud   → Claude/GPT API (no GPU needed, data leaves network)
INFERENCE_MODE=hybrid  → Routine via cloud, deep reasoning stays local
```

All open-source models. No vendor lock-in:
- **Nemotron-3-Super-120B** (12B active) — Fast monitoring, 1M context
- **Nemotron-Cascade-2-30B** (3B active) — Deep reasoning, Gold Medal IMO/IOI/ICPC
- Cloud fallback: Claude, GPT, or any OpenAI-compatible API

## Architecture

```
apps/
├── api/        Fastify 5 backend (8 route modules, RBAC, audit trails)
├── agents/     OpenClaw agent service (12 agents, 7 expert skills, 5 AI engines)
└── web/        Next.js 15 dashboard (11 pages)

packages/
├── shared/     TypeScript types, Zod schemas, constants
├── database/   Prisma schema (16 models, multi-tenant, TimescaleDB)
├── logger/     Pino structured logging with PII redaction
└── queue/      BullMQ job queues (10 queue types)
```

### Agent Topology

```
Collection (5 agents)     Analysis (4 agents)       Response (3 agents)
├─ Finance Collector      ├─ Cross-Domain Fusion    ├─ Alert Router
├─ Security Collector     ├─ Regulatory Watchdog    ├─ Notification Agent
├─ HR Collector           ├─ Trajectory Engine      └─ SAR Generator
├─ Operations Collector   └─ Bias Check
└─ Communications Collector
```

### Expert Skills (OpenClaw SKILL.md format)

Each agent has PhD+ domain expertise:

| Skill | Expertise Level |
|---|---|
| Transaction Forensics | CFE + CAMS + Forensic Accountant |
| Insider Threat Detection | CERT/CC + MITRE ATT&CK + FBI |
| Workforce Behavioral Analytics | I/O Psychology PhD + Gallup |
| Regulatory Watchdog | Chief Compliance Officer + JD/LLM |
| Operational Risk Intelligence | CRO + SRE Principal |
| Communications Intelligence | Computational Social Scientist PhD |
| Digital Forensics | CCE + CISA + CFF |

## Key Features

- **Cross-domain risk fusion** — Correlates signals from HR, finance, security, ops, and comms
- **Evidence briefs** — AI-generated, regulator-ready explanations with source citations
- **Predictive trajectories** — Projects risk forward with breach date predictions
- **Auto-learning** — System improves from human feedback (threshold adjustment, pattern discovery, drift detection)
- **Natural language policies** — Describe monitoring rules in plain English
- **SAR draft generation** — Auto-generates FinCEN-format Suspicious Activity Reports
- **Regulatory watchdog** — Scans 12+ regulatory sources, auto-assesses impact
- **NemoClaw sandboxing** — Every agent runs in deny-by-default policy-controlled isolation
- **Immutable audit logs** — Every action recorded, exportable for regulatory examination
- **33 signal types** across 7 risk domains
- **Multi-tenant** — Isolated data per organization

## Enterprise Edition

The open-source core includes everything needed for self-hosted risk monitoring.

Enterprise features (available with subscription):
- Auto-learning engine (self-improving thresholds and pattern discovery)
- SAR/STR draft generation
- Natural language policy builder
- Regulatory watchdog agent (always-on regulatory monitoring)
- Multi-tenant MSP architecture
- SSO/SAML integration
- Priority support with SLA

Contact: enterprise@aigovhub.io

## Tech Stack

- **Runtime**: Node.js 20, TypeScript (strict mode)
- **API**: Fastify 5
- **Frontend**: Next.js 15, Tailwind CSS, Recharts
- **Database**: PostgreSQL 16 + TimescaleDB
- **Queue**: Redis 7 + BullMQ
- **AI**: OpenClaw v2026.3.22 + NemoClaw
- **Models**: Nemotron-3-Super, Nemotron-Cascade-2 (open weights)
- **Monorepo**: Turborepo + pnpm

## License

Apache 2.0 — see [LICENSE](LICENSE)

Enterprise features subject to separate license — see [ENTERPRISE_LICENSE.md](ENTERPRISE_LICENSE.md)
