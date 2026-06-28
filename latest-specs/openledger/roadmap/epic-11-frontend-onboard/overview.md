---
title: "Epic 11 — Front-End Onboarding"
description: "Onboard the newgl-ui Next.js app into the OpenLedger monorepo as frontend/. Retain existing page structure (Home, Register, Reports) and accounting domain model. Migrate from Tailwind to Radix UI Themes for ShrikeStash compatibility."
published: true
date: 2026-06-27T00:00:00.000Z
tags: "openledger, roadmap, epic-11, frontend, newgl-ui, next-js, radix-ui, onboarding"
editor: markdown
dateCreated: 2026-06-27T00:00:00.000Z
---

# Epic 11 — Front-End Onboarding

**Status:** ⬜ Not Started
**Priority:** 🔴 High
**Estimated Sessions:** ~3–4
**SPEC Milestone:** — (UI layer, not spec-driven)
**Scope:** `frontend/` directory, Next.js App Router, Radix UI Themes migration, GraphQL client wiring

---

## Context

The **newgl-ui** repo (`github.com/mrrobot16/newgl-ui`, package name `quickslike`) is a Next.js 16 + Tailwind + Bun app built by the junior dev. It has:

- **Pages:** Home (greeting screen), `/register` (bank register), `/reports`
- **Components:** `AppShell` layout, `bank-register`, `reports`, `home`, `theme`, `icons`, `ui`
- **Domain model:** `modules/accounting/` — clean architecture with `domain/`, `application/`, `presentation/`, `config/`, `mocks/`
- **Tech:** Next.js 16, React 19, Tailwind CSS 3.4, Bun 1.3, Zod, Lucide icons

### Onboarding Strategy

**Monorepo style** — copy newgl-ui into `openledger/frontend/` as a subdirectory. This keeps everything in one repo for easier onboarding, shared Docker Compose, and unified dev workflow.

### ShrikeStash Compatibility

The frontend must adopt the **ShrikeStash front-end pattern** for cross-project consistency:

| Pattern | ShrikeStash | newgl-ui (current) | Target |
|---------|------------|-------------------|--------|
| Framework | Next.js (App Router) | Next.js (App Router) ✅ | Keep |
| UI Library | Radix UI Themes | Tailwind CSS | **Migrate to Radix** |
| Layout | `LayoutShell` (sidebar + header + content) | `AppShell` | Align to `LayoutShell` pattern |
| State | Zustand + React Context | React hooks | Adopt as needed |
| Icons | Lucide | Lucide ✅ | Keep |
| Auth | `AuthGuard` + `AuthContext` | None | Defer (not needed yet) |

### Junior Dev Constraint

> ⚠️ **Retain existing page structure and functionality.** The junior dev wants to keep his routing (`/`, `/register`, `/reports`) and the `modules/accounting` domain architecture. The migration to Radix replaces the styling layer, not the page logic or domain model.

---

## Dependencies

- **Epic 9** — Docker Compose ⬜ (compose network needed to wire frontend → API)
- **newgl-ui repo** — Source material (copy, don't fork)

---

## Issues

| Status | Title | Type | Severity |
|--------|-------|------|----------|
| ⬜ | Scaffold `frontend/` directory in OpenLedger monorepo — `npx create-next-app` or copy | infra | critical |
| ⬜ | Copy newgl-ui source into `frontend/` — preserve page structure, components, modules | infra | critical |
| ⬜ | Install Radix UI Themes — add `@radix-ui/themes`, remove Tailwind CSS + PostCSS | infra | critical |
| ⬜ | Migrate `AppShell` → `LayoutShell` — sidebar nav, header, content area (ShrikeStash pattern) | feature | critical |
| ⬜ | Migrate Home page — replace Tailwind classes with Radix components | feature | high |
| ⬜ | Migrate `/register` (Bank Register) page — Radix `Table`, `Box`, `Flex`, `Text` | feature | high |
| ⬜ | Migrate `/reports` page — Radix components for report display | feature | high |
| ⬜ | Migrate `modules/accounting/` — domain model stays, presentation layer uses Radix | feature | high |
| ⬜ | Migrate `ui/` and `icons/` components — Radix primitives + Lucide | feature | medium |
| ⬜ | Migrate `theme/` — replace Tailwind theme with Radix `Theme` provider (dark mode) | feature | high |
| ⬜ | Add `frontend` service to `docker-compose.yml` — Next.js dev on port 3000, depends on `gl-node` | infra | critical |
| ⬜ | Wire GraphQL client — connect to OpenLedger API at `http://gl-node:4000/graphql` | feature | critical |
| ⬜ | Verify end-to-end — `docker compose up` runs both API + frontend, pages load, data flows | infra | critical |

---

## Implementation Plan

### Phase 1: Scaffold & Copy (~1 session)
1. Create `frontend/` directory in OpenLedger repo
2. Copy newgl-ui source preserving structure:
   - `src/app/` → pages (Home, register, reports)
   - `src/components/` → all component directories
   - `src/modules/accounting/` → domain model
   - `src/hooks/`, `src/lib/`, `src/constants/`, `src/configuration/`, `src/shared/`
3. Copy config files: `package.json`, `tsconfig.json`, `next.config.mjs`
4. Verify `bun install` + `bun run dev` works standalone

### Phase 2: Radix Migration (~1–2 sessions)
1. Replace Tailwind with Radix UI Themes:
   - `bun add @radix-ui/themes`
   - Remove `tailwindcss`, `autoprefixer`, `postcss`, `tailwind.config.ts`, `postcss.config.mjs`
   - Add Radix theme CSS imports
2. Migrate layout: `AppShell` → `LayoutShell` (sidebar + header + content area)
3. Migrate pages one by one — replace Tailwind utility classes with Radix components:
   - `<div className="flex">` → `<Flex>`
   - `<p className="text-sm text-gray-500">` → `<Text size="2" color="gray">`
   - Cards, buttons, inputs → Radix equivalents
4. Migrate theme provider — `ThemeProvider` → Radix `<Theme appearance="dark">` 
5. Keep domain model (`modules/accounting/`) untouched — only the presentation layer changes

### Phase 3: Docker Integration (~1 session)
1. Add `frontend` service to `docker-compose.yml`:
   ```yaml
   frontend:
     build:
       context: ./frontend
       dockerfile: Dockerfile
     ports:
       - "3000:3000"
     depends_on:
       - gl-node
     environment:
       - NEXT_PUBLIC_API_URL=http://gl-node:4000
   ```
2. Create `frontend/Dockerfile` (multi-stage Next.js build)
3. Wire GraphQL client in frontend → `http://gl-node:4000/graphql`
4. Verify end-to-end: `docker compose up` → both services healthy → pages render with API data

---

## Source Reference

| What | newgl-ui Path | Notes |
|------|--------------|-------|
| Main page | `src/app/page.tsx` | `<HomeGreetingScreen />` |
| Register page | `src/app/register/page.tsx` | `<BankRegisterLayout />` |
| Reports page | `src/app/reports/page.tsx` | `<ReportsPage />` |
| App layout | `src/app/layout.tsx` | `AppShell` + `ThemeProvider` |
| Domain model | `src/modules/accounting/domain/` | `models.ts`, `accounting-reports.ts`, `events.ts`, `periods.ts` |
| Presentation | `src/modules/accounting/presentation/` | `transaction-type-policy.ts` |
| Components | `src/components/` | `bank-register/`, `home/`, `reports/`, `layout/`, `theme/`, `icons/`, `ui/` |

### ShrikeStash Pattern Reference

| What | ShrikeStash Path | Notes |
|------|-----------------|-------|
| Layout shell | `frontend/components/layout/LayoutShell.tsx` | Sidebar + header + content |
| Radix theme | `frontend/app/layout.tsx` | `<Theme appearance="dark" accentColor="red">` |
| Issues page | `frontend/app/issues/page.tsx` | Pattern for Epic 10 |

---

## Session Checklist

1. [ ] Copy newgl-ui source into `openledger/frontend/`
2. [ ] Verify standalone build works
3. [ ] Install Radix UI Themes, remove Tailwind
4. [ ] Migrate layout → LayoutShell pattern
5. [ ] Migrate Home, Register, Reports pages to Radix
6. [ ] Migrate theme provider to Radix Theme
7. [ ] Add frontend service to docker-compose.yml
8. [ ] Wire GraphQL client
9. [ ] Verify end-to-end docker compose up
10. [ ] Commit and update this page

---

## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
