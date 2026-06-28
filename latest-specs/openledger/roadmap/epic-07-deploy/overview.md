---
title: "Epic 7 — Deploy"
description: "SPEC Milestone M6 — bun build --compile single binary, Fly.io config with persistent volume + public IPv6, multi-node smoke test."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-7, deploy, fly-io, production"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 7 — Deploy (Fly.io)

**Status:** ⏸️ Deferred
**Priority:** 🔵 Low
**Estimated Sessions:** ~1–2
**SPEC Milestone:** M6 — Deploy (§3.9)
**Scope:** `fly.toml`, Dockerfile optimization, multi-node verification

> [!NOTE]
> **Deferred 2026-06-27:** Cloud deployment is deferred until the full stack (API + frontend) is running locally via Docker Compose (Epic 09) and the frontend is onboarded (Epic 11). The Dockerfile optimization issue is shared with Epic 09 — it will be addressed there first.

---

## Context

From SPEC §4, Milestone M6:

> - `bun build --compile`; Fly.io config with volume + public IPv6.
> - Multi-node smoke test on Fly; verify peer addressability.
> - *Done when:* a 3-node cluster converges in production.

---

## Dependencies

- **Epic 6** — Audit, Checkpoints & Security ✅ (provides complete feature set)
- **Epic 9** — Docker Compose ⬜ (local stack must work before cloud deploy)
- **Epic 11** — Front-End Onboard ⬜ (full app must be integrated before deploy)

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Optimize Dockerfile for `bun build --compile` single binary | infra | high |
| ⬜ | Create `fly.toml` — Machine config with persistent volume + public IPv6 (§3.9) | infra | critical |
| ⬜ | Verify host capability contract — CAP-1 through CAP-5 (§3.10) on Fly.io | infra | critical |
| ⬜ | Deploy single node — verify health, GraphQL endpoint, `.bean` persistence | infra | high |
| ⬜ | Deploy 3-node cluster — verify peer discovery, gossip, convergence | infra | critical |
| ⬜ | Multi-node smoke test — partition one node, reconnect, verify byte-identical `.bean` | infra | critical |
| ⬜ | Document deployment in `docs/deploy.md` | infra | medium |

---

## Session Checklist

1. [ ] Read SPEC §3.9 (deployment topology), §3.10 (host capability contract)
2. [ ] Optimize Dockerfile for single-binary output
3. [ ] Create fly.toml with volume + IPv6
4. [ ] Deploy single node, verify health
5. [ ] Deploy 3-node cluster
6. [ ] Run convergence smoke test
7. [ ] Document deployment steps
8. [ ] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
