---
title: "Epic 0 — GSX Bootstrap & Scaffolding"
description: "Bootstrap OpenLedger into the gsx-infra ecosystem — wiki pages, workflow docs, Bun project scaffold, Docker Compose, stubbed GraphQL server."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-0, bootstrap, scaffolding"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 0 — GSX Bootstrap & Scaffolding

**Status:** 🔄 In Progress
**Priority:** 🔴 Critical
**Estimated Sessions:** ~1
**SPEC Milestone:** N/A — pre-milestone scaffolding
**Scope:** Project scaffolding — no application logic

---

## Context

OpenLedger is a green-field project with only `SPEC.md` + `.gitignore`. Before any SPEC milestone work can begin, we need the GSX ecosystem scaffolding: wiki pages, workflow documents, Bun project initialization, Docker Compose, and a stubbed server that proves the stack works.

This epic is executed by the platform team (not the project owner). Everything here is rails for the developer to run on.

---

## Dependencies

- None — this is the root epic.

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ✅ | Create gsx-wiki project overview (`overview.md`) | infra | critical |
| ✅ | Create gsx-wiki project roadmap (`roadmap.md`) with 8+ epics | infra | critical |
| ✅ | Create epic folder structure with overview stubs (Epics 0–7) | infra | critical |
| ✅ | Create in-repo `docs/` with 5 workflow documents | infra | critical |
| ✅ | Initialize Bun project (`package.json`, `tsconfig.json`) | infra | high |
| ✅ | Create stubbed Elysia + GraphQL Yoga server (`src/index.ts`) | infra | high |
| ✅ | Create Pothos schema stub matching SPEC §2.6 | infra | high |
| ✅ | Create Dockerfile + docker-compose.yml | infra | high |
| ✅ | Create `gl-node.config.json` stub | infra | medium |
| ✅ | Update `gsx-wiki/projects/index.md` with OpenLedger entry | infra | medium |

---

## Acceptance Criteria

- [ ] `bun install` succeeds with all locked dependencies
- [ ] `bun run dev` starts the server and `/health` returns OK
- [ ] GraphQL schema introspects at `/graphql` (all §2.6 types visible)
- [ ] `bun test` passes with at least one test (health endpoint)
- [ ] All gsx-wiki pages have valid frontmatter
- [ ] All `docs/*.md` files cross-reference correct paths
- [ ] Docker Compose builds and runs (`docker compose up -d --build`)
- [ ] Roadmap shows all 8 planned + 3 unplanned epics

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-06-27 | All 10 issues | GSX Bootstrap Session | Full wiki scaffolding, Bun project, stubbed server, Docker Compose, workflow docs |
