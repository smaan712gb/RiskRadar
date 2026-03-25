# AML & Financial Crime — Workflow Diagrams

## Product Overview
Complete BSA/AML monitoring with automated SAR generation — powered by OpenClaw agents with CFE/CAMS-level expertise.

---

## Workflow 1: Transaction Override Detection

```
┌─────────────────────────────────────────────────────────────────┐
│                 TRANSACTION OVERRIDE MONITORING                  │
│                                                                 │
│  Core Banking System (SAP, Oracle, Fiserv)                      │
│  ┌──────────────┐                                               │
│  │ Transaction   │──── MCP: postgres ────┐                      │
│  │ Override Log  │                       │                      │
│  └──────────────┘                       ▼                      │
│                              ┌──────────────────┐              │
│  HRIS Calendar               │ Finance Collector │              │
│  ┌──────────────┐            │   (OpenClaw Agent)│              │
│  │ Supervisor    │──────────▶│                   │              │
│  │ PTO Schedule  │            │ Skills:           │              │
│  └──────────────┘            │ • Benford's Law   │              │
│                              │ • Override Pattern │              │
│                              │ • Structuring Det. │              │
│                              └────────┬─────────┘              │
│                                       │                         │
│                                       ▼                         │
│                              ┌──────────────────┐              │
│                              │ Is override count │              │
│                              │ > 3 in 7 days AND │              │
│                              │ supervisor absent? │              │
│                              └──┬──────────┬────┘              │
│                            NO   │          │  YES               │
│                                 ▼          ▼                    │
│                          ┌──────────┐ ┌──────────────┐         │
│                          │ Continue  │ │ Emit Signal: │         │
│                          │ Monitor   │ │ override_    │         │
│                          └──────────┘ │ transaction   │         │
│                                       └──────┬───────┘         │
│                                              │                  │
│                                              ▼                  │
│                                    ┌──────────────────┐        │
│                                    │   Fusion Agent    │        │
│                                    │ Cross-correlate:  │        │
│                                    │ + Security signals│        │
│                                    │ + HR signals      │        │
│                                    │ + Comms signals   │        │
│                                    └────────┬─────────┘        │
│                                             │                   │
│                                             ▼                   │
│                                    ┌──────────────────┐        │
│                                    │ Compound Score    │        │
│                                    │ > 50? Generate    │        │
│                                    │ Evidence Brief    │        │
│                                    └────────┬─────────┘        │
│                                             │                   │
│                                             ▼                   │
│                                    ┌──────────────────┐        │
│                                    │   Alert Router    │        │
│                                    │ Auto-assign to    │        │
│                                    │ BSA Officer       │        │
│                                    │ Notify via Slack  │        │
│                                    └────────┬─────────┘        │
│                                             │                   │
│                                             ▼                   │
│                                    ┌──────────────────┐        │
│                                    │ BSA Officer       │        │
│                                    │ Reviews in        │        │
│                                    │ Dashboard         │        │
│                                    │ ┌──────┐ ┌─────┐ │        │
│                                    │ │Confirm│ │Dism.│ │        │
│                                    │ └──┬───┘ └──┬──┘ │        │
│                                    └────┼────────┼────┘        │
│                                    ┌────▼────┐ ┌─▼──────────┐  │
│                                    │Escalate │ │ Feedback    │  │
│                                    │to Case  │ │ → Auto-     │  │
│                                    │+ SAR    │ │ Learning    │  │
│                                    └─────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow 2: SAR Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│              SAR AUTO-GENERATION PIPELINE                        │
│                                                                 │
│  Case Confirmed by BSA Officer                                  │
│          │                                                      │
│          ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  SAR Generator    │ (OpenClaw Agent)                         │
│  │  Agent            │                                          │
│  │                   │                                          │
│  │  Collects:        │                                          │
│  │  • Alert evidence │                                          │
│  │  • Transaction IDs│                                          │
│  │  • Subject info   │                                          │
│  │  • Timeline       │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  DeepSeek V3.2    │                                          │
│  │  Generates:       │                                          │
│  │  • Part V         │                                          │
│  │    Narrative      │                                          │
│  │  • Subject Info   │                                          │
│  │  • Activity Desc  │                                          │
│  │  • Evidence Cites │                                          │
│  │  • Reg References │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  SAR Draft        │                                          │
│  │  Status: DRAFT    │                                          │
│  │                   │                                          │
│  │  Filing Deadline: │                                          │
│  │  30 days from     │                                          │
│  │  detection        │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │  BSA Officer      │────▶│  Edit Narrative  │                  │
│  │  Reviews Draft    │     │  Add Details     │                  │
│  └────────┬─────────┘     └──────────────────┘                  │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  APPROVE          │                                          │
│  │  Status: APPROVED │                                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │  BSA E-Filing     │────▶│  Audit Trail     │                  │
│  │  System           │     │  (Immutable)     │                  │
│  └──────────────────┘     │  Who approved    │                  │
│                           │  When filed      │                  │
│                           │  What changed    │                  │
│                           └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow 3: Structuring/Smurfing Detection

```
┌─────────────────────────────────────────────────────────────────┐
│              STRUCTURING DETECTION                               │
│                                                                 │
│  Transaction Stream (real-time)                                 │
│          │                                                      │
│          ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Finance Collector │                                          │
│  │                   │                                          │
│  │ For each txn:     │                                          │
│  │ ┌───────────────┐ │                                          │
│  │ │ Amount $8,500- │ │  ← Just below $10K CTR threshold       │
│  │ │ $9,999?        │ │                                          │
│  │ └───┬───────┬───┘ │                                          │
│  │  NO │    YES│     │                                          │
│  │     │       ▼     │                                          │
│  │     │ ┌─────────┐ │                                          │
│  │     │ │ Same    │ │                                          │
│  │     │ │ person, │ │                                          │
│  │     │ │ same    │ │                                          │
│  │     │ │ day?    │ │                                          │
│  │     │ └──┬──┬──┘ │                                          │
│  │     │ NO │  │YES │                                          │
│  │     │    │  ▼    │                                          │
│  │     │    │┌────┐ │                                          │
│  │     │    ││Agg.│ │  ← Multiple txns aggregate > $10K       │
│  │     │    ││>10K│ │                                          │
│  │     │    │└─┬──┘ │                                          │
│  └─────┼────┼──┼────┘                                          │
│        │    │  │                                                │
│        │    │  ▼                                                │
│        │    │ ┌──────────────────┐                              │
│        │    │ │ SIGNAL:           │                              │
│        │    │ │ unusual_amount    │                              │
│        │    │ │ + Round number    │                              │
│        │    │ │   analysis        │                              │
│        │    │ │ + Benford's Law   │                              │
│        │    │ │   chi-square test │                              │
│        │    │ └────────┬─────────┘                              │
│        │    │          │                                        │
│        │    │          ▼                                        │
│        │    │ ┌──────────────────┐                              │
│        │    │ │ Alert: STRUCTURING│                              │
│        │    │ │ Severity: HIGH   │                              │
│        │    │ │ Reg: 31 CFR      │                              │
│        │    │ │ 1010.311 (CTR)   │                              │
│        │    │ └──────────────────┘                              │
│        │    │                                                   │
└────────┼────┼───────────────────────────────────────────────────┘
```

---

## Key Metrics

| Metric | Target | Measurement |
|---|---|---|
| Override detection rate | >95% | Overrides flagged / total overrides |
| SAR filing timeliness | 100% within 30 days | Filing date vs detection date |
| False positive rate | <20% | Dismissed / total alerts |
| Structuring detection | >90% | Patterns caught / known structuring |
| SAR draft time | <20 minutes | AI draft generation time |
| BSA exam readiness | 100% | Audit trail completeness |
