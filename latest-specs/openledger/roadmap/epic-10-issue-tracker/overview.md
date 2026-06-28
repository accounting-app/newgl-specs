---
title: "Epic 10 — Built-In Issue Tracker"
description: "DB-backed issue CRUD with GraphQL API and /issues page following the ShrikeStash issue tracker pattern. Full issue lifecycle: create, filter, status transitions, stats dashboard."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-10, issue-tracker, graphql, shrikestash-pattern"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 10 — Built-In Issue Tracker

**Status:** ⬜ Not Started
**Priority:** 🔵 Low (deferred until after Epic 11 Radix migration)
**Estimated Sessions:** ~2–3
**SPEC Milestone:** — (project management tooling, not spec-driven)
**Scope:** Issue data model, GraphQL CRUD, `/issues` page, stats dashboard

> [!NOTE]
> **Sequencing:** This epic is deferred until Epic 11 (Front-End Onboard + Radix migration) is complete. The issue tracker UI must be built with Radix UI Themes from the start — no Tailwind.

---

## Context

OpenLedger currently tracks issues **inside epic overview pages** in gsx-wiki (markdown tables). This epic adds a **built-in issue tracker** to the OpenLedger application itself — a first-class GraphQL resource with a dedicated UI page.

### Pattern Reference: ShrikeStash

The ShrikeStash project has a proven issue tracker implementation:

- **API:** `listIssues`, `getIssueStats`, `createIssue`, `updateIssue` 
- **Frontend:** `/issues` page with stat cards (Open/In Progress/Resolved/Total), filter bar (status/type/severity), issue card list
- **Components:** `IssueCard.tsx` (status badges, actions), `IssueCreateForm.tsx` (modal form)
- **Data model:** `Issue` type with `id`, `title`, `description`, `type`, `severity`, `status`, `resolution`, timestamps

This epic replicates that pattern adapted for OpenLedger's GraphQL/Pothos stack.

---

## Dependencies

- **Epic 9** — Docker Compose ⬜ (needs running stack)
- **Epic 11** — Front-End Onboard ⬜ (needs Radix UI frontend in place)

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Design issue data model — `Issue` type matching ShrikeStash fields | feature | high |
| ⬜ | Decide storage backend — SQLite file in `data/` vs Beancount metadata vs JSON file | spike | high |
| ⬜ | Add `Issue` type to Pothos GraphQL schema | feature | critical |
| ⬜ | Implement `createIssue` mutation | feature | critical |
| ⬜ | Implement `updateIssue` mutation (status transitions, resolution) | feature | critical |
| ⬜ | Implement `listIssues` query with filters (status, type, severity) | feature | critical |
| ⬜ | Implement `getIssueStats` query (open, in_progress, resolved, total counts) | feature | high |
| ⬜ | Build `/issues` page — stat cards + filter bar + issue list (Radix UI Themes) | feature | high |
| ⬜ | Build `IssueCard` component — status badge, type/severity icons, status change actions | feature | high |
| ⬜ | Build `IssueCreateForm` component — modal dialog with form fields | feature | high |
| ⬜ | End-to-end test — create issue via UI, verify in GraphQL, filter, change status | infra | medium |

---

## Implementation Plan

### Phase 1: Data Model & Storage (~1 session)
1. Define `Issue` interface/type in TypeScript:
   ```typescript
   interface Issue {
     id: number;
     title: string;
     description?: string;
     type: 'feature' | 'bug' | 'infra' | 'ux' | 'performance' | 'spike';
     severity: 'low' | 'medium' | 'high' | 'critical';
     status: 'open' | 'in_progress' | 'resolved' | 'wontfix';
     resolution?: string;
     createdAt: string;
     updatedAt: string;
   }
   ```
2. Spike on storage: SQLite (via `bun:sqlite`) is the likely choice — simple, file-based, fits the single-tenant model
3. Create `src/issues/` module with store implementation

### Phase 2: GraphQL API (~1 session)
1. Add `Issue` type to Pothos schema
2. Implement queries: `listIssues(status?, type?, severity?)`, `getIssueStats`
3. Implement mutations: `createIssue(input!)`, `updateIssue(id!, input!)`
4. Test via GraphQL Playground

### Phase 3: Frontend UI (~1 session)
1. Create `frontend/app/issues/page.tsx` following ShrikeStash pattern:
   - Stat cards (Open / In Progress / Resolved / Total)
   - Filter row (Status, Type, Severity dropdowns — Radix `Select`)
   - Issue card list
2. Build `IssueCard` component — Radix `Card`, `Badge`, `DropdownMenu` for status actions
3. Build `IssueCreateForm` — Radix `Dialog` with form fields
4. Wire to GraphQL API via the client established in Epic 11

---

## ShrikeStash Pattern Reference

| Component | ShrikeStash File | Replicate? |
|-----------|-----------------|------------|
| Issues page | `frontend/app/issues/page.tsx` | ✅ Adapt for Pothos/GraphQL |
| Issue card | `frontend/components/IssueCard.tsx` | ✅ Radix Card variant |
| Create form | `frontend/components/IssueCreateForm.tsx` | ✅ Radix Dialog variant |
| API client | `frontend/lib/api.ts` → `listIssues`, `createIssue`, `updateIssue` | ✅ GraphQL client |
| Types | `frontend/lib/types.ts` → `Issue`, `IssueStats`, `IssueStatus` | ✅ Shared types |

---

## Session Checklist

1. [ ] Design issue data model
2. [ ] Implement SQLite-backed issue store
3. [ ] Add Issue type to Pothos schema
4. [ ] Implement GraphQL queries and mutations
5. [ ] Test API via GraphQL Playground
6. [ ] Build `/issues` page with Radix UI
7. [ ] Build IssueCard and IssueCreateForm components
8. [ ] End-to-end verification
9. [ ] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
