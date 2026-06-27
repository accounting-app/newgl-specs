# General Ledger API — Spec-Driven Development Document

> Single-tenant, peer-to-peer, append-only General Ledger API.
> `.bean` (Beancount) is the source of truth. GraphQL is the interface.
> Stack: **Bun + Elysia + GraphQL Yoga/Pothos**, deployed on **Fly.io**.

**Status:** Draft v1 · **Method:** Spec-Driven Development (SDD) · **License target:** open source

---

## 0. How to use this document

This is a *spec-first* project. The order of authority is:

```
Constitution  →  Specification (WHAT/WHY)  →  Plan (HOW)  →  Tasks  →  Code
```

Rules of engagement for every contributor and every AI agent working on this repo:

1. **No code without a spec section it satisfies.** If you're about to write something not traceable to §2 (Specification) or §3 (Plan), stop and amend the spec first in the same PR.
2. **The Constitution (§1) is non-negotiable.** A change that violates it is rejected on principle, not on taste.
3. **Invariants (§2.4) are tested, not assumed.** Every invariant has at least one property-based test.
4. **Specs change via PR.** This file is versioned with the code. A behavior change and its spec change land together.

---

## 1. Constitution — non-negotiable principles

| # | Principle | Why it's load-bearing |
|---|-----------|----------------------|
| C1 | **`.bean` is the single source of truth.** All state is derivable from the Beancount ledger file(s). Everything else (indices, DAG, caches) is a deterministic projection. | If state lived anywhere else, peers could diverge with no canonical reconciliation. |
| C2 | **Append-only.** Transactions are never mutated or deleted in place. Corrections are new transactions (reversing/adjusting entries). | This is what makes the ledger auditable and makes P2P merge commutative. |
| C3 | **Double-entry is enforced at write time.** No transaction is accepted unless its postings balance to zero per currency. | A GraphQL API has no ACID of its own; balance is *our* invariant to guard. |
| C4 | **Deterministic canonical serialization.** Given the same set of transactions, every peer renders a byte-identical `.bean`. | This is what lets union-merge converge and keeps the file git-friendly across nodes. |
| C5 | **Eventual consistency with a verifiable audit trail.** No global lock, no consensus quorum on the write path. Order is established by a content-addressed DAG. | Matches the CAP trade we chose: availability + partition tolerance + tamper-evidence over linearizability. |
| C6 | **Single tenant per instance.** One running instance serves exactly one company's ledger. No tenant-routing logic exists. | Simplifies auth, isolation, and the entire data model. Isolation is a deployment boundary, not application code. |
| C7 | **Offline-tolerant.** A node accepts writes while partitioned and reconciles on reconnect. | "Guaranteed redundancy" is meaningless if a partitioned node is read-only. |

---

## 2. Specification — WHAT and WHY

### 2.1 Problem & goals

Provide a programmable, replicated General Ledger over a Beancount file, so that:

- An organization can run **N redundant nodes** of its ledger with no central coordinator.
- Each node exposes a **GraphQL API** for reads (reports) and writes (journal entries).
- The ledger remains a **plaintext `.bean` file** that humans can read, edit, and version in git.
- History is **tamper-evident** and every entry is **attributable** to the peer that authored it.

### 2.2 Non-goals (v1)

- Multi-tenant SaaS, per-tenant routing, or row-level isolation. (See C6.)
- Strong/linearizable consistency or Raft consensus.
- A UI. (The API is the product; a reference client may follow.)
- Currency conversion engine beyond Beancount's native cost/price handling.
- Mutable/deletable transactions.

### 2.3 Domain model & ubiquitous language

Aligned 1:1 with Beancount directives so the file stays canonical.

- **Ledger** — the full set of directives = the company's books. Materialized as `.bean`.
- **Account** — a colon-delimited name under one of five roots: `Assets`, `Liabilities`, `Equity`, `Income`, `Expenses`. Opened with an `open` directive, optionally `close`d.
- **Transaction (`txn`)** — a dated event with a flag (`*` complete / `!` incomplete), optional payee + narration, tags, links, and ≥2 **postings**.
- **Posting** — an `Account` + an `Amount` (or an elided amount to be auto-computed), optional `cost` and `price`.
- **Amount** — a decimal `number` + a `currency` (commodity). Decimals only; never floats (see C3 / I4).
- **Balance assertion (`balance`)** — asserts an account equals an amount at a date. Treated as a **checkpoint**, not a write gate (§3.6).
- **Pad (`pad`)** — inserts a balancing transaction against Equity to satisfy a following `balance`. Also checkpoint-time.
- **Commodity / Price / Note / Document / Event** — pass-through Beancount directives, preserved verbatim.
- **Transaction ID (`txid`)** — the content hash of a transaction's canonical serialization. The primary key of the DAG.
- **Head** — a transaction with no children in the current DAG; the frontier a peer has observed.

### 2.4 Invariants — the laws (each must have a test)

| ID | Invariant |
|----|-----------|
| I1 | For every transaction, the sum of posting weights is zero **per currency** (after cost/price conversion). |
| I2 | At most **one** posting per transaction may have an elided amount; it is computed so I1 holds. |
| I3 | A posting's account must have an `open` directive dated on or before the transaction, and no `close` before it. |
| I4 | All amounts are arbitrary-precision **decimals**. No `Number`/float arithmetic touches money. |
| I5 | `txid = hash(canonical_serialize(txn))` is stable across peers and runs (C4). |
| I6 | Union of two peers' transaction sets, deduped by `txid`, yields **identical aggregate balances** regardless of merge order (commutativity). |
| I7 | The materialized `.bean` re-parses to the exact same transaction set it was rendered from (round-trip stability). |
| I8 | The DAG is acyclic and every non-genesis node references ≥1 existing parent head. |

### 2.5 Functional requirements (user stories + acceptance criteria)

**FR-1 — Append a balanced journal entry**
*As a* client, *I want* to submit a transaction, *so that* it joins the ledger on all reachable peers.
- AC1: A balanced transaction returns its `txid` and is appended to `.bean`.
- AC2: An unbalanced transaction (violates I1) is rejected with a structured error naming the imbalance and currency.
- AC3: A posting to an unopened/closed account (I3) is rejected.
- AC4: The same logical entry submitted twice yields the same `txid` and is stored once (idempotent by content).

**FR-2 — Read core financial reports**
- AC1: `trialBalance(at: Date)` returns every account's debit/credit balance; total debits == total credits.
- AC2: `balanceSheet(at: Date)` returns Assets, Liabilities, Equity with Assets = Liabilities + Equity.
- AC3: `incomeStatement(from, to)` returns Income and Expenses and net result for the period.
- AC4: `journal(account?, from?, to?)` returns transactions in deterministic display order (§3.4).
- AC5: All reports read from the in-memory index; no per-request file parse (perf gate in §6).

**FR-3 — Open / close accounts**
- AC1: `openAccount` appends an `open` directive; opening an already-open account errors.
- AC2: `closeAccount` appends a `close`; closing an account with a later transaction errors.

**FR-4 — Peer replication**
- AC1: A new transaction on node A is observable on a connected node B within the gossip interval.
- AC2: A node partitioned for a period and reconnected converges to the same DAG via anti-entropy.
- AC3: After convergence, `.bean` files on A and B are **byte-identical** (C4 / I7).

**FR-5 — Audit & verification**
- AC1: `verify()` walks the DAG and confirms every `txid` matches its content and every parent link resolves (I8).
- AC2: Each transaction records the authoring peer's identity and (optionally) a signature.

**FR-6 — Health & peers**
- AC1: `health` reports node status, head count, and connected peer count.
- AC2: `peers` lists connected peer IDs and their advertised heads.

### 2.6 GraphQL contract (the public surface)

Code-first via **Pothos**; this SDL is the agreed shape. It is part of the spec — schema changes require a spec PR.

```graphql
scalar Date          # ISO-8601 calendar date
scalar Decimal       # arbitrary precision; serialized as string
scalar TxId          # content hash (hex)

type Amount { number: Decimal!, currency: String! }

type Posting {
  account: String!
  amount: Amount!
  cost: Amount
  price: Amount
}

type Transaction {
  txid: TxId!
  date: Date!
  flag: String!              # "*" or "!"
  payee: String
  narration: String
  tags: [String!]!
  links: [String!]!
  postings: [Posting!]!
  parents: [TxId!]!          # DAG edges
  author: String!            # peer id
  signature: String          # optional non-repudiation
}

type AccountBalance { account: String!, balances: [Amount!]! }

type TrialBalanceRow { account: String!, debit: Decimal!, credit: Decimal! }
type TrialBalance { at: Date!, rows: [TrialBalanceRow!]!, totalDebit: Decimal!, totalCredit: Decimal! }

type BalanceSheet { at: Date!, assets: [AccountBalance!]!, liabilities: [AccountBalance!]!, equity: [AccountBalance!]! }
type IncomeStatement { from: Date!, to: Date!, income: [AccountBalance!]!, expenses: [AccountBalance!]!, net: [Amount!]! }

type VerifyResult { ok: Boolean!, nodesChecked: Int!, errors: [String!]! }
type Health { status: String!, heads: Int!, peers: Int!, version: String! }
type Peer { id: String!, heads: [TxId!]! }

input AmountInput { number: Decimal!, currency: String! }
input PostingInput { account: String!, amount: AmountInput, cost: AmountInput, price: AmountInput }
input TransactionInput {
  date: Date!
  flag: String = "*"
  payee: String
  narration: String
  tags: [String!] = []
  links: [String!] = []
  postings: [PostingInput!]!   # exactly one posting may omit amount (I2)
}

type Query {
  trialBalance(at: Date!): TrialBalance!
  balanceSheet(at: Date!): BalanceSheet!
  incomeStatement(from: Date!, to: Date!): IncomeStatement!
  journal(account: String, from: Date, to: Date, limit: Int = 100, offset: Int = 0): [Transaction!]!
  transaction(txid: TxId!): Transaction
  account(name: String!, at: Date): AccountBalance
  verify: VerifyResult!
  health: Health!
  peers: [Peer!]!
}

type Mutation {
  appendTransaction(input: TransactionInput!): Transaction!   # FR-1, enforces I1–I3
  openAccount(name: String!, date: Date!, currencies: [String!]): Boolean!
  closeAccount(name: String!, date: Date!): Boolean!
}

type Subscription {
  transactionAppended: Transaction!   # drives live UIs and peer fan-out
}
```

---

## 3. Technical Plan — HOW

### 3.1 Stack (locked)

| Layer | Choice | Note |
|-------|--------|------|
| Runtime | **Bun** | Single-binary builds, top throughput. |
| HTTP framework | **Elysia** | Bun-native, lowest ops, Eden end-to-end types. |
| GraphQL server | **GraphQL Yoga** | Cross-standard, mounts on Elysia. |
| Schema | **Pothos** (code-first) | Types flow from resolvers; no codegen drift. |
| Decimals | `decimal.js` (or Bun-compatible big-decimal) | Enforces I4. |
| P2P | **libp2p** (gossipsub + custom sync) | Transport, discovery, anti-entropy. |
| CRDT log | **Automerge** *or* **hypercore/autobase** | Evaluate both in M4 (§4). |
| Hashing/DAG | SHA-256 + IPLD-style links | Content addressing, Merkle-DAG. |
| Host | **Fly.io** | Persistent volume + public IPv6 for peer addressability. |

### 3.2 Architecture & layers

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

### 3.3 Source of truth & the derived DAG (the key design decision)

`.bean` is the source of truth (C1), **and** we need content addressing for P2P merge. We reconcile this as follows:

- On **boot**: parse `.bean` → for each transaction compute `txid = sha256(canonical_serialize(txn))` → build the DAG and the read model. The file is authoritative; the DAG is derived and reproducible.
- On **append/merge**: update the DAG, then **re-render** the full ledger to `.bean` via the canonical serializer (C4) and write atomically (temp file + rename).
- Because serialization is deterministic, two peers with the same transaction set produce **byte-identical** `.bean` (I7), so the file diffs cleanly in git and converges under P2P merge.

This makes `.bean` simultaneously the durable truth *and* a clean replication artifact — effectively "git's content-addressed merge, automated."

### 3.4 Consistency & replication protocol

- **Identity:** each transaction is content-addressed (`txid`). Parents = the set of heads the author observed at write time → a Merkle-DAG.
- **Gossip:** new `txid`s are announced via libp2p **gossipsub**. Peers that lack a node fetch it (content-addressed pull).
- **Anti-entropy:** on connect/interval, peers exchange head sets; the lagging peer walks back from unknown heads pulling missing ancestors until the DAG closes.
- **Merge = union by `txid`, deduped.** Commutative for balances (I6) because each transaction is internally balanced (I1).
- **Display order:** topological sort of the DAG, tie-broken by `(date, Lamport timestamp, txid)` for a total, deterministic order across peers.
- **No write blocks on peers.** A node appends locally and gossips; reachability is best-effort, convergence is guaranteed on reconnect (FR-4 AC2).

### 3.5 Double-entry validation (write path)

On `appendTransaction`:

1. Resolve elided posting (I2): at most one; compute it so per-currency sums are zero.
2. Convert cost/price to weights; sum weights per currency using decimals (I4).
3. Reject if any currency's sum ≠ 0 (I1) with a structured imbalance error (FR-1 AC2).
4. Check account `open`/`close` validity (I3).
5. Compute `txid`, set `parents = currentHeads`, set `author`, optionally sign.
6. Insert into DAG → update read model → re-serialize `.bean` → gossip → publish subscription.

### 3.6 Balance assertions & pad as checkpoints

`balance`/`pad` can't be per-write gates in an eventually-consistent system (a peer may not yet have all prior transactions). Therefore:

- Assertions are evaluated at **checkpoint** boundaries — when the DAG is quiescent up to a logical point (no in-flight pulls for that date range).
- A failed assertion is **reported** (surfaced via `verify` and logs), not used to reject incoming transactions.
- `pad` auto-balancing transactions are generated deterministically so all peers produce the same padding (preserves I6/I7).

### 3.7 Read model & indices

Built on boot, updated incrementally on append:

- **Account tree** — hierarchy + open/close state.
- **Running balances** — per account, per currency; supports `at: Date`.
- **Postings-by-account** — for `journal(account)` and `account()`.
- **By-date index** — for period reports and journal pagination.

Reports never re-parse the file (FR-2 AC5; perf gate §6).

### 3.8 Security & peer identity

- **Instance auth:** single-tenant → one instance-scoped credential (API key / mTLS) on the GraphQL endpoint. No per-user tenancy.
- **Peer identity:** libp2p keypair per node. Transactions carry `author` = peer ID.
- **Non-repudiation (optional, recommended):** sign each `txid` with the peer key; `verify` checks signatures. Gives an attributable, tamper-evident audit trail end-to-end.
- **Transport:** libp2p noise encryption between peers; TLS on the public GraphQL endpoint.

### 3.9 Deployment topology

- **Fly.io**, one Machine per node, each with a **persistent volume** for `.bean` + DAG store.
- **Public IPv6 per Machine** so peers are addressable (the silent failure mode for P2P behind NAT — verify first, see §7).
- Bootstrap peer list via config/env; mDNS for local-network discovery in dev.
- Single binary via `bun build --compile`; container is thin.

---

## 4. Implementation plan — milestones → tasks

Each milestone ends with passing tests for its acceptance criteria and is independently demoable.

**M0 — Scaffold & contracts**
- [ ] Repo, Bun project, lint/format, CI (`bun test`).
- [ ] Pothos schema matching §2.6; Yoga mounted on Elysia; all resolvers stubbed.
- [ ] Decimal + Date + TxId scalars.
- *Done when:* schema introspects and stubs return typed placeholders.

**M1 — Beancount parse & canonical serialize (C1, C4)**
- [ ] Parser for the directive subset in §2.3 (or wrap an existing Beancount parser and normalize).
- [ ] Deterministic canonical serializer; round-trip test (I7).
- [ ] `txid` hashing (I5).
- *Done when:* parse→serialize→parse is stable and byte-identical across runs.

**M2 — Ledger core & double-entry (C2, C3, I1–I4)**
- [ ] DAG structure, heads, topo order (§3.4).
- [ ] Validation pipeline (§3.5) with property-based tests for I1/I2.
- [ ] `appendTransaction`, `openAccount`, `closeAccount` wired to real logic.
- *Done when:* FR-1, FR-3 acceptance criteria pass.

**M3 — Read model & reports (FR-2)**
- [ ] Indices (§3.7); incremental update on append.
- [ ] `trialBalance`, `balanceSheet`, `incomeStatement`, `journal`, `account`.
- [ ] Perf gate: report latency from index, not file.
- *Done when:* FR-2 AC1–AC5 pass.

**M4 — Replication (FR-4, I6)**
- [ ] libp2p transport + gossipsub + discovery.
- [ ] Anti-entropy head exchange + content-addressed pull.
- [ ] Spike Automerge vs hypercore/autobase; pick one, record decision in an ADR.
- [ ] Union-merge → re-serialize → byte-identical convergence test (FR-4 AC3).
- *Done when:* two nodes converge after a simulated partition.

**M5 — Audit, checkpoints, security (FR-5, §3.6, §3.8)**
- [ ] `verify` walks DAG (I8) + signature checks.
- [ ] Balance/pad checkpoint evaluation (§3.6).
- [ ] Peer signing + instance auth.
- *Done when:* FR-5, FR-6 pass; tampering is detected.

**M6 — Deploy (§3.9)**
- [ ] `bun build --compile`; Fly.io config with volume + public IPv6.
- [ ] Multi-node smoke test on Fly; verify peer addressability.
- *Done when:* a 3-node cluster converges in production.

---

## 5. Build instructions (concrete)

```bash
# 0. Prereqs: Bun >= 1.x  (curl -fsSL https://bun.sh/install | bash)
bun --version

# 1. Scaffold
mkdir gl-api && cd gl-api
bun init -y

# 2. Core deps
bun add elysia @elysiajs/graphql-yoga graphql graphql-yoga
bun add @pothos/core
bun add decimal.js
# P2P (added in M4)
bun add libp2p @libp2p/tcp @chainsafe/libp2p-gossipsub @libp2p/mdns
# choose ONE CRDT log during M4:
#   bun add @automerge/automerge
#   bun add hypercore autobase

# 3. Dev deps
bun add -d typescript @types/bun

# 4. Run dev server
bun run --watch src/index.ts

# 5. Test
bun test

# 6. Production build (single binary)
bun build src/index.ts --compile --outfile gl-node
```

Suggested layout:

```
gl-api/
├─ SPEC.md                  ← this document
├─ docs/adr/                ← architecture decision records (M4 CRDT choice, etc.)
├─ src/
│  ├─ index.ts              ← Elysia + Yoga bootstrap
│  ├─ graphql/
│  │  ├─ schema.ts          ← Pothos schema (mirrors §2.6)
│  │  ├─ scalars.ts         ← Decimal, Date, TxId
│  │  └─ resolvers/
│  ├─ ledger/
│  │  ├─ parse.ts           ← M1 parser
│  │  ├─ serialize.ts       ← M1 canonical serializer (C4)
│  │  ├─ dag.ts             ← txid, parents, topo order
│  │  ├─ validate.ts        ← double-entry (I1–I3)
│  │  └─ readModel.ts       ← indices + reports
│  ├─ p2p/
│  │  ├─ node.ts            ← libp2p setup
│  │  ├─ gossip.ts          ← announce/fetch
│  │  └─ antiEntropy.ts     ← head exchange + pull
│  └─ security/
│     ├─ identity.ts        ← peer keypair
│     └─ sign.ts            ← txid signatures
├─ test/                    ← property + integration tests per invariant
└─ fly.toml                 ← volume + public IPv6 (M6)
```

---

## 6. Definition of Done — acceptance gates

A change is "done" only when:

1. Every touched invariant (I1–I8) has a passing property-based test.
2. Functional ACs for the relevant FR pass in `bun test`.
3. **Convergence test:** two nodes, one partitioned then reconnected, end with byte-identical `.bean` (I7/FR-4 AC3).
4. **Perf gate:** report queries (FR-2) resolve from the index; a benchmark asserts no file parse on the read path.
5. **Verify gate:** `verify` passes on the result, and a deliberately tampered transaction is detected (FR-5 AC1).
6. Spec sections changed by the PR are updated in the same PR.

---

## 7. Risks & open questions

| Risk | Impact | Mitigation / decision needed |
|------|--------|------------------------------|
| **Peer addressability behind NAT** | "Guaranteed redundancy" silently fails | Verify Fly public IPv6 in M0/M6 before building P2P; add libp2p relay/AutoNAT fallback. |
| Beancount parser fidelity | Wrong balances; round-trip break | Prefer wrapping a proven Beancount parser; pin a conformance corpus for I7. |
| Canonical serialization drift | Peers diverge on `.bean` bytes | Lock the serializer; golden-file tests; versioned format. |
| Automerge vs hypercore choice | Rework if wrong | Time-boxed spike in M4 + ADR; isolate behind the `p2p/` boundary. |
| `balance`/`pad` semantics under eventual consistency | False assertion failures | Checkpoint model (§3.6); assertions advisory, never gating. |
| Concurrent edits to `.bean` outside the API (human + git) | Source-of-truth conflict | Define whether direct file edits are allowed; if yes, re-derive DAG on file change and treat as an external "author". |
| Large ledgers in memory | Boot time / RAM | Snapshot the read model; lazy-load cold periods if needed. |

**Open questions to resolve before M4:**
1. Are direct human/git edits to `.bean` a supported write path, or is the API the sole writer? (Changes the conflict model.)
2. Mandatory transaction signing, or optional? (Affects the audit guarantee strength.)
3. Bootstrap/discovery model: static peer list, DHT, or both?
