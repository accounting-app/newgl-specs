---
title: "Epic 1 — Scaffold & Contracts"
description: "SPEC Milestone M0 — Pothos schema matching §2.6, Yoga on Elysia, all resolvers stubbed, custom scalars. Done when schema introspects and stubs return typed placeholders."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-1, scaffold, graphql, pothos, elysia"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 1 — Scaffold & Contracts

**Status:** ✅ Done
**Priority:** 🔴 Critical
**Estimated Sessions:** ~1
**SPEC Milestone:** M0 — Scaffold & Contracts
**Scope:** GraphQL schema, scalars, stubbed resolvers, project configuration

---

## Context

From SPEC §4, Milestone M0:

> - Repo, Bun project, lint/format, CI (`bun test`).
> - Pothos schema matching §2.6; Yoga mounted on Elysia; all resolvers stubbed.
> - Decimal + Date + TxId scalars.
> - *Done when:* schema introspects and stubs return typed placeholders.

Epic 0 (GSX Bootstrap) already created the project skeleton and basic stubs. This epic **completes** M0 by ensuring every type, query, mutation, and subscription in §2.6 is fully represented in the Pothos schema with realistic placeholder data, and that lint/format tooling is configured.

---

## Dependencies

- **Epic 0** — GSX Bootstrap ✅ (provides `package.json`, `src/index.ts`, basic schema stub)

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ✅ | Complete Pothos schema — all types from §2.6 with full field coverage | feature | critical |
| ✅ | Implement `Decimal` scalar — string-serialized, validated as arbitrary-precision | feature | critical |
| ✅ | Implement `Date` scalar — ISO-8601 calendar date, validated | feature | critical |
| ✅ | Implement `TxId` scalar — hex string content hash | feature | high |
| ✅ | Stub all Query resolvers — return typed placeholder data | feature | high |
| ✅ | Stub all Mutation resolvers — accept valid input, return placeholder results | feature | high |
| ✅ | Stub Subscription `transactionAppended` | feature | medium |
| ✅ | Configure lint/format (Biome or equivalent Bun-native) | infra | medium |
| ✅ | Add schema introspection test — verify all §2.6 fields are present | feature | high |

---

## Implementation Plan

### Phase 1: Custom Scalars

#### [MODIFY] `src/graphql/scalars.ts`

Replace stubs with real scalar implementations:

- **Decimal**: serialize as string; parse validates it's a valid decimal (not `NaN`, not `Infinity`, not a bare number-as-float). Use `decimal.js` for validation.
- **Date**: serialize as `YYYY-MM-DD`; parse validates ISO-8601 calendar date (not datetime).
- **TxId**: serialize as lowercase hex string; parse validates hex format and length.

### Phase 2: Complete Schema

#### [MODIFY] `src/graphql/schema.ts`

Ensure every type in SPEC §2.6 is fully implemented in Pothos:

**Output types:** `Amount`, `Posting`, `Transaction`, `AccountBalance`, `TrialBalanceRow`, `TrialBalance`, `BalanceSheet`, `IncomeStatement`, `VerifyResult`, `Health`, `Peer`

**Input types:** `AmountInput`, `PostingInput`, `TransactionInput`

**Queries:** `trialBalance`, `balanceSheet`, `incomeStatement`, `journal`, `transaction`, `account`, `verify`, `health`, `peers`

**Mutations:** `appendTransaction`, `openAccount`, `closeAccount`

**Subscription:** `transactionAppended`

All resolvers return realistic placeholder data that matches the expected types. This is NOT production logic — it's typed stubs that prove the contract is implemented.

### Phase 3: Lint & Format

Configure Biome (or `bunx @biomejs/biome`) for:
- Full-word identifiers check (C8 — custom rule or naming convention enforcement)
- TypeScript strict mode
- Import ordering
- Format on save

### Phase 4: Tests

#### [NEW] `test/schema.test.ts`

Introspection test that verifies all §2.6 query/mutation/subscription fields exist in the schema. This is the M0 "done when" gate.

---

## Acceptance Criteria

- [x] All §2.6 types have matching Pothos definitions
- [x] All 3 custom scalars validate input and serialize correctly
- [x] All 9 queries return typed placeholder data
- [x] All 3 mutations accept valid input and return results
- [x] Subscription type exists in schema
- [x] Lint passes with no warnings
- [x] `bun test` passes schema introspection test
- [x] GraphQL Playground at `/graphql` shows full schema documentation

---

## Session Checklist

1. [x] Read SPEC §2.6 (GraphQL contract) for exact types
2. [x] Implement Decimal, Date, TxId scalars with validation
3. [x] Complete all Pothos type definitions
4. [x] Complete all query/mutation/subscription stubs
5. [x] Configure lint/format tooling
6. [x] Write schema introspection test
7. [x] Verify all ACs pass
8. [x] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-06-27 | All 9 issues | Epic 1 Scaffold & Contracts Session | Scalars hardened with decimal.js/regex validation, subscription added, Biome lint configured, 41 tests passing (37 new + 4 existing) |
