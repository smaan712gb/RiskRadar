# RisksRadarAI — Banking & Credit Union Onboarding Guide

## Overview

This guide walks you through deploying RisksRadarAI for a bank or credit union. By the end, you'll have AI agents monitoring transaction overrides, insider threats, compliance training, and communication patterns — with regulatory-ready evidence briefs.

**Time to complete:** 2-4 hours
**Time to first alert:** Same day

---

## Step 1: Account Setup (10 minutes)

1. Go to **https://risksradarai.com/signup**
2. Enter your organization name and select **Banking** or **Credit Union** as industry
3. The system auto-configures:
   - BSA/AML regulatory framework
   - SOX compliance rules
   - GLBA requirements
   - FinCEN advisory mappings
4. Create your admin account
5. You'll land on the onboarding wizard

## Step 2: Select Regulatory Frameworks (5 minutes)

On the onboarding wizard, confirm your regulatory frameworks:

| Framework | Auto-Selected | Description |
|---|---|---|
| **BSA/AML** | Yes | Bank Secrecy Act / Anti-Money Laundering |
| **SOX** | Yes | Sarbanes-Oxley financial controls |
| **GLBA** | Yes | Gramm-Leach-Bliley customer data protection |
| **FFIEC** | Optional | Federal Financial Institutions Examination Council |
| **DORA** | Optional | Digital Operational Resilience Act (if EU operations) |

## Step 3: Connect Core Banking System (30 minutes)

### SAP S/4HANA
1. Go to **Settings → Integrations → Add Integration**
2. Select **SAP S/4HANA** as provider
3. Enter:
   - Base URL: `https://your-sap-instance.com`
   - Auth Type: OAuth2 or API Key
   - Endpoints:
     - Transaction overrides: `/api/v1/overrides`
     - Expense reports: `/api/v1/expenses`
     - Purchase orders: `/api/v1/purchase-orders`
4. Click **Test Connection** — verify green checkmark
5. Click **Enable**

### What Gets Monitored (Finance Domain)
- **Transaction overrides** — who, when, amount, supervisor presence
- **Wire transfers** — new payees, large amounts, unusual timing
- **Expense reports** — Benford's Law analysis, weekend submissions, round numbers
- **Purchase orders** — split orders, sole-source contracts
- **Budget variances** — unusual spending patterns

## Step 4: Connect SIEM (20 minutes)

### Splunk
1. **Integrations → Add → Splunk**
2. Enter Splunk REST API URL and token
3. Endpoints:
   - Failed logins: `/services/search/jobs/export?search=index=security sourcetype=failed_login`
   - Privilege changes: `/services/search/jobs/export?search=index=security sourcetype=privilege_change`
   - Data transfers: `/services/search/jobs/export?search=index=dlp`

### What Gets Monitored (Security Domain)
- **After-hours access** — system access outside 7AM-7PM
- **Failed login spikes** — brute force detection
- **Privilege escalation** — unauthorized role changes
- **Data exfiltration** — large file transfers to external destinations
- **MFA bypass** — authentication anomalies

## Step 5: Connect HRIS (15 minutes)

### Workday
1. **Integrations → Add → Workday**
2. Enter Workday REST API credentials
3. Endpoints: attendance, training, performance, leave

### What Gets Monitored (HR Domain)
- **Compliance training** — missed mandatory AML/BSA refreshers
- **Attendance anomalies** — Monday/Friday sick day clustering
- **Performance decline** — rating drops
- **Leave patterns** — unusual PTO usage

## Step 6: Connect Communication Metadata (15 minutes)

### Microsoft 365 (Graph API)
1. **Integrations → Add → Microsoft 365**
2. Register an Azure AD app with these permissions:
   - `Reports.Read.All` (activity reports)
   - `Calendars.Read` (meeting metadata)
   - `Mail.Read` (email metadata only — NOT content)
3. Enter Client ID, Client Secret, Tenant ID

### What Gets Monitored (Communications Domain — METADATA ONLY)
- **Response time changes** — increasing latency in replies
- **Communication volume drops** — sudden reduction in messages
- **Meeting pattern changes** — overload or high decline rates
- **Channel withdrawal** — leaving Slack channels, fewer peer interactions

**Privacy note:** Only metadata is analyzed. Message content is NEVER read.

## Step 7: Configure Alert Thresholds (10 minutes)

Recommended banking thresholds:

| Alert Type | Threshold | Action |
|---|---|---|
| Compound risk score | ≥75 (Critical) | Immediate CCO notification |
| Compound risk score | ≥50 (High) | BSA Officer review within 24h |
| Override clustering | ≥3 in 7 days during supervisor absence | Auto-escalate to case |
| After-hours + financial activity | Any combination | Security + Finance correlation alert |
| SAR filing deadline | 30 days from detection | Automated reminder chain |

## Step 8: Invite Team (5 minutes)

| Role | Who | Permissions |
|---|---|---|
| **Admin** | You | Full access |
| **Compliance Officer** | BSA Officer / CCO | Alerts, cases, SAR drafts, policies, audit logs |
| **CISO** | Security Lead | Security alerts, agent management, integrations |
| **Analyst** | Investigation team | Alert review, case management, evidence |
| **Auditor** | Internal audit | Read-only access to everything |
| **Regulator** | OCC/FDIC examiner (during exam) | Read-only audit portal |

## Step 9: First Scan

Click **Launch RisksRadarAI**. Within hours you'll see:
- Signals flowing from connected systems
- Risk scores calculated for employees
- Any existing patterns flagged by the fusion engine

## What Happens Next

- **Day 1-7:** Agents collect signals, build behavioral baselines
- **Week 2:** First compound risk patterns detected
- **Week 3:** Adaptive thresholds begin self-tuning from your feedback
- **Ongoing:** Regulatory watchdog scans for new BSA/AML guidance every 6 hours

---

## Banking-Specific Features

### SAR Auto-Draft
When a suspicious pattern is confirmed:
1. Click **Generate SAR Draft** on the case page
2. AI generates FinCEN-format narrative with:
   - Subject information
   - Suspicious activity timeline
   - Evidence citations
   - Regulatory references
3. BSA Officer reviews, edits, approves
4. Filing deadline tracked automatically (30 calendar days)

### Override Forensics
The Finance Collector agent applies CFE/CAMS-level analysis:
- Benford's Law on transaction amounts
- Structuring detection (just-below-threshold patterns)
- Override-during-absence correlation
- Network analysis (vendor-employee relationships)

### Regulatory Watchdog
Monitors 12+ sources including:
- FinCEN advisories and orders
- OCC bulletins and alerts
- FDIC Financial Institution Letters
- Federal Reserve SR Letters
- FATF mutual evaluations

Auto-notifies your compliance team when new requirements affect your monitoring.
