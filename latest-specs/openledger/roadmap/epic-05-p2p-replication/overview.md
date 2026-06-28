---
title: "Epic 5 — P2P Replication"
description: "SPEC Milestone M4 — libp2p transport, gossipsub, anti-entropy, CRDT evaluation (Automerge vs hypercore), union-merge convergence."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-5, p2p, libp2p, gossipsub, replication, crdt"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 5 — P2P Replication

**Status:** ✅ Done
**Priority:** 🟡 Medium
**Estimated Sessions:** ~3–4
**SPEC Milestone:** M4 — Replication (FR-4, I6)
**Scope:** `src/p2p/node.ts`, `src/p2p/gossip.ts`, `src/p2p/antiEntropy.ts`

---

## Context

From SPEC §4, Milestone M4:

> - libp2p transport + gossipsub + discovery.
> - Anti-entropy head exchange + content-addressed pull.
> - Spike Automerge vs hypercore/autobase; pick one, record decision in an ADR.
> - Union-merge → re-serialize → byte-identical convergence test (FR-4 AC3).
> - *Done when:* two nodes converge after a simulated partition.

This is the **differentiator** — what makes OpenLedger unique vs. any other accounting API.

---

## Dependencies

- **Epic 3** — Ledger Core ✅ (provides DAG, append pipeline, txid)

---

## Conformance Obligations

| Obligation | Invariant | What the property asserts |
|------------|-----------|---------------------------|
| **CT-9** | FR-4 | Two nodes, one partitioned then reconnected, end byte-identical |
| **CT-12** | §3.3 | External edits enabled → hand-appended transaction adopted via union-merge |

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ✅ | Implement libp2p node setup — transport, noise encryption, muxer (§3.9) | feature | critical |
| ✅ | Implement gossipsub — announce new txids to connected peers | feature | critical |
| ✅ | Implement content-addressed pull — fetch missing transactions by txid | feature | critical |
| ✅ | Implement anti-entropy — head exchange on connect/interval, walk-back pull (§3.4) | feature | critical |
| ✅ | Implement discovery — static bootstrap list + Kademlia DHT + mDNS (§3.9) | feature | high |
| ✅ | Spike: Automerge vs hypercore/autobase — time-boxed evaluation | spike | high |
| ✅ | Record CRDT choice in `docs/adr/002-crdt-choice.md` | infra | high |
| ✅ | Implement union-merge → re-serialize → byte-identical convergence | feature | critical |
| ✅ | CT-9: Partition-and-converge harness test | feature | critical |
| ✅ | CT-12: External edit adoption via union-merge test | feature | high |

---

## Session Checklist

1. [x] Read SPEC §3.4 (replication protocol), §3.9 (deployment topology)
2. [x] Set up libp2p with noise + yamux
3. [x] Implement gossipsub announce/fetch
4. [x] Implement anti-entropy head exchange
5. [x] Time-box Automerge vs hypercore spike (1 session max)
6. [x] Write ADR for CRDT choice
7. [x] Implement union-merge convergence
8. [x] Write partition-and-converge test (CT-9)
9. [x] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-06-27 | All 10 issues | [Epic 5 Session 1](fe559a51) | libp2p node, gossip, anti-entropy, union-merge, ADR-002, CT-9 + CT-12 pass, 30 new tests, 112 total pass |
