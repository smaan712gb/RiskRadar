# AI Agent Platform — Workflow Diagrams

## Product Overview
12 specialized OpenClaw agents running 24/7 with sandboxed execution, persistent memory, and MCP integrations.

---

## Workflow 1: Agent Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RISKSRADARAI AGENT ARCHITECTURE                       │
│                    (Running on OpenClaw 2026.3.23)                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    OpenClaw Gateway                              │    │
│  │                    ws://127.0.0.1:18789                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │    │
│  │  │ SOUL.md  │ │AGENTS.md │ │  Memory  │ │  MCP Servers     │  │    │
│  │  │ Persona  │ │ Topology │ │ 13 stores│ │ • postgres       │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ │ • web-search     │  │    │
│  │                                          │ • filesystem     │  │    │
│  │  Model: DeepSeek V3.2 (deepseek-chat)   └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌───────────────────── COLLECTION TEAM ──────────────────────┐        │
│  │                                                             │        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────┐│        │
│  │  │ Finance  │ │ Security │ │    HR    │ │ Ops  │ │ Comms││        │
│  │  │Collector │ │Collector │ │Collector │ │Coll. │ │Coll. ││        │
│  │  │          │ │          │ │          │ │      │ │      ││        │
│  │  │Skills:   │ │Skills:   │ │Skills:   │ │Skill:│ │Skill:││        │
│  │  │Benford   │ │MITRE     │ │Maslach   │ │SLA   │ │Meta- ││        │
│  │  │Override  │ │Kill Chain│ │Burnout   │ │Pred. │ │data  ││        │
│  │  │Structur. │ │Exfiltr.  │ │Flight    │ │Capac.│ │Only  ││        │
│  │  │          │ │          │ │Risk      │ │      │ │      ││        │
│  │  │MCP:      │ │MCP:      │ │MCP:      │ │MCP:  │ │MCP:  ││        │
│  │  │postgres  │ │postgres  │ │postgres  │ │jira  │ │slack ││        │
│  │  │(core     │ │(splunk   │ │(workday  │ │github│ │m365  ││        │
│  │  │ banking) │ │ siem)    │ │ hris)    │ │      │ │      ││        │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬───┘ └──┬───┘│        │
│  └───────┼────────────┼────────────┼──────────┼────────┼─────┘        │
│          │            │            │          │        │               │
│          └────────────┼────────────┼──────────┼────────┘               │
│                       │  SIGNALS   │          │                        │
│                       ▼            ▼          ▼                        │
│  ┌───────────────────── ANALYSIS TEAM ────────────────────────┐        │
│  │                                                             │        │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────┐ ┌────────┐ │        │
│  │  │   Fusion     │ │  Regulatory  │ │Traject. │ │ Bias   │ │        │
│  │  │   Agent      │ │  Watchdog    │ │Engine   │ │ Check  │ │        │
│  │  │              │ │              │ │         │ │        │ │        │
│  │  │Cross-domain  │ │12 reg sources│ │Linear   │ │Fairness│ │        │
│  │  │correlation   │ │every 6 hours │ │regress. │ │audits  │ │        │
│  │  │Compound      │ │Auto-impact   │ │Projected│ │Demogr. │ │        │
│  │  │scoring       │ │assessment    │ │breach   │ │bias    │ │        │
│  │  │Evidence      │ │Policy        │ │dates    │ │detect  │ │        │
│  │  │briefs        │ │proposals     │ │         │ │        │ │        │
│  │  │              │ │              │ │         │ │        │ │        │
│  │  │Memory:       │ │Memory:       │ │Memory:  │ │Memory: │ │        │
│  │  │Past patterns │ │Past changes  │ │Score    │ │Past    │ │        │
│  │  │learned       │ │tracked       │ │history  │ │audits  │ │        │
│  │  └──────┬───────┘ └──────┬───────┘ └────┬────┘ └────────┘ │        │
│  └─────────┼────────────────┼──────────────┼─────────────────┘        │
│            │                │              │                           │
│            ▼                ▼              ▼                           │
│  ┌───────────────────── RESPONSE TEAM ────────────────────────┐        │
│  │                                                             │        │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │        │
│  │  │ Alert Router │ │ Notification │ │ SAR Generator │       │        │
│  │  │              │ │    Agent     │ │              │       │        │
│  │  │Auto-assign   │ │Slack/Teams/  │ │FinCEN format │       │        │
│  │  │Load-balance  │ │Email/SMS     │ │Part V draft  │       │        │
│  │  │SLA monitor   │ │Dedup + rate  │ │Evidence cite │       │        │
│  │  │Escalation    │ │limit         │ │Auto-deadline │       │        │
│  │  └──────────────┘ └──────────────┘ └──────────────┘       │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                         │
│  ┌───────────────────── AI ENGINES ───────────────────────────┐        │
│  │                                                             │        │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐│        │
│  │  │ Auto-      │ │ Trajectory │ │ NL Policy  │ │Regulatory││        │
│  │  │ Learning   │ │ Engine     │ │ Builder    │ │Pipeline  ││        │
│  │  │            │ │            │ │            │ │          ││        │
│  │  │Threshold   │ │Projected   │ │English →   │ │Detect →  ││        │
│  │  │adjustment  │ │breach date │ │executable  │ │Propose → ││        │
│  │  │Pattern     │ │Intervention│ │rules       │ │Approve → ││        │
│  │  │discovery   │ │window      │ │            │ │Deploy    ││        │
│  │  │Drift       │ │            │ │            │ │          ││        │
│  │  │detection   │ │            │ │            │ │          ││        │
│  │  └────────────┘ └────────────┘ └────────────┘ └─────────┘│        │
│  └────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Workflow 2: Self-Improving Detection (Auto-Learning)

```
┌─────────────────────────────────────────────────────────────────┐
│              AUTO-LEARNING FEEDBACK LOOP                         │
│                                                                 │
│  Alert Generated                                                │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────┐                                           │
│  │ Analyst Reviews   │                                          │
│  │                   │                                          │
│  │ ┌──────┐ ┌─────┐ │                                          │
│  │ │CONFM.│ │DISM.│ │                                          │
│  │ └──┬───┘ └──┬──┘ │                                          │
│  └────┼────────┼────┘                                           │
│       │        │                                                │
│       ▼        ▼                                                │
│  ┌──────────────────────────────────────┐                      │
│  │      Auto-Learning Engine            │                      │
│  │      (Stores feedback in memory)     │                      │
│  │                                      │                      │
│  │  Analyzes 30-day feedback:           │                      │
│  │  • FP rate > 40%? → Raise threshold  │                      │
│  │  • Recurring pattern? → Discover     │                      │
│  │  • Bias detected? → Alert admin      │                      │
│  │  • Model drift? → Notify             │                      │
│  │                                      │                      │
│  │  Outputs:                            │                      │
│  │  ┌─────────────┐ ┌───────────────┐   │                      │
│  │  │ Threshold   │ │ New Pattern   │   │                      │
│  │  │ Adjustment  │ │ Discovered    │   │                      │
│  │  │             │ │               │   │                      │
│  │  │ "Override   │ │ "finance +    │   │                      │
│  │  │  alert FP   │ │  security +   │   │                      │
│  │  │  rate 45%.  │ │  comms drop   │   │                      │
│  │  │  Raising    │ │  = 70% chance │   │                      │
│  │  │  threshold  │ │  of insider   │   │                      │
│  │  │  from 3 to  │ │  threat"      │   │                      │
│  │  │  5/week"    │ │               │   │                      │
│  │  └─────────────┘ └───────────────┘   │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  Result: System gets smarter with every review.                │
│  Week 1: 40% false positive rate                                │
│  Week 4: 25% (thresholds auto-adjusted)                        │
│  Week 12: 15% (new patterns learned)                           │
│  Week 24: <10% (digital twins calibrated)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow 3: Client Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│              CLIENT ONBOARDING WORKFLOW                          │
│                                                                 │
│  Step 1: DEPLOY                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │ Client chooses deployment mode:      │                      │
│  │                                      │                      │
│  │ Self-Hosted    → docker compose up   │                      │
│  │ Private Cloud  → deploy to their VPC │                      │
│  │ Managed SaaS   → risksradarai.com    │                      │
│  │ Hybrid         → UI cloud + AI local │                      │
│  └──────────────────┬───────────────────┘                      │
│                     │                                          │
│  Step 2: CONFIGURE                                             │
│  ┌──────────────────▼───────────────────┐                      │
│  │ Onboarding Wizard (5 steps):         │                      │
│  │                                      │                      │
│  │ 1. Select industry → auto-configures │                      │
│  │    regulatory frameworks             │                      │
│  │    (Banking → BSA/AML, SOX, GLBA)    │                      │
│  │                                      │                      │
│  │ 2. Connect first integration         │                      │
│  │    (MCP: SAP, Splunk, Workday, etc.) │                      │
│  │                                      │                      │
│  │ 3. Set alert thresholds              │                      │
│  │    (recommended defaults per          │                      │
│  │     industry provided)               │                      │
│  │                                      │                      │
│  │ 4. Invite team (roles auto-mapped)   │                      │
│  │    CCO, CISO, Analyst, Auditor       │                      │
│  │                                      │                      │
│  │ 5. Launch → agents start immediately │                      │
│  └──────────────────┬───────────────────┘                      │
│                     │                                          │
│  Step 3: MONITOR                                               │
│  ┌──────────────────▼───────────────────┐                      │
│  │ Day 1:  Signals flowing              │                      │
│  │ Day 2:  First risk scores calculated │                      │
│  │ Day 3:  First patterns detected      │                      │
│  │ Week 2: Compound risks identified    │                      │
│  │ Week 3: Auto-learning begins tuning  │                      │
│  │ Month 2: Digital twins calibrated    │                      │
│  │ Ongoing: Self-improving detection    │                      │
│  └──────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```
