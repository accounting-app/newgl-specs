---
title: "Epic 1 Session — Scaffold & Contracts Complete"
description: "Completed SPEC Milestone M0: hardened all 3 custom scalars with real validation, added transactionAppended subscription, configured Biome lint/format, wrote 37 new tests covering the full §2.6 contract."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, dev-blog, epic-1, graphql, scalars, testing, biome"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 1 Session — Scaffold & Contracts Complete

**Date:** 2026-06-27
**Epic:** Epic 1 — Scaffold & Contracts
**SPEC Milestone:** M0 — Scaffold & Contracts
**Result:** ✅ All 9 issues completed, all 8 acceptance criteria met

---

## What Changed

### Phase 1: Custom Scalars Hardened

**File:** `src/graphql/scalars.ts`

The three custom scalars were upgraded from "accept anything" stubs to real validators:

- **Decimal** — Now uses `decimal.js` to validate input. Rejects `NaN`, `Infinity`, empty strings, and non-numeric text. This enforces Invariant I4 (arbitrary-precision decimals, never floats) at the API boundary.
- **Date** — Validates `YYYY-MM-DD` format via regex, then verifies the date components are real (rejects `2026-02-30`, `2026-13-01`). Rejects datetime strings.
- **TxId** — Validates 64-character lowercase hex string format (SHA-256 output).

### Phase 2: Schema Completed

**File:** `src/graphql/schema.ts`

- **Added `transactionAppended` subscription** — Stubbed with an async iterator that never yields. The type is visible in introspection so clients can build against it. Real implementation comes in Epic 5 (P2P).
- **Improved stub data** — `trialBalance` now returns sample rows, `journal` returns a sample transaction, `appendTransaction` populates postings from input instead of returning empty arrays.

### Phase 3: Biome Lint/Format

**New file:** `biome.json`
**Modified:** `package.json` (added `lint`, `lint:fix`, `format` scripts)

Configured Biome 2.5.1 with:
- Recommended lint rules
- `useConst` enforcement
- Import organization
- 2-space indent, 120-char line width, double quotes, trailing commas

### Phase 4: Comprehensive Tests

**New file:** `test/schema.test.ts`

37 new tests covering the full §2.6 contract:
- 9 scalar validation tests (valid + invalid for each scalar)
- 11 output type introspection tests (all §2.6 types)
- 3 input type introspection tests
- 9 query execution tests (realistic data verification)
- 3 mutation execution tests (input acceptance + response shape)
- 2 subscription introspection tests

---

## Verification Results

```
bun test v1.3.14

 41 pass
  0 fail
136 expect() calls
Ran 41 tests across 2 files. [44.00ms]
```

```
bunx @biomejs/biome check src/ test/
Checked 5 files in 6ms. No fixes applied.
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/graphql/scalars.ts` | Hardened all 3 scalars with real validation |
| `src/graphql/schema.ts` | Added subscription type, improved stub data |
| `src/index.ts` | Formatting only (Biome auto-fix) |
| `biome.json` | **NEW** — Biome 2.5.1 configuration |
| `package.json` | Added lint/format scripts |
| `test/schema.test.ts` | **NEW** — 37 comprehensive §2.6 contract tests |
| `test/scaffold.test.ts` | Formatting only (Biome auto-fix) |
