---
title: "Deploy Your Own AI Risk Monitoring Platform in 15 Minutes (Docker Compose)"
description: "Step-by-step guide to self-hosting RiskRadar — an open-source, 12-agent AI risk intelligence platform — on your own infrastructure with Docker Compose."
tags: [docker, selfhosted, ai, tutorial, devops, security, openclaw]
canonical_url: https://dev.to/aimadds/deploy-riskradar-docker-compose
published: true
cover_image: https://riskradar.ai/blog/self-hosted-guide-cover.png
series: "RiskRadar Getting Started"
---

# Deploy Your Own AI Risk Monitoring Platform in 15 Minutes (Docker Compose)

RiskRadar is an open-source AI risk intelligence platform that uses 12 autonomous agents (built on OpenClaw) to detect compound risk patterns across HR, finance, security, operations, and communications. It is Apache 2.0 licensed and designed to run entirely on your own infrastructure.

This guide walks you through deploying the full production stack — database, cache, API, web dashboard, and agent service — using a single Docker Compose file. No cloud account needed. No data leaves your network.

---

## Prerequisites

Before you start, make sure you have:

- **Docker** 24+ with Docker Compose v2
- **16 GB RAM minimum** (32 GB recommended if running local AI inference)
- **4 CPU cores minimum** (8 recommended)
- **20 GB free disk space** (more if using local AI models)
- **(Optional) NVIDIA GPU** with NVIDIA Container Toolkit installed — only needed for local AI inference

No GPU? No problem. Set `INFERENCE_MODE=cloud` to use Claude, GPT, or any OpenAI-compatible API. The agents work identically; only the inference backend changes.

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/smaan712gb/RiskRadar.git
cd RiskRadar
```

---

## Step 2: Configure Environment Variables

```bash
cd deploy/docker
cp .env.example .env
```

Open `.env` in your editor. Here are the required variables:

```bash
# ─── Required Secrets ─────────────────────────────────────
DB_PASSWORD=your-secure-database-password
REDIS_PASSWORD=your-secure-redis-password
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-min-32-chars

# ─── AI Inference Mode ────────────────────────────────────
# local  = Full on-premises (requires NVIDIA GPU)
# cloud  = Claude/GPT API (no GPU needed)
# hybrid = Routine via cloud, deep reasoning stays local
INFERENCE_MODE=cloud

# ─── Cloud API Keys (if INFERENCE_MODE=cloud or hybrid) ──
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...

# ─── Optional Overrides ──────────────────────────────────
DB_PORT=5432
REDIS_PORT=6379
API_PORT=3001
WEB_PORT=3000
LOG_LEVEL=info
```

Generate secure secrets:

```bash
# Generate random secrets (Linux/Mac)
openssl rand -hex 32  # Use for DB_PASSWORD
openssl rand -hex 32  # Use for REDIS_PASSWORD
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for ENCRYPTION_KEY
```

---

## Step 3: Launch the Stack

### Without GPU (cloud inference):

```bash
docker compose -f docker-compose.production.yml up -d
```

### With GPU (local AI inference):

```bash
docker compose -f docker-compose.production.yml --profile gpu up -d
```

That is it. Docker Compose pulls the images, starts the services, runs health checks, and brings everything online.

---

## What Gets Deployed

Here is what the production compose file creates:

```yaml
services:
  postgres:     # TimescaleDB (PostgreSQL 16 + time-series extensions)
    image: timescale/timescaledb:latest-pg16
    # 4GB memory limit, persistent volume, health checks

  redis:        # Cache + Agent message bus + Job queues
    image: redis:7-alpine
    # 1GB memory limit, AOF persistence, password auth

  api:          # Fastify 5 REST API (8 route modules, RBAC, audit trails)
    # 2GB memory, 2 CPU limit
    # Depends on: postgres (healthy), redis (healthy)

  web:          # Next.js 15 dashboard (11 pages)
    # 1GB memory, 1 CPU limit
    # Depends on: api

  agents:       # OpenClaw agent service (12 agents, 7 skills, 5 engines)
    # 8GB memory, 4 CPU limit, GPU reservation
    # Depends on: postgres (healthy), redis (healthy)

  inference:    # vLLM server for local Nemotron models (GPU profile only)
    image: vllm/vllm-openai:latest
    # Only starts with --profile gpu
```

---

## Step 4: Verify the Deployment

Check that all services are healthy:

```bash
docker compose -f docker-compose.production.yml ps
```

You should see:

```
NAME                STATUS              PORTS
riskradar-db        Up (healthy)        0.0.0.0:5432->5432/tcp
riskradar-redis     Up (healthy)        0.0.0.0:6379->6379/tcp
riskradar-api       Up                  0.0.0.0:3001->3001/tcp
riskradar-web       Up                  0.0.0.0:3000->3000/tcp
riskradar-agents    Up                  (no exposed ports)
```

Check the API is responding:

```bash
curl http://localhost:3001/api/v1/health
```

Open the dashboard:

```
http://localhost:3000
```

View API documentation:

```
http://localhost:3001/docs
```

---

## The Three Deployment Modes Explained

RiskRadar supports three inference modes. Choose based on your security requirements and hardware availability.

### Mode 1: Cloud (`INFERENCE_MODE=cloud`)

```
┌──────────────────────────────────────────┐
│  Your Infrastructure                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐│
│  │ DB   │ │Redis │ │ API  │ │ Agents   ││
│  │(PG16)│ │  7   │ │(3001)│ │(OpenClaw)││
│  └──────┘ └──────┘ └──────┘ └────┬─────┘│
│                                   │      │
└───────────────────────────────────┼──────┘
                                    │ HTTPS
                              ┌─────▼──────┐
                              │ Claude/GPT │
                              │   API      │
                              └────────────┘
```

- **No GPU required**
- Fastest to deploy
- AI inference happens via API (Anthropic, OpenAI, or any compatible endpoint)
- Signal data (anonymized) is sent to the AI provider for analysis
- Best for: evaluation, development, non-regulated environments

### Mode 2: Local (`INFERENCE_MODE=local`)

```
┌──────────────────────────────────────────────────────┐
│  Your Infrastructure                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐ ┌────────┐│
│  │ DB   │ │Redis │ │ API  │ │ Agents   │ │ vLLM   ││
│  │(PG16)│ │  7   │ │(3001)│ │(OpenClaw)│ │Nemotron││
│  └──────┘ └──────┘ └──────┘ └────┬─────┘ └───▲────┘│
│                                   │           │      │
│                                   └───────────┘      │
│                             100% on-premises          │
└──────────────────────────────────────────────────────┘
```

- **Requires NVIDIA GPU** (RTX 4090/5090 or A100+)
- Zero data leaves your network
- AI inference via vLLM serving Nemotron models locally
- Best for: regulated industries (banking, healthcare, defense), data-sovereign deployments

### Mode 3: Hybrid (`INFERENCE_MODE=hybrid`)

```
┌──────────────────────────────────────────────────────┐
│  Your Infrastructure                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐ ┌────────┐│
│  │ DB   │ │Redis │ │ API  │ │ Agents   │ │ vLLM   ││
│  │(PG16)│ │  7   │ │(3001)│ │(OpenClaw)│ │Nemotron││
│  └──────┘ └──────┘ └──────┘ └──┬──┬────┘ └───▲────┘│
│                              T2│  │T1         │      │
│                                │  └───────────┘      │
└────────────────────────────────┼─────────────────────┘
                                 │ HTTPS (T1 only)
                           ┌─────▼──────┐
                           │ Claude/GPT │
                           └────────────┘
```

- **GPU recommended** (for local Tier 2 reasoning)
- Tier 1 (fast monitoring) routes to cloud API
- Tier 2 (deep reasoning with sensitive data) stays on-premises
- Best for: organizations that want cloud speed for routine work but data sovereignty for high-risk analysis

---

## Step 5: Ingest Your First Signal

Use the signal ingestion API to send test data:

```bash
# Get an auth token first (default admin credentials from seed)
TOKEN=$(curl -s http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.data.token')

# Ingest a batch of test signals
curl -X POST http://localhost:3001/api/v1/signals/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "signals": [
      {
        "domain": "finance",
        "signalType": "override_transaction",
        "subjectType": "employee",
        "subjectId": "emp-001",
        "sourceSystem": "sap",
        "value": 47500,
        "metadata": { "payee": "ACME Corp", "approver": "emp-001" },
        "timestamp": "2026-03-25T14:30:00Z"
      },
      {
        "domain": "security",
        "signalType": "after_hours_access",
        "subjectType": "employee",
        "subjectId": "emp-001",
        "sourceSystem": "badge_system",
        "value": null,
        "metadata": { "location": "server_room", "time": "23:45" },
        "timestamp": "2026-03-25T23:45:00Z"
      },
      {
        "domain": "hr",
        "signalType": "training_missed",
        "subjectType": "employee",
        "subjectId": "emp-001",
        "sourceSystem": "lms",
        "value": null,
        "metadata": { "course": "annual_compliance_training" },
        "timestamp": "2026-03-24T09:00:00Z"
      }
    ]
  }'
```

The collection agents will normalize these signals, the Fusion Engine will correlate them (same `subjectId` across three domains), and if the compound score exceeds the threshold, you will see an alert appear in the dashboard.

---

## Step 6: Dashboard Walkthrough

Open `http://localhost:3000` in your browser.

**Dashboard Home** — Real-time overview of active agents, signal volume, open alerts, and risk distribution across domains.

**Alerts** — Sorted by compound score. Each alert includes:
- The signals that triggered it (with source system, timestamp, and value)
- Domains involved (color-coded)
- Evidence chain generated by the Fusion Engine's AI reasoning
- Recommended investigative actions
- Regulatory frameworks that apply

**Risk Scores** — Entity-level risk scores with trajectory indicators (accelerating/stable/declining) and projected breach dates.

**Policies** — Natural language monitoring policies. Create rules in plain English: "Alert when any employee has finance overrides and security anomalies in the same week."

**Cases** — Investigation workflow. Escalate alerts to cases, assign investigators, track SLA timelines.

**Audit Trail** — 7-year immutable log of every action: alert creation, status changes, feedback, policy modifications.

---

## Step 7: Security Hardening

For production deployments, apply these additional security measures:

### Network isolation

```bash
# Create a dedicated Docker network (already in compose, but verify)
docker network inspect riskradar_default
```

### TLS termination

Put a reverse proxy in front of the API and web services:

```nginx
# nginx.conf example
server {
    listen 443 ssl;
    server_name riskradar.yourcompany.com;

    ssl_certificate /etc/ssl/certs/riskradar.crt;
    ssl_certificate_key /etc/ssl/private/riskradar.key;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
    }
}
```

### Database encryption at rest

TimescaleDB supports transparent data encryption (TDE). Enable it in your `postgresql.conf` or use disk-level encryption (LUKS on Linux, BitLocker on Windows).

### Rotate secrets regularly

```bash
# Rotate JWT secret (invalidates all existing sessions)
openssl rand -hex 32  # New JWT_SECRET

# Rotate encryption key (requires data re-encryption)
# Use the provided migration script:
pnpm run rotate-encryption-key
```

### Enable PII redaction in logs

The Pino logger includes built-in PII redaction. Ensure it is enabled:

```bash
# In .env
LOG_REDACT_PATHS=["req.headers.authorization","req.body.password","*.ssn","*.email"]
```

### Restrict agent permissions (NemoClaw)

If running with NemoClaw security sandboxing, each agent runs in a Landlock + Seccomp sandbox:

- Finance agents can only access financial data tables
- Security agents can only access access-log tables
- Response agents can only write to notification channels
- No agent can access the filesystem outside its workspace

---

## Monitoring the Platform

### Check agent health:

```bash
# View agent logs
docker logs riskradar-agents --tail 100 -f

# Check specific agent status via API
curl http://localhost:3001/api/v1/agents/status \
  -H "Authorization: Bearer $TOKEN"
```

### Check database size:

```bash
docker exec riskradar-db psql -U riskradar -c "
  SELECT pg_size_pretty(pg_database_size('riskradar')) as db_size;
"
```

### Check Redis memory:

```bash
docker exec riskradar-redis redis-cli -a $REDIS_PASSWORD info memory
```

---

## Scaling Beyond a Single Machine

For organizations processing more than 10,000 signals per day, consider:

### Kubernetes deployment

RiskRadar includes Helm charts for Kubernetes:

```bash
cd deploy/helm
helm install riskradar ./riskradar \
  --set postgres.password=$DB_PASSWORD \
  --set redis.password=$REDIS_PASSWORD \
  --set inference.mode=hybrid
```

### Horizontal scaling

- **API:** Stateless — scale replicas behind a load balancer
- **Agents:** Scale collection agents per domain; analysis and response agents are singletons per tenant
- **Database:** Use TimescaleDB multi-node for sharding across time partitions
- **Redis:** Use Redis Cluster for Pub/Sub fan-out across multiple nodes

### GCP deployment

Terraform configurations for Google Cloud are in `deploy/gcp/`.

---

## Troubleshooting

**Agents not starting?**
```bash
docker logs riskradar-agents --tail 50
# Common cause: database migrations not applied
docker exec riskradar-api pnpm db:migrate deploy
```

**High memory usage?**
```bash
# Check per-container memory
docker stats --no-stream
# Reduce agent memory by disabling unused agents in config
```

**GPU not detected?**
```bash
# Verify NVIDIA Container Toolkit
nvidia-smi
docker run --gpus all nvidia/cuda:12.0-base nvidia-smi
```

**Redis connection refused?**
```bash
# Check Redis is healthy
docker exec riskradar-redis redis-cli -a $REDIS_PASSWORD ping
# Should return: PONG
```

---

## Next Steps

Once you have the platform running:

1. **Connect real data sources** — Integrate your ERP, SIEM, HRIS, and communication platforms via the signal ingestion API or webhook connectors
2. **Create monitoring policies** — Use the natural language policy builder to define your organization's specific risk thresholds
3. **Train the digital twins** — The system needs 2-4 weeks of baseline data to build accurate behavioral profiles
4. **Configure notification channels** — Set up Slack, Teams, or email integrations for alert routing
5. **Enable the auto-learning loop** — Have analysts provide feedback on alerts to tune detection thresholds

---

## Get Help

- **Documentation:** [riskradar.ai/docs](https://riskradar.ai/docs)
- **GitHub Issues:** [github.com/smaan712gb/RiskRadar/issues](https://github.com/smaan712gb/RiskRadar/issues)
- **Discord:** [discord.gg/riskradar](https://discord.gg/riskradar)
- **Enterprise Support:** [aimadds.com/contact](https://aimadds.com/contact)

Star the repo if this was helpful: [github.com/smaan712gb/RiskRadar](https://github.com/smaan712gb/RiskRadar)

---

*Built by [AIMADDS](https://aimadds.com). Apache 2.0 core. Powered by OpenClaw.*
