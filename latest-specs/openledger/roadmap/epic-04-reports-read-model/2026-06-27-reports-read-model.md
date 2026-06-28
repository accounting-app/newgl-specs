---
title: "Epic 4 — Reports & Read Model — Session 1"
description: "Implemented all 12 issues for Epic 4: ReadModel with 4 in-memory indices, 5 financial report resolvers, CT-4 conformance test, and perf gate."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, epic-4, read-model, reports, indices, session"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 4 — Session 1: Reports & Read Model

**Date:** 2026-06-27
**Conversation:** eb4f63c8
**Issues Completed:** 12/12 (all)

---

## What Changed

### New Files

| File | Purpose |
|------|---------|
| `src/ledger/readModel.ts` | ReadModel class with 4 in-memory indices and 5 report methods |
| `test/readModel.test.ts` | 26 unit tests covering all indices and FR-2 acceptance criteria |
| `test/ct4-merge-commutativity.test.ts` | CT-4 property-based test (I6 — union-merge commutativity) |
| `test/perfGate.test.ts` | Perf gate proving reports never re-parse the .bean file |

### Modified Files

| File | Changes |
|------|---------|
| `src/ledger/service.ts` | Integrated ReadModel — build on boot, incremental on append, 4 new report methods |
| `src/graphql/schema.ts` | Replaced 5 stub resolvers with real calls to LedgerService |

### Index Data Structures

| Index | Structure | Purpose |
|-------|-----------|---------|
| **Running balances** | `Map<account, Map<currency, Decimal>>` | trialBalance, balanceSheet, account queries |
| **Postings-by-account** | `Map<account, DagNode[]>` | journal(account) and account() |
| **By-date** | `DagNode[]` sorted by (date, lamport, txid) | Period reports, date filtering, pagination |
| **Known accounts** | `Set<string>` | Account enumeration for reports |

### Report Methods Implemented

| Report | FR-2 AC | Key Property |
|--------|---------|-------------|
| `trialBalance(at)` | AC1 | totalDebit === totalCredit |
| `balanceSheet(at)` | AC2 | Assets / Liabilities / Equity categories |
| `incomeStatement(from, to)` | AC3 | Net = Income − Expenses |
| `journal(filters)` | AC4 | Deterministic display order |
| `accountBalance(name, at?)` | AC5 | Single account balance with date filter |

---

## Verification Results

```
168 pass, 0 fail, 1070 expect() calls
Ran 168 tests across 10 files. [94.00ms]
```

### FR-2 Acceptance Criteria

| AC | Status | Evidence |
|----|--------|----------|
| AC1: totalDebit == totalCredit | ✅ | `readModel.test.ts` — verified with deterministic and property-based tests |
| AC2: Balance sheet categories | ✅ | `readModel.test.ts` — correct account classification, positive display |
| AC3: Period income statement | ✅ | `readModel.test.ts` — period filtering, net calculation |
| AC4: Deterministic journal order | ✅ | `readModel.test.ts` — matches DAG topological order |
| AC5: Reports from index | ✅ | `perfGate.test.ts` — 3 strategies proving no file re-parse |

### Conformance Obligation

| Obligation | Status | Evidence |
|------------|--------|----------|
| CT-4 (I6) | ✅ | `ct4-merge-commutativity.test.ts` — 100 fast-check runs, both orders identical |

### Perf Gate

| Strategy | Result |
|----------|--------|
| ReadModel serves reports with no file system | ✅ |
| 500 queries in <1s, avg <1ms per query | ✅ (6.39ms for 500 = 0.013ms avg) |
| Delete .bean after boot → reports still work | ✅ |

---

## Design Decisions

1. **One row per (account, currency)** in trial balance — faithful to the multi-currency domain model.
2. **Flat leaf accounts** in balance sheet — no hierarchy grouping yet (can layer on later).
3. **Net = Income − Expenses** — positive net = net income (standard accounting convention).
4. **Credit-normal accounts display as positive** in balance sheet — Liabilities/Equity negated from internal storage for display.
5. **Incremental update is O(postings)** per append — no full index rebuild needed.
