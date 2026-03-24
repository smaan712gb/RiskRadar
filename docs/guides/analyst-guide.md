# RisksRadarAI — Analyst User Guide

## Your Role

As an Analyst, you review AI-generated alerts, investigate evidence, confirm or dismiss findings, and escalate confirmed risks to cases. You are the human-in-the-loop that ensures AI findings are accurate before any action is taken.

---

## Daily Workflow

### 1. Check Alert Queue

Go to **Alerts** in the sidebar. Your queue shows alerts assigned to you, sorted by severity.

| Severity | Response Time | Action |
|---|---|---|
| **Critical** | Within 2 hours | Review immediately, escalate if confirmed |
| **High** | Within 8 hours | Review same day |
| **Medium** | Within 24 hours | Review within 1 business day |
| **Low** | Within 72 hours | Review when time permits |

### 2. Review an Alert

Click any alert to see the full evidence brief:

**Evidence Tab** — Chronological chain of signals with source citations
- Each item shows: timestamp, description, source system, significance
- Click source references to verify the original data

**Reasoning Tab** — AI's chain-of-thought explanation
- Shows which model was used (Nemotron-Super or Cascade-2)
- Explains WHY the signals collectively indicate risk
- Lists alternative explanations that were considered

**Regulatory Tab** — Applicable regulations
- Automatically mapped by the regulatory knowledge engine
- Shows specific sections and relevance level (direct/related)

**Actions Tab** — Recommended next steps
- Priority-ordered (immediate, 24h, 72h, 1 week)
- Checkboxes to track completion

**Timeline Tab** — Visual event timeline

### 3. Make a Decision

You have three options:

**Confirm** — The alert is legitimate
- Add review notes explaining your reasoning
- Alert moves to "Confirmed" status
- Your feedback improves future AI accuracy

**Dismiss** — The alert is a false positive
- You MUST provide a dismiss reason
- Common reasons: "Authorized activity", "Known business process", "Incorrect correlation"
- Your feedback tunes adaptive thresholds (fewer false positives over time)

**Escalate** — Create a formal investigation case
- Click "Escalate to Case"
- A case is auto-created with all evidence linked
- SLA timer starts based on severity
- Assigned to you or a manager

### 4. Manage Cases

In **Cases**, you see your open investigations:
- Add investigation notes as comments
- Attach additional evidence
- Request SAR draft (for BSA/AML cases)
- Close with resolution: Confirmed, False Positive, or No Action

---

## Key Shortcuts

| Action | Where |
|---|---|
| View all your alerts | Alerts → filter by "Assigned to me" |
| See risk scores | Risk Scores → sort by score descending |
| Check signal feed | Signals → live feed with domain filtering |
| Review policies | Policies → see what triggers alerts |
| Export audit trail | Audit Log → Export button (for regulatory requests) |

## Tips

- **Always check the Evidence Chain first** — it's the most important tab
- **Verify source data** before confirming — click through to the original system
- **Write clear dismiss reasons** — they train the AI to reduce similar false positives
- **Don't skip the Reasoning tab** — understanding WHY the AI flagged something helps you make better decisions
- **Use review notes** — future analysts (and regulators) will see your reasoning

---

## Understanding Risk Scores

| Score | Level | What It Means |
|---|---|---|
| 75-100 | Critical | Multiple correlated signals across domains. Immediate attention required. |
| 50-74 | High | Strong pattern detected. Same-day review recommended. |
| 25-49 | Medium | Emerging pattern. Monitor and review within 1-2 days. |
| 0-24 | Low | Isolated signals. Continue standard monitoring. |

### Trajectory

- **Accelerating** ↑↑ — Risk is increasing. Check projected breach date.
- **Stable** → — Risk level unchanged. Continue monitoring.
- **Declining** ↓ — Risk decreasing. Previous interventions may be working.
