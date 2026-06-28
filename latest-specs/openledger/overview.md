---
title: "OpenLedger — Project Overview"
description: "Project overview for OpenLedger, a spec-driven, peer-to-peer, append-only General Ledger API. Beancount files as source of truth, GraphQL interface. Bun + Elysia + GraphQL Yoga/Pothos."
published: true
date: 2026-06-28T00:00:00.000Z
tags: "projects, openledger, bun, elysia, graphql, beancount, accounting, p2p, ledger"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# OpenLedger — Project Overview

**Repo:** [github.com/mrrobot16/openledger](https://github.com/mrrobot16/openledger)
**Language:** TypeScript (Bun runtime)
**Status:** Active — GSX Bootstrap in progress (Epic 0), Docker Compose local dev prioritized (Epic 9)
**License:** Open Source (public repo)
**Dev Blog:** [Engineering Log](/projects/openledger/dev-blog)
**Branding:** OpenLedger 📒

---

## What is OpenLedger?

OpenLedger is a **single-tenant, peer-to-peer, append-only General Ledger API**. `.bean` (Beancount) is the source of truth. GraphQL is the interface.

It provides:

1. **A programmable, replicated General Ledger** — N redundant nodes of a company's ledger with no central coordinator
2. **GraphQL API** — reads (financial reports) and writes (journal entries) via a typed, code-first schema
3. **Plaintext `.bean` file** — human-readable, git-friendly, version-controllable accounting data
4. **Tamper-evident history** — content-addressed DAG where every entry is attributable to its authoring peer

The name **OpenLedger** reflects the goal: an open, transparent accounting system where the ledger is always auditable.

---

## Origin Story

OpenLedger was conceived as a **spec-first** project — the entire system was designed in a comprehensive [SPEC.md](https://github.com/mrrobot16/openledger/blob/main/SPEC.md) before any code was written. The spec follows a strict authority chain:

```
Constitution → Specification (WHAT/WHY) → Plan (HOW) → Tasks → Code
```

The project is built on **8 non-negotiable constitutional principles** (C1–C8) that govern every design decision, from the append-only ledger model to the full-word identifier naming convention.

---

## Project Status

### Completed ✅

| Component | What | Key Files |
|-----------|------|-----------|
| **SPEC.md** | Complete specification — constitution, domain model, invariants, GraphQL contract, milestones, conformance suite | `SPEC.md` |
| **GSX Bootstrap** | Wiki pages, roadmap, workflow docs, epic tracker | `gsx-wiki/projects/openledger/`, `docs/` |

### Phase 1 — In Progress 🔄

| Epic | SPEC Milestone | What | Status |
|------|---------------|------|--------|
| **Epic 0** | — | GSX Bootstrap & Scaffolding | 🔄 In Progress |
| **Epic 1** | M0 | Scaffold & Contracts — Pothos schema, stubs, scalars | ⬜ Not Started |
| **Epic 2** | M1 | Beancount Parser & Canonical Serializer (C1, C4) | ⬜ Not Started |
| **Epic 3** | M2 | Ledger Core & Double-Entry Validation (C2, C3, I1–I4) | ⬜ Not Started |
| **Epic 4** | M3 | Read Model & Financial Reports (FR-2) | ⬜ Not Started |
| **Epic 9** | — | Docker Compose & Local Dev — one-liner dev workflow | ⬜ Not Started |

### Phase 2 — Planned ⬜

| Epic | SPEC Milestone | What | Status |
|------|---------------|------|--------|
| **Epic 5** | M4 | P2P Replication — libp2p gossip + CRDT + convergence | ⬜ Not Started |
| **Epic 6** | M5 | Audit, Checkpoints & Security — verify, signatures, balance assertions | ⬜ Not Started |
| **Epic 11** | — | Front-End Onboarding — newgl-ui → monorepo, Radix UI migration | ⬜ Not Started |

### Deferred / Future ⏸️

| Epic | What | Status |
|------|------|--------|
| **Epic 7** | Deploy — Fly.io, multi-node cluster (deferred until local stack + frontend ready) | ⏸️ Deferred |
| **Epic 10** | Built-In Issue Tracker — GraphQL CRUD + `/issues` page (deferred until after Radix migration) | ⬜ Not Started |

### Unplanned — Future ⬜

| Epic | What |
|------|------|
| **Epic 8** | CI Pipeline — GitLab CI + GitHub Actions |

---

## Architecture

### Layered Stack (from SPEC §3.2)

```
┌──────────────────────────────────────────────┐
│ GraphQL (Yoga + Pothos)  ← Elysia HTTP/WS     │  interface
├──────────────────────────────────────────────┤
│ Ledger service                                │  domain
│  • validate (I1–I3)  • append  • report       │
├──────────────────────────────────────────────┤
│ Read model (in-memory indices)                │  projection
│  • account tree  • running balances           │
│  • postings-by-account  • by-date journal      │
├──────────────────────────────────────────────┤
│ Transaction DAG (content-addressed)           │  core state
│  • txid hashing  • parents  • topo order      │
├──────────────────────────────────────────────┤
│ Persistence: canonical .bean serializer       │  source of truth (C1)
├──────────────────────────────────────────────┤
│ Replication: libp2p gossip + anti-entropy     │  P2P
└──────────────────────────────────────────────┘
```

Dependencies point **downward only**. The GraphQL layer never touches `.bean` or libp2p directly — it calls the Ledger service.

### File Structure

```
openledger/
├── SPEC.md                    # The constitution — specification document
├── gl-node.config.json        # App config (external edits, signing, ledger path)
├── docker-compose.yml         # Local dev orchestration (Epic 9)
├── docker-compose.dev.yml     # Dev overrides — hot reload (Epic 9)
├── Makefile                   # Dev workflow targets (Epic 9)
├── Dockerfile                 # Multi-stage Bun build
├── docs/                      # Agent workflow documents
│   ├── epic-worksession-workflow.md
│   ├── issue-tracker-workflow.md
│   ├── local-dev-testing-workflow.md
│   ├── wiki-update-workflow.md
│   └── dev-database-workflow.md
├── src/
│   ├── index.ts               # Elysia + Yoga bootstrap
│   ├── graphql/
│   │   ├── schema.ts          # Pothos schema (mirrors §2.6)
│   │   ├── scalars.ts         # Decimal, Date, TxId
│   │   └── resolvers/         # [M2+] Resolver implementations
│   ├── ledger/
│   │   ├── parse.ts           # [M1] Beancount parser
│   │   ├── serialize.ts       # [M1] Canonical serializer (C4)
│   │   ├── dag.ts             # [M2] txid, parents, topo order
│   │   ├── validate.ts        # [M2] Double-entry (I1–I3)
│   │   └── readModel.ts       # [M3] Indices + reports
│   ├── issues/                # [Epic 10] Issue tracker module
│   │   └── store.ts           # SQLite-backed issue CRUD
│   ├── p2p/
│   │   ├── node.ts            # [M4] libp2p setup
│   │   ├── gossip.ts          # [M4] announce/fetch
│   │   └── antiEntropy.ts     # [M4] head exchange + pull
│   └── security/
│       ├── identity.ts        # [M5] Peer keypair
│       └── sign.ts            # [M5] txid signatures
├── frontend/                  # [Epic 11] Next.js App Router (from newgl-ui)
│   ├── app/                   # Pages: Home, /register, /reports, /issues
│   ├── components/            # Radix UI components (LayoutShell, etc.)
│   ├── modules/accounting/    # Domain model (retained from newgl-ui)
│   └── lib/                   # GraphQL client, utilities
├── test/                      # Property + integration tests per invariant
├── data/                      # Persistent volume mount for .bean files
└── docs/adr/                  # Architecture decision records
```

---

## Constitution — Non-Negotiable Principles

| # | Principle |
|---|-----------|
| C1 | **`.bean` is the single source of truth.** All state is derivable from the Beancount ledger file(s). |
| C2 | **Append-only.** Transactions are never mutated or deleted. Corrections are new transactions. |
| C3 | **Double-entry is enforced at write time.** No transaction accepted unless postings balance to zero per currency. |
| C4 | **Deterministic canonical serialization.** Same transactions → byte-identical `.bean`. |
| C5 | **Eventual consistency with verifiable audit trail.** No global lock, no consensus quorum on write path. |
| C6 | **Single tenant per instance.** One instance serves exactly one company's ledger. |
| C7 | **Offline-tolerant.** A node accepts writes while partitioned and reconciles on reconnect. |
| C8 | **Full-word identifiers.** No single-letter names, no abbreviations. `transaction`, not `txn`. |

---

## Domain Model (Ubiquitous Language)

| Term | Definition |
|------|-----------|
| **Ledger** | The full set of directives = the company's books. Materialized as `.bean`. |
| **Account** | Colon-delimited name under `Assets`, `Liabilities`, `Equity`, `Income`, `Expenses`. |
| **Transaction** | Dated event with flag, payee, narration, tags, links, and ≥2 postings. |
| **Posting** | Account + Amount (+ optional cost/price). |
| **Amount** | Decimal number + currency. Never floats. |
| **txid** | Content hash of a transaction's canonical serialization. Primary key of the DAG. |
| **Head** | A transaction with no children in the current DAG; the frontier. |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Bun | Single-binary builds, top throughput |
| **HTTP Framework** | Elysia | Bun-native, Eden end-to-end types |
| **GraphQL Server** | GraphQL Yoga | Cross-standard, mounts on Elysia |
| **Schema** | Pothos (code-first) | Types flow from resolvers; no codegen drift |
| **Decimals** | `decimal.js` | Enforces I4 — arbitrary precision, never floats |
| **P2P** | libp2p (gossipsub + custom sync) | [M4] Transport, discovery, anti-entropy |
| **Hashing/DAG** | SHA-256 + IPLD-style links | Content addressing, Merkle-DAG |
| **Host** | Fly.io | Persistent volume + public IPv6 |

---

## GraphQL API Surface (from SPEC §2.6)

### Queries
| Query | Description |
|-------|-------------|
| `trialBalance(at: Date!)` | Every account's debit/credit balance; total debits == total credits |
| `balanceSheet(at: Date!)` | Assets, Liabilities, Equity with A = L + E |
| `incomeStatement(from, to)` | Income and Expenses with net result |
| `journal(account?, from?, to?, limit?, offset?)` | Transactions in deterministic display order |
| `transaction(txid: TxId!)` | Single transaction by content hash |
| `account(name!, at?)` | Account balance at optional date |
| `verify` | Walk DAG, confirm txid integrity + parent links |
| `health` | Node status, head count, peer count |
| `peers` | Connected peer IDs and their advertised heads |

### Mutations
| Mutation | Description |
|----------|-------------|
| `appendTransaction(input!)` | Submit a balanced journal entry (enforces I1–I3) |
| `openAccount(name!, date!, currencies?)` | Open an account with optional currency constraints |
| `closeAccount(name!, date!)` | Close an account |

### Subscription
| Subscription | Description |
|-------------|-------------|
| `transactionAppended` | Live feed of new transactions |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Source of truth | `.bean` file (not a database) | Human-readable, git-friendly, Beancount ecosystem compatible |
| Schema approach | Code-first (Pothos) | Types flow from resolvers; no codegen drift between schema and code |
| Consistency model | Eventual (AP) | P2P mesh with content-addressed merge; no central coordinator |
| External edits | Configurable on/off | Union-merge like peer gossip when enabled; strict API-only when disabled |
| Transaction signing | Optional, off by default | Tamper-evidence from DAG regardless; signing adds cryptographic attribution |
| Naming convention | Full-word identifiers (C8) | Code reads as plain English — its own audit control |

---

## Invariants — The Laws

Every invariant has (or will have) a property-based test. See SPEC §2.4 and §2.7 for conformance obligations.

| ID | Invariant |
|----|-----------|
| I1 | Per-currency posting sums are zero for every transaction |
| I2 | At most one elided posting per transaction |
| I3 | Posting accounts must be open and not closed |
| I4 | All amounts are arbitrary-precision decimals — never floats |
| I5 | `txid = hash(canonical_serialize(txn))` is stable across peers/runs |
| I6 | Union-merge by txid yields identical balances regardless of order |
| I7 | `parse(serialize(t))` round-trips; byte-identical re-serialization |
| I8 | DAG is acyclic; every non-genesis node references ≥1 existing parent |

---

## References

- **SPEC.md:** [OpenLedger Specification](https://github.com/mrrobot16/openledger/blob/main/SPEC.md) — The constitution, specification, and technical plan
- **Roadmap:** [OpenLedger Roadmap](/projects/openledger/roadmap) — 12 epics with status tracking
- **Pattern Reference:** [OmniMD Project](/projects/omni-md/overview) — Documentation structure template
- **Pattern Reference:** [strix-view Project](/projects/strix-view/overview) — Epic workflow reference
