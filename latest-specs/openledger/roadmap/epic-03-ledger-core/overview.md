---
title: "Epic 3 — Ledger Core & Double-Entry Validation"
description: "SPEC Milestone M2 — DAG structure, validation pipeline, appendTransaction, openAccount, closeAccount. Enforces I1–I4."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-3, ledger, double-entry, validation, dag"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 3 — Ledger Core & Double-Entry Validation

**Status:** ✅ Done
**Priority:** 🔴 High
**Estimated Sessions:** ~2–3
**SPEC Milestone:** M2 — Ledger core & double-entry (C2, C3, I1–I4)
**Scope:** `src/ledger/dag.ts`, `src/ledger/validate.ts`, resolver wiring

---

## Context

From SPEC §4, Milestone M2:

> - DAG structure, heads, topo order (§3.4).
> - Validation pipeline (§3.5) with property-based tests for I1/I2.
> - `appendTransaction`, `openAccount`, `closeAccount` wired to real logic.
> - *Done when:* FR-1, FR-3 acceptance criteria pass.

This is where the ledger becomes **real** — transactions are validated, stored in the DAG, and serialized to `.bean`.

---

## Dependencies

- **Epic 2** — Beancount Parser & Serializer ✅ (provides parse/serialize/txid)

---

## Conformance Obligations

| Obligation | Invariant | What the property asserts |
|------------|-----------|---------------------------|
| **CT-1** | I1 | Per-currency posting sums are zero; perturbing any amount is detected |
| **CT-2** | I2 | One elided posting resolves balanced; two elided postings are rejected |
| **CT-3** | I5 | `txid` is stable across runs and identical for structurally identical transactions |
| **CT-7** | I3 | Postings to unopened/closed accounts are rejected |
| **CT-11** | §3.3 | External edits disabled → node refuses to boot on unexpected file change |

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ✅ | Implement DAG structure — txid nodes, parent links, head tracking, topological order (§3.4) | feature | critical |
| ✅ | Implement double-entry validation pipeline (§3.5) — elision resolution, per-currency balance check, decimal arithmetic | feature | critical |
| ✅ | Implement account open/close validation (I3) | feature | critical |
| ✅ | Wire `appendTransaction` mutation to real validation + DAG + serialize pipeline | feature | critical |
| ✅ | Wire `openAccount` / `closeAccount` mutations | feature | high |
| ✅ | Implement `gl-node.config.json` loading — `externalFileEdits` setting (§3.3) | feature | high |
| ✅ | Property-based tests: CT-1 (balance), CT-2 (elision), CT-3 (txid stability), CT-7 (open/close) | feature | critical |
| ✅ | CT-11: External edit detection when disabled | feature | medium |

---

## Session Checklist

1. [x] Read SPEC §3.4 (consistency & replication protocol), §3.5 (double-entry validation)
2. [x] Implement DAG with txid-keyed nodes, parent tracking, head management
3. [x] Implement topological sort with deterministic tie-breaking (date, Lamport, txid)
4. [x] Implement validation pipeline: elision → balance check → account check
5. [x] Wire mutations to real logic (validate → DAG → serialize → write `.bean`)
6. [x] Write property-based tests for all conformance obligations
7. [x] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-06-27 | All 8 issues | [Epic 3 Session](57f34c14-0060-4196-ab23-97521721e623) | DAG, validation pipeline, account registry, service orchestrator, config loader. CT-1/CT-2/CT-3/CT-7/CT-11 all pass. 135 tests pass. |
