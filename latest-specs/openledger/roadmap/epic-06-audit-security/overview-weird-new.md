---
title: "Epic 6 — Audit, Checkpoints & Security"
description: "SPEC Milestone M5 — verify walks DAG (I8), signature checks, balance/pad checkpoint evaluation, peer signing, instance auth."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-6, audit, security, signatures, checkpoints"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 6 — Audit, Checkpoints & Security

**Status:** ✅ Done
**Priority:** 🟡 Medium
**Estimated Sessions:** ~2
**SPEC Milestone:** M5 — Audit, checkpoints, security (FR-5, §3.6, §3.8)
**Scope:** `src/security/identity.ts`, `src/security/sign.ts`, DAG verify, balance assertions

---

## Context

From SPEC §4, Milestone M5:

> - `verify` walks DAG (I8) + signature checks.
> - Balance/pad checkpoint evaluation (§3.6).
> - Peer signing + instance auth.
> - *Done when:* FR-5, FR-6 pass; tampering is detected.

---

## Dependencies

- **Epic 5** — P2P Replication ✅ (provides DAG with peer identities)

---

## Conformance Obligations

| Obligation | Invariant | What the property asserts |
|------------|-----------|---------------------------|
| **CT-8** | I8 | `verify()` detects tampered `txid` and dangling parent link |
| **CT-10** | §3.8 | Signing on/off doesn't affect `txid`; verify accepts valid, rejects forged |

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ✅ | Implement `verify()` — walk DAG, confirm every txid matches content, every parent resolves (FR-5 AC1) | feature | critical |
| ✅ | Implement `SignatureProvider` interface — `NoopSignatureProvider` + `PeerKeySignatureProvider` (§3.8) | feature | critical |
| ✅ | Implement balance assertion checkpoint evaluation (§3.6) — advisory, never gating | feature | high |
| ✅ | Implement pad auto-balancing — deterministic across peers | feature | high |
| ✅ | Implement instance auth — single-tenant API key on GraphQL endpoint (§3.8) | feature | high |
| ✅ | Implement peer identity — libp2p keypair, `author` field stamping | feature | high |
| ✅ | CT-8: Tampered txid detection test | feature | critical |
| ✅ | CT-10: Signing toggle doesn't affect txid test | feature | critical |
| ✅ | Wire `health` and `peers` resolvers to real data (FR-6) | feature | medium |

---

## Session Checklist

1. [x] Read SPEC §3.6 (balance assertions), §3.8 (security & peer identity)
2. [x] Implement `verify()` DAG walker
3. [x] Implement `SignatureProvider` interface with both implementations
4. [x] Implement balance/pad checkpoint model
5. [x] Implement instance auth (API key)
6. [x] Write CT-8 and CT-10 tests
7. [x] Wire health/peers resolvers
8. [x] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-06-27 | All 9 issues | [Epic 6 Session](7f70f30e) | verify.ts (DAG walker), sign.ts (Noop + PeerKey providers), identity.ts (libp2p keypair), checkpoint.ts (balance/pad), auth.ts (API key). CT-8 + CT-10 pass. |
