---
title: "Epic 13 — API Request Logging"
description: "Per-request HTTP logging for the backend API — method, path, status, duration; GraphQL operation names; no secrets in logs. Wires into src/api/ after Epic 12."
published: true
date: 2026-06-28T00:00:00.000Z
tags: "openledger, roadmap, epic-13, logging, observability, api, backend"
editor: markdown
dateCreated: 2026-06-28T00:00:00.000Z
---

# Epic 13 — API Request Logging

**Folder:** `mdignore/openledger/roadmap/epic-13-api-request-logging/`
**Status:** ⬜ Not Started
**Priority:** 🟡 Medium
**Estimated Sessions:** ~1
**SPEC Milestone:** — (internal observability, not spec-driven)
**Scope:** `src/api/logging/`, `src/api/server.ts`, `src/shared/config.ts` (optional toggle)

> [!NOTE]
> **Backend only.** `frontend/` is not touched. **Blocked on Epic 12** — logging wires into `src/api/server.ts`, not `src/index.ts`.

---

## Context

OpenLedger's HTTP API (`/health`, `/graphql`) currently has no per-request logging. Boot and P2P events use ad-hoc `console.log` in `src/index.ts`, but incoming API traffic is invisible — making local debugging and production ops harder.

This epic adds structured request logging at the HTTP transport layer:

1. **HTTP access log** — method, path, status code, duration (ms)
2. **GraphQL enrichment** — operation name and type (query / mutation) for `/graphql`
3. **Safety** — never log `Authorization` headers or API keys
4. **Noise control** — skip or downgrade `/health` (Docker polls every 10s)

### Why After Epic 12?

Epic 12 extracts HTTP into `src/api/server.ts`. Implementing logging before that refactor means wiring in `index.ts` and moving it again. Epic 13 starts only when Epic 12 is ✅ Done.

### What We Skip

- **Structured logger library** (Pino, etc.) — use `console.log` with JSON lines to match existing style; upgrade later if needed
- **P2P / gossip logging** — out of scope; stays in `p2p/`
- **Frontend client logging** — out of scope
- **Audit trail / persistence** — logs go to stdout only (Docker `json-file` driver captures them)

---

## Dependencies

- **Epic 12** — Backend API & Src Layout Refactor ⬜ (**must be ✅ Done first**)
  - Provides `src/api/server.ts` — single wiring point for Elysia plugins
  - Provides `src/api/auth.ts` — auth runs in `onBeforeHandle`; logger must not leak tokens
  - Provides `src/shared/config.ts` — optional `logging` config field
- **Epic 6** — Audit & Security ✅ (API key auth; ensure logs never include credentials)

No SPEC milestone dependency.

---

## Target Structure

```text
src/
  api/
    server.ts              # .use(createRequestLogger()), Yoga logging plugin
    logging/
      request-logger.ts    # Elysia plugin: onRequest + onAfterResponse
    auth.ts
    graphql/
      ...
  shared/
    config.ts              # optional LoggingConfig { enabled: boolean }
```

---

## Dependency Rules

```text
api/logging  → (no domain imports)
api/server   → api/logging, shared/config
```

**Invariant:** `api/logging/` must not import from `ledger/`, `p2p/`, or `issues/`.

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Create `src/api/logging/request-logger.ts` — `createRequestLogger()` Elysia plugin | feature | critical |
| ⬜ | Wire logger in `src/api/server.ts` via `.use(createRequestLogger())` before auth | feature | critical |
| ⬜ | Add GraphQL Yoga plugin — log operation name, type, duration | feature | high |
| ⬜ | Skip `/health` requests (or log at debug only) to reduce Docker noise | feature | medium |
| ⬜ | Optional `logging.enabled` in `src/shared/config.ts` + `gl-node.config.json` | feature | low |
| ⬜ | Test — verify `Authorization` header is never written to log output | test | high |
| ⬜ | Full verification — `bun test`, lint, `smoke-test-api-only.sh` | infra | critical |

---

## Implementation Plan

### Step 1 — Request Logger Plugin (Low risk)

**Create `src/api/logging/request-logger.ts`:**

```typescript
import { Elysia } from "elysia";

const starts = new WeakMap<Request, number>();

export interface RequestLoggerOptions {
  /** When false, plugin is a no-op. Default: true */
  enabled?: boolean;
  /** Paths to skip (e.g. ["/health"]). Default: ["/health"] */
  skipPaths?: string[];
}

export function createRequestLogger(options: RequestLoggerOptions = {}) {
  const enabled = options.enabled ?? true;
  const skipPaths = new Set(options.skipPaths ?? ["/health"]);

  return new Elysia({ name: "request-logger" })
    .onRequest(({ request }) => {
      if (!enabled) return;
      starts.set(request, performance.now());
    })
    .onAfterResponse(({ request, set }) => {
      if (!enabled) return;
      const url = new URL(request.url);
      if (skipPaths.has(url.pathname)) return;

      const start = starts.get(request);
      const durationMs = start ? Math.round(performance.now() - start) : null;

      console.log(
        JSON.stringify({
          level: "info",
          event: "http.request",
          method: request.method,
          path: url.pathname,
          status: set.status ?? 200,
          durationMs,
        }),
      );
    })
    .as("plugin");
}
```

**Verify:** unit test or manual `curl` — log line appears for `/graphql`, not for `/health`.

**Files:** `src/api/logging/request-logger.ts` (new)

---

### Step 2 — Wire in API Server (Low risk)

**Update `src/api/server.ts`:**

```typescript
import { createRequestLogger } from "./logging/request-logger";

const application = new Elysia()
  .use(createRequestLogger({ enabled: config.logging?.enabled ?? true }))
  .onBeforeHandle(createAuthHandler(config.auth))
  // ...
```

Register logger **before** auth so 401 responses are also logged.

**Verify:**

```bash
bun run src/index.ts
curl -sf http://localhost:4000/health          # no log line
curl -sf http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ health { status } }"}'       # log line with POST /graphql
```

**Files:** `src/api/server.ts`

---

### Step 3 — GraphQL Operation Logging (Low risk)

**Add Yoga plugin in `src/api/server.ts` where `createYoga` is called:**

```typescript
const yoga = createYoga({
  schema,
  plugins: [
    {
      onExecute({ args: { operationName, document } }) {
        const def = document.definitions.find((d) => d.kind === "OperationDefinition");
        const name =
          operationName ??
          (def?.kind === "OperationDefinition" ? def.name?.value : undefined) ??
          "anonymous";
        const type = def?.kind === "OperationDefinition" ? def.operation : "query";
        const start = performance.now();
        return {
          onExecuteDone() {
            console.log(
              JSON.stringify({
                level: "info",
                event: "graphql.execute",
                operation: name,
                type,
                durationMs: Math.round(performance.now() - start),
              }),
            );
          },
        };
      },
    },
  ],
});
```

**Verify:** smoke test mutations and queries — operation names appear in logs.

**Files:** `src/api/server.ts`

---

### Step 4 — Config Toggle (Optional, low risk)

**Add to `src/shared/config.ts`:**

```typescript
export interface LoggingConfig {
  readonly enabled: boolean;
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = { enabled: true };
```

Wire into `NodeConfig` and `gl-node.config.json` example.

**Verify:** `logging.enabled: false` suppresses all request log lines.

**Files:** `src/shared/config.ts`, `gl-node.config.json`

---

### Step 5 — Security Test (Low risk)

**Create `test/request-logger.test.ts`:**

- Mock or spy on `console.log`
- Send request with `Authorization: Bearer secret-key`
- Assert log output does not contain `secret-key` or `Authorization`

**Verify:**

```bash
bun test test/request-logger.test.ts
```

---

### Step 6 — Full Verification

```bash
bun test
bun run lint
bun run src/index.ts
bash scripts/smoke-test-api-only.sh
```

---

## What Does NOT Change

| Area | Changes? |
|------|----------|
| `frontend/` | **No** |
| `package.json` entry | No — still `src/index.ts` |
| Docker / Makefile | No |
| P2P logging | No — gossip/anti-entropy logs unchanged |
| Runtime API behavior | No — logging only |

---

## Session Checklist

1. [ ] Confirm Epic 12 is ✅ Done (`src/api/server.ts` exists)
2. [ ] Step 1: Create `src/api/logging/request-logger.ts`
3. [ ] Step 2: Wire logger in `src/api/server.ts`
4. [ ] Step 3: Add GraphQL Yoga logging plugin
5. [ ] Step 4: (Optional) Config toggle in `shared/config.ts`
6. [ ] Step 5: Security test — no auth header leakage
7. [ ] Step 6: Full `bun test` + smoke tests
8. [ ] Commit and update this page

---

## Suggested Commit Boundaries

1. `feat(api): add request logger plugin`
2. `feat(api): wire request logger in server`
3. `feat(api): add graphql operation logging`
4. `feat(config): optional logging toggle`
5. `test(api): verify auth header not logged`

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| | | | |
