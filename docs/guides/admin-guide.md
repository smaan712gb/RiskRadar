# RisksRadarAI — Administrator Guide

## Your Role

As Admin, you manage the platform: users, integrations, agents, deployment, and billing.

---

## System Architecture

```
risksradarai.com
├── Dashboard (Next.js)     → All pages: alerts, cases, risk scores, etc.
├── API (/api/v1/*)         → Proxied to Fastify backend
├── AI Agents (17 agents)   → Background processing
├── Database (PostgreSQL)   → Alerts, cases, signals, audit logs
└── Redis                   → Job queues, agent messaging
```

## User Management

**Settings → Users & Roles**

| Role | Access Level | Typical User |
|---|---|---|
| **Admin** | Everything | IT Director, Platform Owner |
| **Compliance Officer** | Alerts, cases, SAR, policies, audit logs | CCO, BSA Officer |
| **CISO** | Alerts, security config, agents, integrations | Security Lead |
| **Analyst** | Alert review, case management, signals | Investigation Team |
| **Manager** | Alert overview, risk scores (team-level) | Department Manager |
| **Auditor** | Read-only everything | Internal Audit |
| **Regulator** | Read-only audit portal | OCC/FDIC Examiner |

## Integration Management

**Settings → Integrations**

### Adding a New Integration
1. Click **Add Integration**
2. Select provider (SAP, Splunk, Workday, Azure AD, etc.)
3. Enter connection details (URL, credentials)
4. Click **Test Connection** to verify
5. Configure sync schedule (real-time or batch)
6. Enable

### Supported Integrations (20+)

| Category | Systems |
|---|---|
| **HR/HRIS** | Workday, SuccessFactors, ADP, BambooHR |
| **Finance/ERP** | SAP S/4HANA, Oracle, NetSuite |
| **Security/SIEM** | Splunk, QRadar, Microsoft Sentinel, CrowdStrike |
| **Identity** | Azure AD, Okta, CyberArk |
| **Communication** | Microsoft 365, Slack, Google Workspace |
| **CRM** | Salesforce, Zendesk, ServiceNow |
| **Operations** | Jira, GitHub, PagerDuty |

## Agent Management

**Agents** page shows all 17 AI agents:

### Collection Team (5 agents)
- **Finance Collector** — Core banking, ERP, payroll
- **Security Collector** — SIEM, IAM, endpoint detection
- **HR Collector** — HRIS, attendance, training, performance
- **Operations Collector** — Jira, GitHub, PagerDuty
- **Communications Collector** — M365, Slack metadata (NEVER content)

### Analysis Team (4 agents)
- **Cross-Domain Fusion** — Correlates all domain signals
- **Regulatory Watchdog** — Scans regulatory sources every 6h
- **Trajectory Engine** — Projects risk scores forward
- **Bias Check** — Monitors for algorithmic fairness

### Response Team (3 agents)
- **Alert Router** — Auto-assigns alerts, monitors SLAs
- **Notification Agent** — Slack, Teams, Email, SMS
- **SAR Generator** — Drafts FinCEN-format reports

### Agent Controls
- **Restart** — Restart a specific agent
- **Logs** — View agent activity logs
- **Status** — Running, Idle, Processing, Error

## Deployment Modes

### Self-Hosted (Docker)
```bash
docker compose -f docker-compose.production.yml up -d
```

### AI Inference Modes
Set `INFERENCE_MODE` in `.env`:

| Mode | GPU Required | Data Privacy | Cost |
|---|---|---|---|
| `local` | Yes (NVIDIA) | 100% on-prem | Hardware only |
| `cloud` | No | API calls leave network | API usage fees |
| `hybrid` | Yes | Routine→cloud, reasoning→local | Mixed |

## Security Checklist

- [ ] Change default admin password immediately
- [ ] Enable MFA for all admin/compliance roles
- [ ] Review Cloud SQL authorized networks (should be empty — proxy only)
- [ ] Verify all secrets in Secret Manager
- [ ] Check NemoClaw sandbox policies per agent
- [ ] Review audit log immutability (test UPDATE/DELETE — should fail)
- [ ] Set up notification channels (Slack, email)
- [ ] Configure data retention policies per regulation

## Monitoring & Health

- **API Health:** `https://risksradarai.com/api/v1/health`
- **Readiness:** `https://risksradarai.com/api/v1/ready` (checks DB + Redis)
- **Metrics:** `https://risksradarai.com/api/v1/metrics` (memory, uptime)
- **Agent Status:** Dashboard → Agents page
