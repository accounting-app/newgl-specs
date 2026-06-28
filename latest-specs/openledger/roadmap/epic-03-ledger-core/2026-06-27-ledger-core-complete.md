---
title: "Epic 3 Session — Ledger Core & Double-Entry Validation Complete"
description: "Implemented DAG structure, validation pipeline, account registry, ledger service orchestrator, config loading, and all conformance tests (CT-1, CT-2, CT-3, CT-7, CT-11). 135 tests pass."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, epic-3, ledger-core, double-entry, validation, dag, conformance"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 3 — Ledger Core & Double-Entry Validation

**Date:** 2026-06-27
**Session:** Single session — all 8 issues completed
**SPEC Milestone:** M2

---

## What Changed

### New Source Files

| File | Purpose |
|------|---------|
| `src/ledger/config.ts` | Loads and validates `gl-node.config.json` — ledger path, external file edits, signing toggle |
| `src/ledger/accountRegistry.ts` | Tracks account open/close state for I3 enforcement |
| `src/ledger/dag.ts` | Content-addressed Merkle-DAG — nodes, heads, topo sort with (date, Lamport, txid) tie-breaking |
| `src/ledger/validate.ts` | Double-entry validation pipeline — elision resolution (I2), balance check (I1), account validity (I3) |
| `src/ledger/service.ts` | Orchestrator — boot from .bean, validate → DAG → serialize → atomic write, lookups |

### Modified Files

| File | Change |
|------|--------|
| `src/graphql/schema.ts` | Refactored to `buildSchema(ledgerService)` factory; mutations now wire to real validation + DAG |
| `src/index.ts` | Boots `LedgerService` from config, passes to schema; health endpoint reports real DAG state |

### New Test Files

| File | Conformance | Tests |
|------|-------------|-------|
| `test/dag.test.ts` | — | 16 tests: insertion, heads, topo sort, deterministic ordering |
| `test/validation.test.ts` | CT-1, CT-2, CT-7 | 25 tests: balance, elision, account validity (property-based + unit) |
| `test/txid-stability.test.ts` | CT-3 | 11 tests: txid stability, field sensitivity, round-trip |
| `test/config.test.ts` | CT-11 | 10 tests: config loading + external edit detection |
| `test/service.test.ts` | — | 22 tests: boot, accounts, transactions, lookups, lifecycle |

---

## Verification Results

```
135 pass, 0 fail, 764 expect() calls
Ran 135 tests across 7 files in 68ms
```

**Conformance obligations status:**

| Obligation | Status | What it covers |
|------------|--------|----------------|
| **CT-1** | ✅ Pass | Property-based: balanced transactions have zero sums; perturbations detected |
| **CT-2** | ✅ Pass | Property-based: one elided resolves; two elided rejected |
| **CT-3** | ✅ Pass | Property-based: txid stable across runs; field changes → different txid |
| **CT-7** | ✅ Pass | Property-based: unopened/closed accounts rejected |
| **CT-11** | ✅ Pass | External edit detected when disabled; boot refused |

**Dev server:** boots clean, health endpoint returns real DAG state.

---

## Key Design Decisions

1. **LedgerService as singleton** — single instance per node, consistent with C6 (single-tenant). Passed to schema via `buildSchema()` factory.

2. **Lamport timestamps** — implemented as a simple monotonic counter. Sufficient for single-node (Epic 3); ready for P2P vector clocks (Epic 5).

3. **Boot-time DAG derivation** — `.bean` is the source of truth (C1). On boot, transactions are parsed, txids computed, and a linear DAG chain is derived from file order.

4. **Atomic writes** — temp file + `rename()` per §3.3. No partial writes possible.

5. **`buildSchema()` factory** — replaced static schema export with a factory that accepts `LedgerService`. Backward-compatible static export preserved for existing tests.

---

## Files Modified

```
src/ledger/config.ts         (NEW — 120 lines)
src/ledger/accountRegistry.ts (NEW — 215 lines)
src/ledger/dag.ts            (NEW — 295 lines)
src/ledger/validate.ts       (NEW — 300 lines)
src/ledger/service.ts        (NEW — 310 lines)
src/graphql/schema.ts        (MODIFIED — 380 lines)
src/index.ts                 (MODIFIED — 36 lines)
test/dag.test.ts             (NEW — 260 lines)
test/validation.test.ts      (NEW — 565 lines)
test/txid-stability.test.ts  (NEW — 255 lines)
test/config.test.ts          (NEW — 215 lines)
test/service.test.ts         (NEW — 390 lines)
```
