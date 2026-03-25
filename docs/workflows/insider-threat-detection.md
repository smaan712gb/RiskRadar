# Insider Threat Detection — Workflow Diagrams

## Product Overview
Cross-domain behavioral analysis powered by OpenClaw agents with CERT/CC and MITRE ATT&CK expertise. Detects compound threats no single-domain tool can see.

---

## Workflow 1: Cross-Domain Compound Risk Detection

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  CROSS-DOMAIN COMPOUND RISK DETECTION                   │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │   Finance    │  │  Security   │  │     HR      │  │    Comms     │  │
│  │  Collector   │  │  Collector  │  │  Collector  │  │  Collector   │  │
│  │  (OpenClaw)  │  │  (OpenClaw) │  │  (OpenClaw) │  │  (OpenClaw)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│         │                │                │                 │          │
│    Overrides        After-hrs       Training          Comm drop       │
│    New payees       Failed login    Attendance        Response        │
│    Expenses         Privilege esc   Performance       Meeting         │
│         │                │                │                 │          │
│         └────────────────┼────────────────┼─────────────────┘          │
│                          │                │                            │
│                          ▼                ▼                            │
│                 ┌──────────────────────────────┐                      │
│                 │       FUSION AGENT            │                      │
│                 │       (OpenClaw)               │                      │
│                 │                                │                      │
│                 │  1. Buffer signals per subject │                      │
│                 │  2. Temporal clustering         │                      │
│                 │     (7-day sliding window)     │                      │
│                 │  3. Domain diversity score     │                      │
│                 │     (more domains = higher)    │                      │
│                 │  4. Digital twin deviation     │                      │
│                 │     (vs role archetype)        │                      │
│                 │  5. Compound score calc:       │                      │
│                 │     signal × diversity ×       │                      │
│                 │     temporal × deviation       │                      │
│                 └──────────────┬─────────────────┘                      │
│                                │                                        │
│                    ┌───────────┼───────────┐                            │
│                    │           │           │                            │
│              Score < 25   25-50      Score > 50                        │
│                    │           │           │                            │
│                    ▼           ▼           ▼                            │
│              ┌──────────┐ ┌────────┐ ┌───────────────┐                 │
│              │ Continue │ │ Log &  │ │ ESCALATE:     │                 │
│              │ Monitor  │ │ Watch  │ │ Deep Reasoning│                 │
│              └──────────┘ └────────┘ │ via DeepSeek  │                 │
│                                      │ V3.2          │                 │
│                                      └───────┬───────┘                 │
│                                              │                         │
│                                              ▼                         │
│                                    ┌──────────────────┐                │
│                                    │  EVIDENCE BRIEF   │                │
│                                    │                   │                │
│                                    │  Chain:           │                │
│                                    │  #1 Override      │                │
│                                    │  #2 Supervisor    │                │
│                                    │  #3 After-hours   │                │
│                                    │  #4 New payee     │                │
│                                    │  #5 Training miss │                │
│                                    │                   │                │
│                                    │  Reasoning:       │                │
│                                    │  "Compound pattern│                │
│                                    │   across 4 domains│                │
│                                    │   consistent with │                │
│                                    │   insider threat"  │                │
│                                    │                   │                │
│                                    │  Regulatory:      │                │
│                                    │  FinCEN 2025-A003 │                │
│                                    │  BSA/AML 31 CFR   │                │
│                                    │  1020.320         │                │
│                                    │                   │                │
│                                    │  Actions:         │                │
│                                    │  [IMMEDIATE]      │                │
│                                    │  Freeze overrides │                │
│                                    │  [24h] BSA review │                │
│                                    │  [72h] SAR assess │                │
│                                    └──────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Workflow 2: Kill Chain Staging (MITRE ATT&CK)

```
┌─────────────────────────────────────────────────────────────────┐
│              INSIDER THREAT KILL CHAIN                           │
│                                                                 │
│  Stage 1: RECRUITMENT / MOTIVATION                              │
│  ┌──────────────────────────────┐                               │
│  │ HR Collector detects:        │  Signals:                     │
│  │ • Performance decline        │  performance_decline          │
│  │ • Passed over for promotion  │  role_change                  │
│  │ • Compensation dispute       │  leave_pattern_change         │
│  │ Risk contribution: +15       │                               │
│  └──────────────┬───────────────┘                               │
│                 │                                               │
│                 ▼                                               │
│  Stage 2: RECONNAISSANCE                                       │
│  ┌──────────────────────────────┐                               │
│  │ Security Collector detects:  │  Signals:                     │
│  │ • Browsing org charts        │  unusual_data_access          │
│  │ • Testing access outside     │  privilege_escalation         │
│  │   job function               │                               │
│  │ • Querying data catalogs     │  MITRE: T1083                │
│  │ Risk contribution: +20       │                               │
│  └──────────────┬───────────────┘                               │
│                 │                                               │
│                 ▼                                               │
│  Stage 3: CIRCUMVENTION                                        │
│  ┌──────────────────────────────┐                               │
│  │ Security Collector detects:  │  Signals:                     │
│  │ • VPN from unusual location  │  after_hours_access           │
│  │ • DLP bypass attempts        │  mfa_bypass                   │
│  │ • Alternate access paths     │  failed_login_spike           │
│  │ MITRE: T1078, T1134          │                               │
│  │ Risk contribution: +30       │                               │
│  └──────────────┬───────────────┘                               │
│                 │                                               │
│                 ▼                                               │
│  Stage 4: AGGREGATION                                          │
│  ┌──────────────────────────────┐                               │
│  │ Security Collector detects:  │  Signals:                     │
│  │ • Large file downloads       │  data_exfiltration            │
│  │ • Archive creation           │  unusual_data_access          │
│  │ • Broad-scope DB queries     │                               │
│  │ MITRE: T1005, T1074          │                               │
│  │ Risk contribution: +25       │  ← ALERT THRESHOLD           │
│  └──────────────┬───────────────┘                               │
│                 │                                               │
│                 ▼                                               │
│  Stage 5: EXFILTRATION                                         │
│  ┌──────────────────────────────┐                               │
│  │ Security Collector detects:  │  Signals:                     │
│  │ • USB transfers              │  data_exfiltration            │
│  │ • Cloud upload (personal)    │                               │
│  │ • Email to external account  │  MITRE: T1048, T1567         │
│  │ MITRE: T1052                 │                               │
│  │ Risk contribution: +30       │  ← CRITICAL ALERT            │
│  └──────────────────────────────┘                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐           │
│  │           RESPONSE PROPORTIONALITY               │           │
│  │                                                  │           │
│  │  Score 0-25:  MONITOR (continue standard UEBA)   │           │
│  │  Score 25-50: ENHANCE (increase monitoring)      │           │
│  │  Score 50-75: INVESTIGATE (assign analyst)       │           │
│  │  Score 75-100: ESCALATE (restrict + legal)       │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow 3: Data Exfiltration Response

```
┌─────────────────────────────────────────────────────────────────┐
│              DATA EXFILTRATION DETECTED                          │
│                                                                 │
│  Security Collector                                             │
│  ┌──────────────────┐                                           │
│  │ DLP alert:        │                                          │
│  │ 2.3GB transfer    │                                          │
│  │ to personal       │                                          │
│  │ Google Drive      │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │ Fusion Agent      │────▶│ Cross-correlate: │                  │
│  │ checks:           │     │ • Same user had  │                  │
│  │ other domains     │     │   override txns? │                  │
│  └──────────────────┘     │ • Resignation    │                  │
│                           │   notice filed?  │                  │
│                           │ • Comm pattern   │                  │
│                           │   changed?       │                  │
│                           └────────┬─────────┘                  │
│                                    │                            │
│                         ┌──────────┼──────────┐                 │
│                         │                     │                 │
│                    Isolated            Compound                 │
│                    (security only)     (multi-domain)           │
│                         │                     │                 │
│                         ▼                     ▼                 │
│                    ┌──────────┐      ┌──────────────┐           │
│                    │ Severity │      │ Severity     │           │
│                    │ HIGH     │      │ CRITICAL     │           │
│                    │ Notify   │      │              │           │
│                    │ CISO     │      │ IMMEDIATE:   │           │
│                    └──────────┘      │ • Freeze     │           │
│                                      │   access     │           │
│                                      │ • Notify     │           │
│                                      │   CISO +     │           │
│                                      │   Legal      │           │
│                                      │ • Preserve   │           │
│                                      │   evidence   │           │
│                                      │ • Create     │           │
│                                      │   case       │           │
│                                      └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```
