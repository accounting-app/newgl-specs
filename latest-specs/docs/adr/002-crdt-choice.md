# ADR 002 — CRDT Choice: Native Union-Merge DAG

**Status:** Accepted
**Date:** 2026-06-28
**Context:** SPEC §3.4 (M4) — Evaluate Automerge vs hypercore/autobase

---

## Context

The SPEC (M4) calls for a time-boxed spike to evaluate Automerge vs hypercore/autobase
as the CRDT layer for P2P replication, with the decision recorded in an ADR.

OpenLedger already has a content-addressed Merkle-DAG (built in Epic 3) where:
- Each transaction is identified by `txid = SHA-256(canonical_serialize(transaction))`
- New transactions reference current heads as parents, forming a DAG
- Merge is union by txid, deduped (§3.4)

The question is whether a dedicated CRDT library adds value on top of this.

---

## Evaluation

### Option A: Automerge

| Criterion | Assessment |
|-----------|-----------|
| **What it provides** | General-purpose CRDT for JSON-like documents with automatic merge |
| **Bun compatibility** | WASM-based, works in Bun |
| **Fit with our data model** | Poor — Automerge is designed for concurrent *edits* to the same document. Our transactions are immutable, append-only entries. We'd be using it as a set CRDT, which is overkill. |
| **Integration cost** | High — would replace the existing DAG layer entirely, requiring a different data model (Automerge doc instead of DagNode map) |
| **Bundle size** | ~500KB WASM module |
| **Verdict** | **Not recommended** — solves a problem we don't have (concurrent edits) |

### Option B: Hypercore / Autobase

| Criterion | Assessment |
|-----------|-----------|
| **What it provides** | Append-only log (hypercore) with multi-writer linearization (autobase) |
| **Bun compatibility** | Native bindings, may require compatibility work |
| **Fit with our data model** | Moderate — append-only log matches our append-only ledger, but autobase's linearization conflicts with our deterministic topo sort |
| **Integration cost** | High — would wrap DAG inside hypercore feeds, adding an opaque persistence layer |
| **Bundle size** | Moderate with native dependencies |
| **Verdict** | **Not recommended** — linearization model conflicts with our DAG-based merge |

### Option C: Native Union-Merge (Current Implementation)

| Criterion | Assessment |
|-----------|-----------|
| **What it provides** | Union of DagNodes by txid, deduped, with deterministic topo sort for re-serialization |
| **CRDT properties** | ✅ Commutative (union is commutative), ✅ Associative (union is associative), ✅ Idempotent (dedup by content hash) |
| **Why it works** | Transactions are immutable (C2), content-addressed (I5), and internally balanced (I1) — these three properties give us a G-Set CRDT for free |
| **Integration cost** | Zero — already built and tested |
| **Dependencies** | None beyond what we have |
| **Verdict** | **Recommended** — simplest correct solution |

---

## Decision

**Use the native union-merge DAG without a CRDT library.**

The existing content-addressed Merkle-DAG is already a well-formed **G-Set CRDT**
(grow-only set) by construction:

1. **Commutative**: `union(A, B) = union(B, A)` — both produce the same txid set
2. **Associative**: `union(union(A, B), C) = union(A, union(B, C))`
3. **Idempotent**: `union(A, A) = A` — duplicate txids are ignored

Because transactions are immutable and identified by content hash, there's no
"concurrent edit" problem that a general CRDT library would solve. Our merge is
just set union, and our convergence guarantee comes from deterministic canonical
serialization (C4/I7) — same transaction set → byte-identical `.bean`.

Automerge and hypercore are excellent tools for their use cases (collaborative
document editing and append-only log sharing, respectively), but they add
complexity without solving a problem we actually have.

---

## Consequences

- **No additional dependencies** — no WASM module or native bindings
- **Simpler mental model** — "merge = union by txid" is easy to reason about
- **Transport is pure libp2p** — gossipsub for real-time, custom protocol for anti-entropy
- **If we're wrong**: the P2P layer is isolated behind `src/p2p/`, so we can swap in
  Automerge or hypercore later without touching ledger core, GraphQL, or serialization

---

## References

- SPEC §3.4 — Consistency & replication protocol
- Epic 5 overview — P2P Replication
- `src/p2p/unionMerge.ts` — Implementation
- `test/p2p-union-merge.test.ts` — Tests proving CRDT properties
