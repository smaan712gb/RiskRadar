# RiskRadar E2E Demo Walkthrough
## Testing as Teachers Federal Credit Union Employee

This walkthrough validates the complete end-user experience.

---

## Prerequisites

```bash
# Start development servers
pnpm dev          # starts web (port 3000) + api (port 4000)

# OR frontend-only (demo mode — no backend needed)
cd apps/web && pnpm dev
```

---

## Test Scenarios

### 1. Login & Authentication

**URL**: http://localhost:3000/login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1a | Navigate to /login | See login form with TFCU demo credentials |
| 1b | Click "Sarah Kim — Senior Risk Analyst" | Instant demo login, redirect to /overview |
| 1c | Verify sidebar | Shows "Teachers Federal Credit Union", user "Sarah Kim", role "analyst" |
| 1d | Click logout (→ in sidebar) | Returns to /login |
| 1e | Login as "David Chen — Chief Compliance Officer" | Different role badge, same dashboard |
| 1f | Login as "Robert Martinez — Internal Auditor" | Auditor view of the platform |

---

### 2. Dashboard Overview

**URL**: http://localhost:3000/overview

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2a | View KPI cards | 12 active alerts, 8 open cases, 6 high-risk subjects, 3,187 signals, IC3 Threat Score: 78 |
| 2b | Check risk distribution | Critical: 3, High: 5, Medium: 6, Low: 5 |
| 2c | Check signal domains | 10 domains: Finance, Security, Operations, Communications, HR, Crypto, BEC, Ransomware, Vendor Risk, AI Threat |
| 2d | View IC3 Threat Coverage widget | 85% coverage, 5/7 modules active, weekly trend bars, top 5 FBI IC3 threats mapped |
| 2e | View recent alerts | 5 recent alerts including BEC and crypto fraud, with scores and severity badges |
| 2f | Click an alert link | Navigate to alert detail page |

---

### 2.5. Threat Intelligence (NEW)

**URL**: http://localhost:3000/threat-intel

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.5a | View IC3 summary cards | 1M+ complaints, $20B+ losses, 85% coverage, threat score 78 |
| 2.5b | View threat categories table | 7 FBI IC3 categories with losses, complaints, trend, module status |
| 2.5c | Check active IC3 alerts | BEC (score 92), Crypto (81), Ransomware (74), AI Phishing (68), Vendor Risk (62) |
| 2.5d | Check vendor risk panel | 4 vendors: Acme Payments (C, was A), CloudHost (A), SecureMail (A+), PrintCo (B) |
| 2.5e | View detection modules | 6 module cards: BEC, Crypto, AI Threat, Ransomware, Supply Chain, Elder Fraud (partial) |

---

### 3. Alert Triage Workflow

**URL**: http://localhost:3000/alerts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3a | View alert list | 12 alerts including BEC, crypto, ransomware, AI phishing, vendor risk |
| 3b | Click ALT-2026-1201 | Full detail page with 5-tab view |
| 3c | Evidence tab | 5 evidence items with Symitar, UKG, Azure AD sources |
| 3d | Reasoning tab | AI reasoning from Nemotron-Cascade-2 |
| 3e | Regulatory tab | 4 regulatory mappings (BSA/AML, NCUA, GLBA) |
| 3f | Actions tab | 5 recommended actions with priority levels |
| 3g | Timeline tab | Chronological evidence timeline |
| 3h | Click "Export Report" | Navigate to /reports with alert brief |

---

### 4. Case Management

**URL**: http://localhost:3000/cases

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4a | View case list | 6 cases with SLA tracking |
| 4b | Check stats | 5 open, 1 overdue (SLA breached) |
| 4c | Verify CSE-2026-004 | Shows "SLA breached" in red |
| 4d | Verify CSE-2025-089 | Shows as "closed confirmed" |

---

### 5. Risk Score Matrix

**URL**: http://localhost:3000/risk-scores

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5a | View distribution | Critical: 3, High: 2, Medium: 1, Low: 2 |
| 5b | Check MSR-4821 | Score 89, accelerating, finance: 92 |
| 5c | Check SVCACCT-CORE | Score 83, accelerating, security: 95, change: +83 |
| 5d | Check TLR-5500 | Score 28, declining, change: -12 (normal) |

---

### 6. Professional Report Generation

**URL**: http://localhost:3000/reports

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6a | Executive Summary | Full risk summary with KPIs, critical alerts, recommendations |
| 6b | IC3 Threat Brief (NEW) | FBI IC3 2025 coverage matrix, active IC3 alerts, vendor risk assessment, deployed modules, recommendations |
| 6c | Alert Brief | Detailed ALT-2026-1201 with evidence chain, AI reasoning, regulatory mapping |
| 6d | SAR Draft | Complete FinCEN-format narrative with subject info, evidence citations, approval signatures |
| 6e | Case Report | CSE-2026-001 investigation summary |
| 6f | Risk Assessment | Organizational risk posture with all subject scores |
| 6g | Audit Trail | Timestamped activity log |
| 6h | Click "Print / Save as PDF" | Browser print dialog — save as PDF |
| 6i | Click "Download Report" | Downloads HTML report file |

---

### 7. Policies & Integrations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 7a | /policies | 15 policies including IC3 modules (BEC, crypto, AI threat, ransomware, vendor risk) |
| 7b | /integrations | 13 integrations including Chainalysis KYT, TRM Labs, MITRE ATT&CK, AI Threat Intel, SecurityScorecard |
| 7c | Check health | 11 healthy, 1 degraded (Salesforce), 1 pending (Workday) |

---

### 8. Audit Trail & Agents

| Step | Action | Expected Result |
|------|--------|-----------------|
| 8a | /audit-log | 8 audit entries with actor types (user, agent, system) |
| 8b | /agents | 17 agents (5 collection, 4 core analysis, 5 IC3 analysis, 3 response). IC3 agents have orange border. |

---

### 9. Print/PDF Quality Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 9a | Go to /reports, select Executive Summary | Professional report with TFCU branding |
| 9b | Ctrl+P (or click Print) | Clean print layout, sidebar hidden, tables formatted |
| 9c | Save as PDF | Professional, printable PDF suitable for board presentation |
| 9d | Download as HTML | Self-contained HTML file with inline styles |

---

## Demo Login Credentials

| Role | Email | Name |
|------|-------|------|
| admin | admin@tfcu.org | Maria Gonzalez |
| compliance_officer | compliance@tfcu.org | David Chen |
| ciso | ciso@tfcu.org | Raj Patel |
| analyst | sarah.kim@tfcu.org | Sarah Kim |
| analyst | james.wright@tfcu.org | James Wright |
| manager | linda.thompson@tfcu.org | Linda Thompson |
| auditor | auditor@tfcu.org | Robert Martinez |

**API Password (when backend is running):** `riskradar2026!`
**Organization slug:** `tfcu`

---

## Output Formats Available

1. **Executive Risk Summary** — Weekly board-ready brief with KPIs, critical alerts, recommendations
2. **Alert Intelligence Brief** — Deep-dive on specific alerts with evidence chain, AI reasoning, regulatory mapping
3. **SAR Draft (FinCEN Form 111)** — Auto-generated suspicious activity report narrative with evidence citations
4. **Case Investigation Report** — Case summary with status, timeline, assignments
5. **Organizational Risk Assessment** — Signal activity, subject risk scores, domain breakdown
6. **Audit Trail Export** — Immutable activity log for compliance examination
