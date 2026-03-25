# Compliance & Investigation — Workflow Diagrams

## Product Overview
AI-generated evidence briefs, case management, automated SAR/STR drafting, and regulatory mapping — from alert to resolution.

---

## Workflow 1: Alert-to-Case Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│              ALERT → CASE → RESOLUTION LIFECYCLE                │
│                                                                 │
│  AI Alert Generated                                             │
│  (by Fusion Agent)                                              │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────┐                                           │
│  │  ALERT QUEUE      │                                          │
│  │  Status: NEW      │                                          │
│  │                   │                                          │
│  │  Auto-assigned    │◀──── Alert Router Agent                  │
│  │  by severity:     │      (load-balanced across analysts)     │
│  │  CRIT → CCO       │                                          │
│  │  HIGH → BSA Off.  │                                          │
│  │  MED  → Analyst   │                                          │
│  │  LOW  → Queue     │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  ANALYST REVIEW   │                                          │
│  │  Status: UNDER    │                                          │
│  │  REVIEW           │                                          │
│  │                   │                                          │
│  │  Reviews:         │                                          │
│  │  ┌─────────────┐ │                                          │
│  │  │ Evidence Tab│ │  ← Chronological evidence chain          │
│  │  │ Reasoning   │ │  ← AI chain-of-thought                  │
│  │  │ Regulatory  │ │  ← Mapped to BSA/SOX/HIPAA             │
│  │  │ Actions     │ │  ← Recommended next steps               │
│  │  │ Timeline    │ │  ← Visual event timeline                │
│  │  └─────────────┘ │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│      ┌────┼────────────────┐                                   │
│      │    │                │                                   │
│      ▼    ▼                ▼                                   │
│  ┌──────┐ ┌──────────┐ ┌──────────┐                           │
│  │CONFM.│ │ DISMISS  │ │ ESCALATE │                           │
│  │      │ │ (reason  │ │ → CASE   │                           │
│  │      │ │ required)│ │          │                           │
│  └──┬───┘ └────┬─────┘ └────┬─────┘                           │
│     │          │              │                                │
│     │     ┌────▼─────┐  ┌────▼──────────────┐                 │
│     │     │ Auto-    │  │ CASE CREATED       │                 │
│     │     │ Learning │  │ Status: OPEN       │                 │
│     │     │ Engine   │  │ SLA timer starts   │                 │
│     │     │ (adjusts │  │ Priority assigned  │                 │
│     │     │ thresh.) │  │ Investigator       │                 │
│     │     └──────────┘  │ assigned           │                 │
│     │                   └────┬──────────────┘                 │
│     │                        │                                │
│     │                        ▼                                │
│     │               ┌──────────────────┐                      │
│     │               │ INVESTIGATING     │                      │
│     │               │                   │                      │
│     │               │ • Add comments    │                      │
│     │               │ • Attach evidence │                      │
│     │               │ • Generate SAR    │                      │
│     │               │ • Request legal   │                      │
│     │               └────┬──────────────┘                      │
│     │                    │                                     │
│     │               ┌────┼─────────┐                           │
│     │               │    │         │                           │
│     │               ▼    ▼         ▼                           │
│     │          ┌───────┐┌───────┐┌──────────┐                 │
│     │          │CLOSED ││CLOSED ││CLOSED    │                 │
│     │          │CONFIRM││FP     ││NO ACTION │                 │
│     │          └───────┘└───────┘└──────────┘                 │
│     │                                                          │
│     └──────────▶ RESOLVED                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow 2: Autonomous Regulatory Compliance Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│         AUTONOMOUS REGULATORY COMPLIANCE LOOP                    │
│         (The workflow competitors cannot do)                    │
│                                                                 │
│  ┌──────────────────┐                                           │
│  │ Regulatory        │  Runs every 6 hours                      │
│  │ Watchdog Agent    │  Scans: FinCEN, OCC, FDIC, SEC, OFAC,   │
│  │ (OpenClaw)        │  CFPB, Fed, NIST, EBA, FATF, Basel, HHS │
│  └────────┬─────────┘                                           │
│           │  Detects new advisory/bulletin                      │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ IMPACT ASSESSMENT │  (DeepSeek V3.2)                        │
│  │                   │                                          │
│  │ Analyzes:         │                                          │
│  │ • Which domains   │                                          │
│  │   affected?       │                                          │
│  │ • Which policies  │                                          │
│  │   need updating?  │                                          │
│  │ • Compliance      │                                          │
│  │   deadline?       │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ AI PROPOSES       │                                          │
│  │ CHANGES           │                                          │
│  │                   │                                          │
│  │ Generates:        │                                          │
│  │ • New policies    │  (executable rules, not descriptions)   │
│  │ • Threshold       │                                          │
│  │   adjustments     │                                          │
│  │ • New signal      │                                          │
│  │   types           │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │ NOTIFY CIO/CCO   │────▶│ Slack / Teams /  │                  │
│  │                   │     │ Email            │                  │
│  │ Urgency:          │     │                  │                  │
│  │ CRITICAL < 30d    │     │ Includes:        │                  │
│  │ HIGH < 90d        │     │ • Change summary │                  │
│  │ MEDIUM < 180d     │     │ • Impact score   │                  │
│  │ LOW > 180d        │     │ • Deadline       │                  │
│  └──────────────────┘     │ • Proposed fixes │                  │
│                           └────────┬─────────┘                  │
│                                    │                            │
│                                    ▼                            │
│  ┌─────────────────────────────────────────────┐                │
│  │           CIO REVIEW IN DASHBOARD            │                │
│  │                                              │                │
│  │  GET /api/v1/regulatory/proposals            │                │
│  │  GET /api/v1/regulatory/proposals/:id        │                │
│  │                                              │                │
│  │  Sees: proposed policies, threshold changes, │                │
│  │        new signal types, regulatory refs     │                │
│  │                                              │                │
│  │  ┌────────────┐       ┌────────────┐         │                │
│  │  │  APPROVE   │       │  REJECT    │         │                │
│  │  │            │       │ (+ reason) │         │                │
│  │  └──────┬─────┘       └────────────┘         │                │
│  └─────────┼────────────────────────────────────┘                │
│            │                                                     │
│            ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ AUTO-TEST         │                                          │
│  │                   │                                          │
│  │ Validates:        │                                          │
│  │ ✓ Rule structure  │                                          │
│  │ ✓ Alert volume    │                                          │
│  │   estimate        │                                          │
│  │ ✓ Regulatory ref  │                                          │
│  │   exists in KB    │                                          │
│  └────────┬─────────┘                                           │
│      All pass?                                                  │
│      ┌────┼────┐                                               │
│      │         │                                               │
│     YES       NO                                               │
│      │         │                                               │
│      ▼         ▼                                               │
│ ┌──────────┐ ┌──────────┐                                      │
│ │AUTO-     │ │REJECTED  │                                      │
│ │DEPLOY    │ │(notify   │                                      │
│ │          │ │CIO why)  │                                      │
│ │Creates/  │ └──────────┘                                      │
│ │updates   │                                                   │
│ │policies  │                                                   │
│ │in prod   │                                                   │
│ └────┬─────┘                                                   │
│      │                                                         │
│      ▼                                                         │
│ ┌──────────┐     ┌──────────────────┐                          │
│ │VERIFY    │────▶│ AUDIT TRAIL      │                          │
│ │Policies  │     │ (Immutable)      │                          │
│ │active    │     │ Who approved     │                          │
│ │and       │     │ What changed     │                          │
│ │firing    │     │ Test results     │                          │
│ └──────────┘     │ When deployed    │                          │
│                  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow 3: Regulatory Gap Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│              REGULATORY GAP ANALYSIS                             │
│                                                                 │
│  Triggered: Daily (automatic) or on-demand                      │
│                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │ 25 Regulatory     │     │ Active Monitoring │                  │
│  │ Rules in DB       │     │ Policies          │                  │
│  │                   │     │                   │                  │
│  │ BSA/AML: 5 rules  │     │ Finance: 3        │                  │
│  │ SOX: 4 rules      │     │ Security: 2       │                  │
│  │ GLBA: 3 rules     │     │ HR: 1             │                  │
│  │ HIPAA: 4 rules    │     │ Operations: 1     │                  │
│  │ GDPR: 4 rules     │     │ Compliance: 1     │                  │
│  │ NIST CSF: 4 rules │     │                   │                  │
│  │ PCI DSS: 1 rule   │     │                   │                  │
│  └────────┬─────────┘     └────────┬─────────┘                  │
│           │                        │                            │
│           └────────────┬───────────┘                            │
│                        │                                        │
│                        ▼                                        │
│           ┌──────────────────────┐                              │
│           │ GAP ANALYSIS ENGINE  │                              │
│           │                      │                              │
│           │ For each framework:  │                              │
│           │ • Count covered      │                              │
│           │   requirements       │                              │
│           │ • Identify missing   │                              │
│           │   signal types       │                              │
│           │ • Calculate coverage │                              │
│           │   percentage         │                              │
│           └──────────┬───────────┘                              │
│                      │                                          │
│                      ▼                                          │
│           ┌──────────────────────────────────┐                  │
│           │         GAP REPORT               │                  │
│           │                                  │                  │
│           │ BSA/AML:  ████████░░  80%       │                  │
│           │ SOX:      ██████░░░░  60%       │                  │
│           │ GLBA:     ████░░░░░░  40%       │                  │
│           │ HIPAA:    ████████░░  80%       │                  │
│           │ GDPR:     ██████░░░░  60%       │                  │
│           │ NIST CSF: ████████░░  80%       │                  │
│           │ PCI DSS:  ██████████  100%      │                  │
│           │                                  │                  │
│           │ Priority Gaps:                   │                  │
│           │ 1. GLBA Safeguards Rule (no      │                  │
│           │    access monitoring policy)     │                  │
│           │ 2. SOX Section 404 (no           │                  │
│           │    control assessment policy)    │                  │
│           │ 3. GDPR Article 35 (no DPIA      │                  │
│           │    monitoring)                   │                  │
│           └──────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```
