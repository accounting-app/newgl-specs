---
title: "Epic 2 — Beancount Parser & Canonical Serializer"
description: "SPEC Milestone M1 — Parser for Beancount directive subset, deterministic canonical serializer, round-trip stability (I7), txid hashing (I5)."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-2, parser, serializer, beancount, round-trip"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 2 — Beancount Parser & Canonical Serializer

**Status:** ✅ Done
**Priority:** 🔴 Critical
**Estimated Sessions:** ~2–3
**SPEC Milestone:** M1 — Beancount parse & canonical serialize (C1, C4)
**Scope:** `src/ledger/parse.ts`, `src/ledger/serialize.ts`

---

## Context

From SPEC §4, Milestone M1:

> - Parser for the directive subset in §2.3 (or wrap an existing Beancount parser and normalize).
> - Deterministic canonical serializer; round-trip test (I7).
> - `txid` hashing (I5).
> - *Done when:* parse→serialize→parse is stable and byte-identical across runs.

This is the **keystone epic** — `.bean` is the source of truth (C1) and deterministic serialization (C4) is what makes P2P merge possible.

---

## Dependencies

- **Epic 1** — Scaffold & Contracts ✅ (provides project structure and type definitions)

---

## Conformance Obligations

| Obligation | Invariant | What the property asserts |
|------------|-----------|---------------------------|
| **CT-5** | I7 | `parse(serialize(t))` round-trips; re-serialization is byte-identical |
| **CT-6** | I7 | Round-trip holds against a golden corpus of real-world `.bean` files |

> ⚠️ This epic is NOT done until CT-5 and CT-6 pass under `bun test`.

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ✅ | Implement Beancount parser for §2.3 directive subset (transaction, open, close, balance, pad, commodity, price, note, document, event) | feature | critical |
| ✅ | Implement deterministic canonical serializer (C4) | feature | critical |
| ✅ | Implement `txid` content hashing — SHA-256 of canonical serialization (I5) | feature | critical |
| ✅ | Property-based round-trip test: `parse(serialize(t))` is stable (CT-5) | feature | critical |
| ✅ | Golden corpus test: round-trip against real `.bean` files (CT-6) | feature | high |
| ✅ | Create golden `.bean` test corpus in `test/fixtures/` | feature | high |
| ✅ | Document canonical serialization format in `docs/adr/001-canonical-format.md` | infra | medium |

---

## Session Checklist

1. [x] Read SPEC §2.3 (domain model), §3.3 (source of truth), §3.5 (write path)
2. [x] Decide: write parser from scratch or wrap existing Beancount parser → **hand-written** (see ADR-001)
3. [x] Implement parser → in-memory directive types
4. [x] Implement canonical serializer → deterministic `.bean` output
5. [x] Implement `txid = sha256(canonical_serialize(txn))`
6. [x] Write property-based round-trip tests (CT-5)
7. [x] Create golden `.bean` corpus and test against it (CT-6)
8. [x] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-06-27 | All 7 issues: Parser, Serializer, txid hashing, CT-5, CT-6, golden corpus, ADR-001 | Session 1 | 49 tests pass, 596 expect() calls, hand-written parser (ADR-001) |
