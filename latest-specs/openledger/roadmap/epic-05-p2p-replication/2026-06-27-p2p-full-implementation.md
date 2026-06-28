---
title: "Epic 5 Session 1 — P2P Replication: Full Implementation"
description: "Implemented the complete P2P replication layer: libp2p node, gossipsub, anti-entropy, union-merge, CRDT ADR, and conformance tests CT-9 + CT-12."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, dev-blog, epic-5, p2p, libp2p, gossipsub, anti-entropy, crdt"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 5 Session 1 — P2P Replication: Full Implementation

**Date:** 2026-06-27
**Epic:** 5 — P2P Replication (SPEC M4)
**Issues Completed:** All 10

---

## What Changed

### New Files (P2P Layer)

| File | Purpose |
|------|---------|
| `src/p2p/node.ts` | libp2p node factory — TCP + Noise + yamux, mDNS/bootstrap discovery, persistent Ed25519 identity |
| `src/p2p/gossip.ts` | Gossipsub service — announces new transactions, handles incoming announces from peers |
| `src/p2p/antiEntropy.ts` | Anti-entropy service — head exchange + walk-back pull for partition recovery |
| `src/p2p/protocol.ts` | Wire format serialization — DagNode ↔ JSON with Decimal→string conversion |
| `src/p2p/unionMerge.ts` | Union-merge convergence — G-Set CRDT by content-addressed txid dedup |
| `docs/adr/002-crdt-choice.md` | ADR: Chose native union-merge over Automerge/Hypercore |

### New Tests

| File | Tests | What it proves |
|------|-------|---------------|
| `test/p2p-union-merge.test.ts` | 9 | Commutativity, idempotency, dedup, parent preservation, convergence |
| `test/p2p-protocol.test.ts` | 17 | Wire format round-trip, Decimal precision, gossip encoding, anti-entropy encoding, validation |
| `test/p2p-convergence.test.ts` | 4 | **CT-9**: partition-and-converge to byte-identical .bean; **CT-12**: external edit adoption |

### Modified Files

| File | Changes |
|------|---------|
| `src/ledger/config.ts` | Added `P2PConfig` interface with 6 fields |
| `src/ledger/service.ts` | Added `insertRemoteTransaction()`, `hasTransaction()`, `getNodeByTxid()`, `getDag()` |
| `src/index.ts` | Conditional P2P bootstrap, graceful shutdown, live peer count in health endpoint |
| `gl-node.config.json` | Added P2P config section (disabled by default) |
| `package.json` | Added 9 libp2p dependencies |

---

## Verification Results

```
112 pass, 0 fail (core + P2P tests)
30 new P2P tests added
810 expect() calls
```

**Conformance obligations satisfied:**
- **CT-9** ✅ Two nodes, one partitioned then reconnected, end byte-identical
- **CT-12** ✅ External edits enabled → hand-appended transaction adopted via union-merge

**Bun compatibility:** libp2p (TCP, Noise, yamux, gossipsub, identify, mDNS, bootstrap) all verified working under Bun 1.3.14.

---

## Key Decision: CRDT Choice (ADR-002)

**Decision:** Use native union-merge DAG without a CRDT library.

The existing content-addressed DAG already forms a **G-Set CRDT** by construction:
- Commutative: `union(A, B) = union(B, A)`
- Associative: `union(union(A, B), C) = union(A, union(B, C))`
- Idempotent: `union(A, A) = A`

Automerge (concurrent document editing) and Hypercore (append-only logs with linearization) solve problems we don't have. Our transactions are immutable and content-addressed — merge is just set union.

---

## Architecture Notes

The P2P layer follows the SPEC's layered architecture — it sits at the bottom of the stack and only interacts upward through `LedgerService` methods:

```
GraphQL ← Elysia → LedgerService → TransactionDag
                         ↑
               GossipService (real-time)
               AntiEntropyService (catch-up)
```

P2P is **off by default** (`p2p.enabled: false` in config). Turning it on requires setting `p2p.enabled: true` and optionally configuring listen addresses and bootstrap peers.
