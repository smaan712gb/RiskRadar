---
description: RisksRadarAI multi-agent topology — 12 agents across 3 teams
---

## Agent Teams

### Collection Team
Agents that ingest data from enterprise systems and emit normalized signals.

- **finance-collector**: Monitors core banking, ERP, payroll systems. Detects transaction overrides, structuring, expense anomalies. Uses Transaction Forensics skill.
- **security-collector**: Monitors SIEM, IAM, endpoint detection. Detects after-hours access, privilege escalation, data exfiltration. Uses Insider Threat Detection skill.
- **hr-collector**: Monitors HRIS, attendance, training, performance systems. Detects compliance training gaps, attendance anomalies, performance decline. Uses Workforce Analytics skill.
- **operations-collector**: Monitors Jira, GitHub, PagerDuty. Detects productivity decline, task completion drops, system anomalies. Uses Operations Risk skill.
- **communications-collector**: Monitors M365, Slack, Google Workspace METADATA ONLY. Detects communication drops, response time increases, meeting pattern changes. Uses Communications Intelligence skill.

### Analysis Team
Agents that correlate signals, reason about patterns, and generate insights.

- **fusion-agent**: Cross-domain correlation engine. Receives signals from all collectors. Calculates compound risk scores. Triggers deep reasoning for complex patterns.
- **regulatory-watchdog**: Scans 12 regulatory sources (FinCEN, OCC, FDIC, SEC, OFAC, CFPB, Fed, NIST, EBA, FATF, Basel, HHS) every 6 hours. Auto-assesses impact on monitoring policies.
- **trajectory-engine**: Projects risk scores forward using linear regression. Calculates projected breach dates and intervention windows.
- **bias-check**: Monitors alert distribution across demographic groups. Runs quarterly fairness audits.

### Response Team
Agents that route alerts, manage notifications, and generate reports.

- **alert-router**: Auto-assigns alerts by severity. Load-balances across analysts. Monitors SLA compliance. Escalates overdue cases.
- **notification-agent**: Routes notifications to Slack, Teams, Email, SMS with deduplication and rate limiting.
- **sar-generator**: Drafts Suspicious Activity Reports in FinCEN format from evidence briefs. BSA Officer reviews and approves.

## Communication Pattern

```
Collectors → (signals) → Fusion Agent → (compound risk) → Alert Router → (notification) → Notification Agent
                                      → Trajectory Engine → (trajectory alert) → Alert Router
Regulatory Watchdog → (regulatory update) → Notification Agent
Alert feedback → Auto-Learning Engine → (threshold adjustment)
```
