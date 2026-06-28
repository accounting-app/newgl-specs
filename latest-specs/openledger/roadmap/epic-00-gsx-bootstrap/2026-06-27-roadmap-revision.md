---
title: "2026-06-27 — Roadmap Revision: Docker Compose Priority, Frontend Onboard, Issue Tracker Prep"
description: "Roadmap revision session — deferred Epic 07, promoted Epic 09 to Critical, created Epic 11 (Front-End Onboarding with Radix migration), prepped Epic 10 (Issue Tracker)."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, revision, epic-09, epic-10, epic-11, docker-compose, frontend, issue-tracker"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# 2026-06-27 — Roadmap Revision

**Session type:** Roadmap revision (non-code)
**Conversation:** Roadmap Revision Session

---

## What Changed

### 1. Epic 07 — Deploy (Fly.io) ⏸️ Deferred

- Status changed from `⬜ Not Started` → `⏸️ Deferred`
- Priority changed from `🟡 Medium` → `🔵 Low`
- Cloud deploy (Fly.io, multi-node) deferred until local stack and frontend are working
- Added dependencies on Epic 09 and Epic 11

### 2. Epic 09 — Docker Compose & Local Dev 🔴 Critical (NEW)

- Promoted from `📋 Unplanned` to main roadmap as `🔴 Critical`
- Full overview.md created with 7 issues
- Scope: Refine docker-compose.yml, dev overrides with hot reload, Makefile, health verification
- Unblocks Epic 11 (frontend) and Epic 10 (issue tracker)

### 3. Epic 11 — Front-End Onboarding 🔴 High (NEW)

- New epic created — onboard `newgl-ui` into OpenLedger monorepo as `frontend/`
- 13 issues scoped across 3 phases: scaffold/copy, Radix UI migration, Docker integration
- Junior dev's page structure preserved: Home, `/register`, `/reports`
- Migration from Tailwind CSS → Radix UI Themes for ShrikeStash compatibility
- `LayoutShell` pattern adopted from ShrikeStash
- Domain model (`modules/accounting/`) retained as-is

### 4. Epic 10 — Built-In Issue Tracker 🔵 Low (NEW)

- Promoted from `📋 Unplanned` to main roadmap as `🔵 Low`
- Deferred until after Epic 11 Radix migration is complete
- Full overview.md created with 11 issues following ShrikeStash issues page pattern
- Scope: Issue data model, GraphQL CRUD, `/issues` page with stat cards and filters

### 5. Roadmap Updated

- Epic Summary table: 12 epics total (was 8)
- Dependency graph: new parallel path `E0 → E9 → E11 → E10`
- Epic 07 shown as deferred with dotted lines
- Critical paths section: SPEC path + Local Dev path + Deploy path
- Phase Coverage: added Non-SPEC Epics table
- Unplanned section: only Epic 8 (CI Pipeline) remains

### 6. Overview Updated

- Status line updated to mention Docker Compose priority
- Phase tables restructured: Phase 1 includes Epic 09, Phase 2 includes Epic 11
- New "Deferred / Future" section for Epic 07 and Epic 10
- File structure tree: added `frontend/`, `docker-compose.dev.yml`, `Makefile`, `src/issues/`
- Epic count updated to 12

---

## Files Modified

| File | Action |
|------|--------|
| `roadmap/epic-07-deploy/overview.md` | Modified — deferred |
| `roadmap/epic-09-docker-compose/overview.md` | Created |
| `roadmap/epic-11-frontend-onboard/overview.md` | Created |
| `roadmap/epic-10-issue-tracker/overview.md` | Created |
| `roadmap.md` | Modified — new table, graph, paths |
| `overview.md` | Modified — phases, file tree, status |

---

## Design Decisions

1. **Monorepo style** — `newgl-ui` copied into `openledger/frontend/` rather than kept as separate repo. Simplifies Docker Compose networking, shared dev workflow, and junior dev onboarding.
2. **Radix UI migration** — Epic 11 includes full migration from Tailwind to Radix UI Themes. ShrikeStash compatibility requires matching the UI framework, not just the page structure.
3. **Issue tracker deferred** — Epic 10 waits until Radix migration is complete so the UI is built natively with Radix. No Tailwind → Radix rework.
4. **Two parallel critical paths** — SPEC path (Epics 1–6) and Local Dev path (Epics 9→11→10) can run independently from Epic 0. Deploy (Epic 7) is gated on both.
