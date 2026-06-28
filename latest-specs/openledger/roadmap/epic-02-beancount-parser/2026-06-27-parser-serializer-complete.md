---
title: "Epic 2 Session 1 — Parser & Serializer Complete"
description: "Implemented the Beancount parser, canonical serializer, txid hashing, round-trip tests (CT-5), golden corpus tests (CT-6), and ADR-001. All 7 issues resolved in a single session."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, dev-blog, epic-2, parser, serializer, beancount, round-trip, session-1"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 2 Session 1 — Parser & Serializer Complete

**Date:** 2026-06-27
**Epic:** Epic 2 — Beancount Parser & Canonical Serializer (M1)
**Issues completed:** All 7
**Tests:** 49 pass, 0 fail, 596 expect() calls

---

## What Changed

### New Files Created (8 files)

| File | Purpose |
|------|---------|
| `src/ledger/types.ts` | Domain types for all 10 Beancount directive types (§2.3) |
| `src/ledger/parse.ts` | Hand-written recursive-descent Beancount parser |
| `src/ledger/serialize.ts` | Deterministic canonical serializer (C4) |
| `src/ledger/hash.ts` | `txid` SHA-256 content hashing (I5) |
| `test/roundtrip.test.ts` | CT-5 round-trip property tests + I5 txid stability |
| `test/golden-corpus.test.ts` | CT-6 golden corpus round-trip tests |
| `test/fixtures/*.bean` | 5 golden `.bean` test corpus files |
| `docs/adr/001-canonical-format.md` | Canonical format ADR |

### Key Design Decisions

1. **Hand-written parser** over wrapping an existing Beancount parser — no viable npm package exists, and we need full control for round-trip fidelity (documented in ADR-001).

2. **Canonical ordering** uses a three-level sort key: `(date, type_priority, stable_key)`. This ensures `open` directives come before transactions which come before `close` within the same date.

3. **Amount alignment** — posting amounts are right-aligned to column 52 for readable `.bean` output.

4. **Comment preservation** — top-level comments are preserved as `CommentLine` entries for round-trip fidelity.

5. **All amounts use `decimal.js`** (I4) — no floating point touches money anywhere in the ledger module.

---

## Verification Results

```
bun test v1.3.14

49 pass
 0 fail
596 expect() calls
Ran 49 tests across 2 files. [32.00ms]
```

### Conformance Gates

| Obligation | Status | Notes |
|------------|--------|-------|
| **CT-5** | ✅ Pass | Round-trips all 10 directive types individually and in combination |
| **CT-6** | ✅ Pass | Round-trips all 5 golden corpus files with triple round-trip byte-identity |
| **I5** | ✅ Pass | txid stable across 100 computations, changes on any field mutation |

### Golden Corpus Files

| File | Directive types covered |
|------|----------------------|
| `simple-transactions.bean` | open, transaction (flags, tags, links) |
| `multi-currency.bean` | open, transaction (cost, price) |
| `full-directives.bean` | All 10 types in one file |
| `edge-cases.bean` | Unicode payees, deep accounts, escaped strings, many tags |
| `metadata.bean` | Metadata on open, transaction, commodity, note |

---

## Files Modified

No existing files were modified — this epic is purely additive.

---

## Next Steps

Epic 2 is ✅ Done. The next epic on the critical path is:

**Epic 3 — Ledger Core & Double-Entry (M2)** — DAG structure, validation pipeline (I1/I2), `appendTransaction`, `openAccount`, `closeAccount`.
