---
title: "Epic ZZ — Bun Toolchain & Node Config Profiles"
description: "Standardize on Bun lockfiles across the monorepo, remove npm lockfiles, align package.json dev scripts, and support alternate gl-node.config.json profiles via CLI/env with fallback to the default config."
published: true
date: 2026-06-28T00:00:00.000Z
tags: "openledger, roadmap, epic-zz, bun, lockfile, toolchain, gl-node-config, infrastructure"
editor: markdown
dateCreated: 2026-06-28T00:00:00.000Z
---

# Epic ZZ — Bun Toolchain & Node Config Profiles

**Status:** 📋 Proposed (awaiting approval — do not execute)
**Priority:** 🟡 Medium
**Estimated Sessions:** ~1
**SPEC Milestone:** — (developer tooling; no SPEC invariant changes)
**Scope:** Root + `frontend/` `package.json`, lockfiles, `.gitignore`, `gl-node.config*.json`, `src/index.ts`, `docs/local-dev-testing-workflow.md`

---

## Context

OpenLedger is Bun-first (`docs/epic-worksession-workflow.md`), but the repo still mixes package managers in practice:

- `package-lock.json` in `frontend/` while Bun is the intended runtime
- `bun.lock` was gitignored, so installs were not reproducible from a clean clone
- Minor `package.json` drift (no root `ui` script; frontend dev port inconsistent with docs)
- Only one checked-in node config (`gl-node.config.json`); P2P local testing needs a separate profile
- `loadConfig(configPath?)` exists in `src/ledger/config.ts`, but `src/index.ts` always loads the default path

This epic locks down the **package manager story** and adds **named config profiles** without changing ledger, P2P, or GraphQL behavior.

### Out of scope

- SPEC.md changes
- New conformance test obligations (CT-*)
- Docker Compose / CI changes (Epics 8, 9)
- Committing local secrets or peer identity keys (`data/peer-identity.key` stays untracked)

---

## Dependencies

- **Epic 0** — GSX Bootstrap 🔄 (Bun project and `gl-node.config.json` stub exist)
- No dependency on Epics 12–13 (API refactor / request logging)

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Remove all non-Bun lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` if present) | infra | high |
| ⬜ | Commit `bun.lock` at repo root and `frontend/bun.lock` | infra | high |
| ⬜ | Update `.gitignore` — track `bun.lock` (stop ignoring it) | infra | high |
| ⬜ | Add `"packageManager": "bun@1.3.13"` to root `package.json` (match `frontend/package.json`) | infra | medium |
| ⬜ | Root `package.json` — add `"ui": "cd frontend && bun dev"` script | infra | medium |
| ⬜ | `frontend/package.json` — align dev/start port to `3000` (consistent with local dev docs) | infra | medium |
| ⬜ | Add `gl-node.config.p2p.json` — P2P-enabled profile (bootstrap peers, `p2p.enabled: true`) | infra | medium |
| ⬜ | Wire config path at bootstrap — `GL_NODE_CONFIG` env and/or `--config <path>`; fallback `gl-node.config.json` | feature | high |
| ⬜ | Document config profiles and Bun install workflow in `docs/local-dev-testing-workflow.md` | docs | medium |
| ⬜ | Verify `bun install` + `bun test` pass at root after lockfile migration | test | high |

---

## Acceptance Criteria

- [ ] Clean clone → `bun install` at root and in `frontend/` succeeds
- [ ] No `package-lock.json` (or other non-Bun lockfiles) in the repo
- [ ] `bun.lock` files are tracked and produce reproducible installs
- [ ] `bun run ui` starts the frontend dev server
- [ ] `bun run dev` loads `./gl-node.config.json` when no override is set
- [ ] `GL_NODE_CONFIG=./gl-node.config.p2p.json bun run dev` (or equivalent `--config`) loads the P2P profile
- [ ] `bun test` passes — no regression in existing tests
- [ ] `data/peer-identity.key` is not committed

---

## Implementation Plan

### Phase 1 — Bun toolchain standardization

1. Delete `frontend/package-lock.json` (and any other npm/yarn/pnpm locks)
2. Run `bun install` at root and in `frontend/` to generate/update `bun.lock`
3. Update `.gitignore`: remove or comment out the `bun.lock` ignore rule
4. Add `packageManager` to root `package.json`
5. Add root `ui` script; align frontend port to `3000`

### Phase 2 — Config profiles

1. Add `gl-node.config.p2p.json` as a documented alternate profile (P2P on; keep secrets/bootstrap peers as local-dev examples only)
2. In `src/index.ts`, resolve config path:
   - **Precedence:** `--config <path>` → `GL_NODE_CONFIG` env → default `gl-node.config.json`
   - Pass resolved path to `loadConfig(resolvedPath)`
3. Log which config file was loaded at boot (aids debugging)

### Phase 3 — Docs & verification

1. Update `docs/local-dev-testing-workflow.md` with:
   - Bun-only install instructions
   - How to run default vs P2P config
2. Run `bun test` at root
3. Smoke-check: `bun run dev` (default) and P2P profile both boot

---

## Session Checklist

1. [ ] Audit lockfiles across repo (root + `frontend/`)
2. [ ] Apply Phase 1 package manager changes
3. [ ] Add `gl-node.config.p2p.json`
4. [ ] Wire config path in `src/index.ts`
5. [ ] Update local dev docs
6. [ ] Run `bun test`
7. [ ] Update this epic page (issue statuses + session log)
8. [ ] Open PR referencing Epic ZZ only

---

## Pre-work notes

Partial implementation may already exist in the working tree (e.g. `.gitignore`, `package.json`, `gl-node.config.p2p.json`). Treat this epic as the **approval record** — verify each issue against the repo before marking ✅.

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
