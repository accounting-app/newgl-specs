---
title: "Epic 12 — Backend API & Src Layout Refactor"
description: "Restructure backend src/ into clear layers — api/, shared/, p2p/runtime, bootstrap — without changing frontend/, entry point, or runtime behavior. Slim index.ts; fix dependency direction between transport and domain."
published: true
date: 2026-06-28T00:00:00.000Z
tags: "openledger, roadmap, epic-12, refactor, api, src-layout, architecture, backend"
editor: markdown
dateCreated: 2026-06-28T00:00:00.000Z
---

# Epic 12 — Backend API & Src Layout Refactor

**Folder:** `mdignore/openledger/roadmap/epic-12-api_refactor/`
**Status:** ⬜ Not Started
**Priority:** 🟡 Medium
**Estimated Sessions:** ~1–2
**SPEC Milestone:** — (internal architecture, not spec-driven)
**Scope:** `src/index.ts`, `src/bootstrap.ts`, `src/api/`, `src/shared/`, `src/p2p/runtime.ts`, `src/p2p/types.ts`

> [!NOTE]
> **Backend only.** `frontend/` is not touched. Entry point stays `src/index.ts` (Docker, `package.json`, Makefile unchanged).

---

## Context

OpenLedger's backend entry point (`src/index.ts`) currently mixes four concerns in one file:

1. **Bootstrap** — config load, `LedgerService` init, issue store
2. **P2P orchestration** — libp2p startup, gossip, anti-entropy, `DagAccessor` wiring
3. **HTTP transport** — Elysia server, `/health`, `/graphql`
4. **Shutdown** — SIGINT cleanup across all layers

Domain modules (`ledger/`, `p2p/`, `security/`, `issues/`) are already well-scoped. The problem is **composition and dependency direction**, not missing domain logic:

- `src/graphql/` sits at the repo root of `src/` but is really API transport
- P2P orchestration lives in `index.ts` instead of `p2p/`
- `ledger/config.ts` holds node-wide config (port, P2P, auth) — not ledger-domain logic
- `P2PAccessor` is defined in GraphQL schema — inverted dependency (transport owns P2P types)
- `createAuthHandler` (HTTP middleware) lives beside ledger crypto in `security/auth.ts`

This epic introduces a **layered backend layout** with incremental, low-risk steps — one concern per commit, `bun test` after each step.

### Why Now?

- `index.ts` will grow as Epic 11 (frontend) and Epic 10 (issues) add integration pressure
- P2P runtime extraction unblocks future split entry points (`api`-only vs full node) without process separation
- Clear `api/` boundary makes onboarding and code review easier
- No behavior change — pure refactor

### What We Skip

- **`src/lib/`** — `ledger/` already is the core library; adding `lib/` creates ambiguity
- **Process separation** — API and P2P stay in one process; no IPC layer
- **`frontend/` changes** — none

---

## Dependencies

- **Epic 3** — Ledger Core ✅ (provides `LedgerService`, DAG)
- **Epic 5** — P2P Replication ✅ (provides `node.ts`, `gossip.ts`, `antiEntropy.ts`)
- **Epic 6** — Audit & Security ✅ (provides `security/auth.ts` types used by config)
- **Epic 10** — Issue Tracker ✅ (provides `issues/store.ts` wired in bootstrap)

No SPEC milestone dependency — safe to run in parallel with Epic 9 / Epic 11.

### Follow-ups

- **Epic 13** — API Request Logging (depends on this epic; wires into `src/api/server.ts`)

---

## Target Structure

```text
src/
  index.ts                 # composition root only (~25–35 lines)
  bootstrap.ts             # config + ledger + issues init
  api/
    server.ts              # Elysia, /health, /graphql, listen()
    auth.ts                # createAuthHandler (HTTP middleware only)
    graphql/
      schema.ts
      scalars.ts
      operations.graphql
  shared/
    config.ts              # moved from ledger/config.ts
  p2p/
    types.ts               # P2PAccessor interface
    runtime.ts             # orchestration extracted from index.ts
    node.ts, gossip.ts, antiEntropy.ts, protocol.ts, unionMerge.ts
  ledger/                  # unchanged (minus config)
  security/                # sign, verify, checkpoint, identity, auth types
  issues/                  # unchanged
```

---

## Dependency Rules

```text
index       → bootstrap, api, p2p
api         → ledger, p2p/types, issues, security
p2p         → ledger, shared/config
ledger      → security (never api)
shared      → security (for AuthConfig defaults)
bootstrap   → ledger, issues, shared/config
```

**Invariant:** If `ledger/` or `shared/` imports from `api/`, the refactor introduced an inverted dependency.

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Extract `src/p2p/runtime.ts` — `createP2PRuntime(config, ledgerService)` | refactor | critical |
| ⬜ | Extract `src/bootstrap.ts` — `bootstrapApp()` returns config + ledger + issues | refactor | critical |
| ⬜ | Extract `src/api/server.ts` — `startApi(options)` for Elysia + GraphQL | refactor | critical |
| ⬜ | Move `src/graphql/` → `src/api/graphql/` — update imports | refactor | high |
| ⬜ | Create `src/p2p/types.ts` — move `P2PAccessor` out of GraphQL schema | refactor | high |
| ⬜ | Split `createAuthHandler` → `src/api/auth.ts`; keep types in `security/auth.ts` | refactor | medium |
| ⬜ | Move `src/ledger/config.ts` → `src/shared/config.ts` — update all imports | refactor | medium |
| ⬜ | Slim `src/index.ts` to composition root only | refactor | medium |
| ⬜ | Update `docs/local-dev-testing-workflow.md` and `docs/epic-worksession-workflow.md` paths | docs | low |
| ⬜ | Full verification — `bun test`, lint, smoke-test-api-only.sh | infra | critical |

---

## Implementation Plan

### Step 1 — Extract P2P Runtime (Low risk)

**Goal:** Move P2P orchestration out of `index.ts` into `p2p/`.

**Create `src/p2p/runtime.ts`:**

```typescript
export interface P2PRuntime {
  readonly accessor: P2PAccessor;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createP2PRuntime(
  config: NodeConfig,
  ledgerService: LedgerService,
): P2PRuntime
```

Move from `index.ts`:

- `createGossipService` / `createAntiEntropyService` setup
- `createPeerNodeFromConfig` + `peerNode.start()`
- `DagAccessor` wiring to `ledgerService`
- Gossip receive handler (`insertRemoteTransaction`)
- `P2PAccessor` implementation
- Disabled-mode no-op (`accessor` returns `[]` / `null`)
- `stop()` — gossip stop, anti-entropy stop, `peerNode.stop()`

Keep **fire-and-forget** `start()` (do not block HTTP boot).

**Verify:**

```bash
bun test test/p2p-*.test.ts test/p2p-convergence.test.ts
bun run src/index.ts
curl -sf http://localhost:4000/health
```

**Files:** `src/p2p/runtime.ts` (new), `src/index.ts`

---

### Step 2 — Extract Bootstrap (Low risk)

**Goal:** Pull ledger + issues initialization out of `index.ts`.

**Create `src/bootstrap.ts`:**

```typescript
export interface AppContext {
  config: NodeConfig;
  ledgerService: LedgerService;
  issueStore: IssueStore;
}

export function bootstrapApp(): AppContext
```

Move: `loadConfig()`, `LedgerService` init + logging, `createIssueStore()` + logging.

**Verify:**

```bash
bun test test/config.test.ts test/service.test.ts test/issues.test.ts
```

**Files:** `src/bootstrap.ts` (new), `src/index.ts`

---

### Step 3 — Extract API Server (Low risk)

**Goal:** HTTP/GraphQL lives under `api/`.

**Create `src/api/server.ts`:**

```typescript
export interface ApiServerOptions {
  config: NodeConfig;
  ledgerService: LedgerService;
  p2pAccessor: P2PAccessor;
  issueStore: IssueStore;
}

export function startApi(options: ApiServerOptions): { port: number }
```

Move: `buildSchema`, `createYoga`, Elysia app (`createAuthHandler`, `/health`, `/graphql`), `.listen(PORT)`.

**Verify:**

```bash
bun run src/index.ts
bash scripts/smoke-test-api-only.sh
```

**Files:** `src/api/server.ts` (new), `src/index.ts`

---

### Step 4 — Move GraphQL Under `api/` (Medium risk)

**Moves:**

```text
src/graphql/schema.ts           → src/api/graphql/schema.ts
src/graphql/scalars.ts          → src/api/graphql/scalars.ts
src/graphql/operations.graphql  → src/api/graphql/operations.graphql
```

**Import fixes in `schema.ts`:**

```typescript
import { LedgerService } from "../../ledger/service";
import type { IssueStore } from "../../issues/store";
```

**Consumer updates:**

| File | New import |
|------|------------|
| `src/api/server.ts` | `./graphql/schema` |
| `src/p2p/runtime.ts` | `../api/graphql/schema` (temporary; fixed in Step 5) |

Delete empty `src/graphql/`.

**Verify:**

```bash
bun test
bash scripts/smoke-test-api-only.sh
```

---

### Step 5 — Move `P2PAccessor` to `p2p/types.ts` (Low risk)

**Create `src/p2p/types.ts`:**

```typescript
export interface P2PAccessor {
  getConnectedPeerIds(): string[];
  getLocalPeerId(): string | null;
}
```

**Update imports:**

| File | Import from |
|------|-------------|
| `src/api/graphql/schema.ts` | `../../p2p/types` |
| `src/p2p/runtime.ts` | `./types` |
| `src/api/server.ts` | `../p2p/types` |

Remove `P2PAccessor` export from `schema.ts`.

**Verify:**

```bash
bun test
```

---

### Step 6 — Split Auth Handler (Low risk)

**Do not move entire `auth.ts` to `api/`** — `config` imports `AuthConfig` from it; that would invert dependencies.

**Keep in `src/security/auth.ts`:** `AuthConfig`, `DEFAULT_AUTH_CONFIG`, `AuthResult`, `checkAuthorization()`

**Create `src/api/auth.ts`:** `createAuthHandler()` only

**Verify:**

```bash
bun test test/auth.test.ts
```

---

### Step 7 — Move Config to `shared/` (Medium risk)

**Create `src/shared/config.ts`** — move contents of `src/ledger/config.ts`.

**Optional re-export** in `src/ledger/config.ts`:

```typescript
export * from "../shared/config";
```

**Update imports in:** `bootstrap.ts`, `ledger/service.ts`, `p2p/node.ts`, `test/config.test.ts`, `test/p2p-convergence.test.ts`

**Verify:**

```bash
bun test test/config.test.ts
bun test
```

---

### Step 8 — Final Cleanup (Low risk)

**Target `src/index.ts`:**

```typescript
import { bootstrapApp } from "./bootstrap";
import { createP2PRuntime } from "./p2p/runtime";
import { startApi } from "./api/server";

const { config, ledgerService, issueStore } = bootstrapApp();
const p2p = createP2PRuntime(config, ledgerService);

void p2p.start();

startApi({
  config,
  ledgerService,
  p2pAccessor: p2p.accessor,
  issueStore,
});

process.on("SIGINT", async () => {
  console.log("\n📒 Shutting down...");
  issueStore.close();
  await p2p.stop();
  process.exit(0);
});
```

**Update docs paths** in `docs/local-dev-testing-workflow.md`, `docs/epic-worksession-workflow.md`.

**Optional tsconfig aliases:**

```json
"paths": {
  "@api/*": ["src/api/*"],
  "@shared/*": ["src/shared/*"]
}
```

**Final verify:**

```bash
bun test
bun run lint
bun run src/index.ts
bash scripts/smoke-test-api-only.sh
# P2P config: bash scripts/smoke-test.sh
```

---

## What Does NOT Change

| Area | Changes? |
|------|----------|
| `src/` layout | Yes — restructure as above |
| `frontend/` | **No** |
| `package.json` entry | No — still `src/index.ts` |
| Docker / Makefile | No — still `bun run src/index.ts` |
| `test/` layout | No — import paths only where noted |
| Runtime behavior | No — pure refactor |

---

## Session Checklist

1. [ ] Read current `src/index.ts` and map the four mixed concerns
2. [ ] Step 1: Create `src/p2p/runtime.ts`, slim P2P block in index
3. [ ] Step 2: Create `src/bootstrap.ts`
4. [ ] Step 3: Create `src/api/server.ts`
5. [ ] Step 4: Move `graphql/` → `api/graphql/`
6. [ ] Step 5: Create `src/p2p/types.ts`, fix `P2PAccessor` ownership
7. [ ] Step 6: Split `createAuthHandler` → `api/auth.ts`
8. [ ] Step 7: Move config → `shared/config.ts`
9. [ ] Step 8: Final index cleanup + doc path updates
10. [ ] Full `bun test` + smoke tests pass
11. [ ] Commit and update this page

---

## Suggested Commit Boundaries

1. `refactor(p2p): extract runtime from index`
2. `refactor: extract bootstrap helper`
3. `refactor(api): extract HTTP server`
4. `refactor(api): move graphql under api/`
5. `refactor(p2p): move P2PAccessor to p2p/types`
6. `refactor(api): split auth handler`
7. `refactor(shared): move node config out of ledger`
8. `chore: slim index and update docs`

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| | | | |
