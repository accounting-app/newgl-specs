---
title: "Epic 4 — Reports & Read Model"
description: "SPEC Milestone M3 — In-memory indices, incremental updates, financial reports (trial balance, balance sheet, income statement, journal)."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-4, reports, read-model, indices"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 4 — Reports & Read Model

**Status:** ✅ Done
**Priority:** 🔴 High
**Estimated Sessions:** ~2
**SPEC Milestone:** M3 — Read model & reports (FR-2)
**Scope:** `src/ledger/readModel.ts`, report resolvers

---

## Context

From SPEC §4, Milestone M3:

> - Indices (§3.7); incremental update on append.
> - `trialBalance`, `balanceSheet`, `incomeStatement`, `journal`, `account`.
> - Perf gate: report latency from index, not file.
> - *Done when:* FR-2 AC1–AC5 pass.

---

## Dependencies

- **Epic 3** — Ledger Core ✅ (provides DAG, validation, append pipeline)

---

## Conformance Obligations

| Obligation | Invariant | What the property asserts |
|------------|-----------|---------------------------|
| **CT-4** | I6 | Union-merge by txid yields identical aggregate balances regardless of order |

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ✅ | Build in-memory account tree index — hierarchy + open/close state (§3.7) | feature | critical |
| ✅ | Build running balances index — per account, per currency, `at: Date` support | feature | critical |
| ✅ | Build postings-by-account index — for `journal(account)` and `account()` | feature | high |
| ✅ | Build by-date index — for period reports and journal pagination | feature | high |
| ✅ | Implement incremental index updates on append (not full rebuild) | feature | high |
| ✅ | Wire `trialBalance` resolver — total debits == total credits (FR-2 AC1) | feature | critical |
| ✅ | Wire `balanceSheet` resolver — Assets = Liabilities + Equity (FR-2 AC2) | feature | critical |
| ✅ | Wire `incomeStatement` resolver — period Income/Expenses + net (FR-2 AC3) | feature | critical |
| ✅ | Wire `journal` resolver — deterministic display order (FR-2 AC4) | feature | high |
| ✅ | Wire `account` resolver — single account balance (FR-2 AC5) | feature | high |
| ✅ | Perf gate: benchmark proves reports read from index, never re-parse file | feature | high |
| ✅ | CT-4: Union-merge commutativity test | feature | critical |

---

## Session Checklist

1. [x] Read SPEC §3.7 (read model & indices), FR-2 (report acceptance criteria)
2. [x] Design index data structures (account tree, running balances, posting lists)
3. [x] Implement index build on boot (from parsed transactions)
4. [x] Implement incremental update on append
5. [x] Wire all 5 report resolvers
6. [x] Write perf benchmark
7. [x] Write CT-4 property-based test
8. [x] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-06-27 | All 12 issues | [Epic 4 Session](eb4f63c8) | ReadModel with 4 indices, 5 report resolvers wired, CT-4 property test (100 runs), perf gate (3 strategies). 168 tests pass, 0 fail. |
