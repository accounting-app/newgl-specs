# Issue Tracker Workflow — OpenLedger

> **Purpose**: Guide for managing issues across the OpenLedger project.
> Issues are tracked in the gsx-wiki epic pages (issue tables in each `overview.md`).

---

## Issue Tracking — Current Approach

OpenLedger tracks issues **inside epic overview pages** in gsx-wiki:

```
gsx-wiki/projects/openledger/roadmap/epic-NN-<slug>/overview.md
```

Each epic has an **Issues** table:

```markdown
| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Implement Decimal scalar | feature | critical |
| ✅ | Create Pothos schema stub | feature | high |
```

### Issue Types

| Type | Description |
|------|-------------|
| `feature` | New functionality from the SPEC |
| `spec-change` | Modification to SPEC.md (requires spec PR) |
| `invariant-violation` | A conformance test (CT-*) is failing |
| `infra` | Tooling, CI, documentation, scaffolding |
| `spike` | Time-boxed investigation (e.g., CRDT choice) |
| `bug` | Defect in existing implementation |

### Severity Levels

| Severity | Description |
|----------|-------------|
| `critical` | Blocks milestone completion — conformance obligation |
| `high` | Required for milestone but not a conformance gate |
| `medium` | Improves quality but milestone can complete without it |
| `low` | Nice-to-have, can be deferred |

---

## Creating Issues

When you discover new work during a session:

1. Add it to the relevant epic's issues table
2. If it spans multiple epics, add it to the most appropriate one
3. If it doesn't fit any existing epic, note it in the session dev blog and flag for roadmap review

---

## SPEC Traceability

Every issue should trace back to a SPEC section:

```markdown
| ⬜ | Implement double-entry validation (I1, I2) — SPEC §3.5 | feature | critical |
```

> ⚠️ **SPEC rule (§0, Rule 1):** No code without a spec section it satisfies. If you're about to write something not traceable to §2 (Specification) or §3 (Plan), stop and amend the spec first.
