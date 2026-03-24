# RisksRadarAI — Healthcare System Onboarding Guide

## Overview

Deploy RisksRadarAI to monitor PHI access, billing fraud, insider threats, and workforce burnout across your healthcare organization. HIPAA-compliant by design — all data stays on your infrastructure.

**Time to complete:** 2-3 hours
**Time to first alert:** Same day

---

## Step 1: Account Setup

1. **https://risksradarai.com/signup** → Select **Healthcare** industry
2. Auto-configured frameworks: HIPAA, HITECH, SOX, NIST CSF

## Step 2: Connect Systems

### EHR / EMR System
- Monitor PHI access patterns (who accessed what, when, from where)
- Detect minimum necessary violations
- Flag after-hours record access for non-assigned patients

### Identity & Access (Azure AD / Okta)
- Authentication anomalies
- Privilege escalation (clinical vs. admin access)
- MFA bypass attempts

### HRIS (Workday / ADP)
- Credential expiration tracking
- Training completion (HIPAA annual refresher)
- Staffing level monitoring (burnout prediction)

### Billing System
- Claims pattern analysis
- Duplicate billing detection
- Upcoding/unbundling patterns

## Step 3: Healthcare-Specific Monitoring

| Signal | Domain | HIPAA Article |
|---|---|---|
| PHI access outside care team | Security | Privacy Rule §164.502 |
| Large record exports | Security | Security Rule §164.312 |
| Missing HIPAA training | HR | Training §164.530 |
| After-hours system access | Security | Access Controls §164.312 |
| Billing anomalies | Finance | Anti-fraud |
| Workforce burnout indicators | HR | Quality of care |

## Step 4: Privacy Configuration

For healthcare, set anonymization to **Full**:
- Dashboard shows "Department X at risk" not individual names
- Identification requires HIPAA Privacy Officer approval
- All PHI touchpoints logged in immutable audit trail
- BAA-ready deployment (on-premises recommended)

## Step 5: Team Roles

| Role | Healthcare Title |
|---|---|
| Admin | CISO / IT Director |
| Compliance Officer | HIPAA Privacy Officer |
| Analyst | Security Analyst |
| Manager | Department Head (limited view) |
| Auditor | Internal Audit / OCR examiner |

---

## Key Difference: On-Premises Deployment

For healthcare organizations, we strongly recommend **self-hosted deployment**:

```bash
git clone https://github.com/smaan712gb/RiskRadar.git
cd RiskRadar/deploy/docker
cp .env.example .env
# Set INFERENCE_MODE=local for full HIPAA compliance
docker compose -f docker-compose.production.yml up -d
```

PHI never leaves your network. AI inference runs locally on your hardware.
