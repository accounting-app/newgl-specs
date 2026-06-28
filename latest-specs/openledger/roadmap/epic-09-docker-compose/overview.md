---
title: "Epic 9 — Docker Compose & Local Dev"
description: "Full local development workflow via docker compose up — one-liner to run the complete OpenLedger stack (API + future frontend) with hot reload, data persistence, and health verification."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-9, docker-compose, local-dev, infrastructure"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 9 — Docker Compose & Local Dev

**Status:** ⬜ Not Started
**Priority:** 🔴 Critical
**Estimated Sessions:** ~1–2
**SPEC Milestone:** — (operational tooling, not spec-driven)
**Scope:** `docker-compose.yml`, `docker-compose.dev.yml`, Dockerfile, Makefile/scripts, local dev docs

---

## Context

OpenLedger already has a basic `docker-compose.yml` with a single `gl-node` service and a `Dockerfile` that compiles to a single binary. This epic extends that foundation into a **complete local development workflow**:

- `docker compose up` — one command to run the full stack
- Hot reload for active development
- Persistent data volumes for `.bean` ledger files
- Health and GraphQL verification from the containerized stack
- Ready for Epic 11 (Front-End Onboard) to add a `frontend` service

### Why Critical?

The Docker Compose workflow is the prerequisite for:
- **Epic 11** — Frontend can't wire to the API without a compose network
- **Epic 10** — Issue tracker needs both API and frontend running
- **Epic 07** — Cloud deploy should only happen after local stack works

---

## Dependencies

- **Epic 0** — GSX Bootstrap 🔄 (scaffolding in place)
- No SPEC milestone dependency — this is infrastructure

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Refine `docker-compose.yml` — validate existing `gl-node` service, add network labels | infra | critical |
| ⬜ | Validate Dockerfile builds clean with `bun build --compile` single binary | infra | critical |
| ⬜ | Create `docker-compose.dev.yml` override — host source mounts for hot reload during development | infra | high |
| ⬜ | Add `Makefile` with one-liner targets: `make dev`, `make build`, `make clean`, `make health` | infra | high |
| ⬜ | Verify health endpoint + GraphQL introspection from containerized stack | infra | high |
| ⬜ | Reserve `frontend` service slot in compose — commented template for Epic 11 | infra | medium |
| ⬜ | Update `docs/local-dev-testing-workflow.md` — Docker Compose as primary dev mode | docs | medium |

---

## Implementation Plan

### Phase 1: Validate & Refine Existing Stack
1. Build and run existing `docker-compose.yml` → verify `gl-node` starts
2. Test health endpoint: `curl -sf http://localhost:4000/health`
3. Test GraphQL: introspection query from host
4. Fix any build or runtime issues

### Phase 2: Dev Workflow
1. Create `docker-compose.dev.yml` with source volume mounts for hot reload
2. Add Makefile with targets: `dev` (compose up with dev overrides), `build` (rebuild), `clean` (down -v), `health` (curl check)
3. Verify hot reload works — change a file, see it reflected

### Phase 3: Documentation & Prep
1. Update local dev workflow doc with Docker Compose as Mode 1
2. Add commented `frontend` service template (port 3000, depends on `gl-node`)
3. Verify end-to-end: clean clone → `make dev` → health passes

---

## Session Checklist

1. [ ] Read existing `docker-compose.yml` and `Dockerfile`
2. [ ] Build and verify `docker compose up` works
3. [ ] Create `docker-compose.dev.yml` with hot reload mounts
4. [ ] Create `Makefile` with dev targets
5. [ ] Verify health + GraphQL from containers
6. [ ] Add frontend service template (commented)
7. [ ] Update `docs/local-dev-testing-workflow.md`
8. [ ] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
