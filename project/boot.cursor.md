# Cursor Bootstrap — QuickBooks-like Accounting System (SDD)

## Role

You are Cursor acting as a senior software architect + full-stack engineer.

You will initialize a complete Next.js + TypeScript + Tailwind project
based ONLY on the existing `/specs` folder.

This system is a Spec-Driven Development (SDD) architecture.

---

# 📌 MISSION

You must:

1. Create a fully working Next.js project inside this folder
2. Install and configure all dependencies
3. Build project structure following `/specs/project/bootstrap-architecture.md`
4. Generate TypeScript domain models from `/specs`
5. Create mock services (NO backend yet)
6. Build initial Bank Register UI (Next.js + Tailwind)
7. Connect everything using event-driven architecture
8. Ensure the system runs with `npm run dev`

---

# ⚠️ CRITICAL RULES

## Rule 1 — Specs are the Source of Truth

- NEVER invent business logic outside `/specs`
- ALL models, flows, events come from `/specs`
- If something is missing, infer ONLY from existing specs

---

## Rule 2 — No Backend

- Do NOT create backend (no Nest, no Express)
- Use in-memory mock services only
- Event bus must be local (in-memory)

---

## Rule 3 — SDD First Architecture

You must:

- Read `/specs/schemas`
- Read `/specs/contracts`
- Read `/specs/flows`
- Read `/specs/events`

Then generate implementation.

---

## Rule 4 — Output must be runnable

After execution:

- `npm install`
- `npm run dev`

Must work immediately.

---

# 🧱 STEP-BY-STEP EXECUTION PLAN

You must execute in this exact order:

---

## 1. Initialize Next.js project

Inside current folder:

- create Next.js app
- use App Router
- enable TypeScript
- enable Tailwind CSS
- enable ESLint

---

## 2. Install dependencies

Install:

- zod
- (optional later: zustand)

---

## 3. Create project structure

Follow:

/specs/project/bootstrap-architecture.md

Create:

- src/modules/accounting
- src/shared
- src/lib
- components
- styles

---

## 4. Parse SDD Specs

Read and map:

### Schemas → TypeScript types + Zod
- /specs/schemas

### Contracts → Service interfaces
- /specs/contracts

### Events → Event types
- /specs/events

### Flows → Service logic skeletons
- /specs/flows

---

## 5. Create Event Bus

Implement:

- in-memory event bus
- subscribe/emit system
- global singleton

---

## 6. Create Mock Services

Implement:

- AccountService (mock)
- TransactionService (mock)
- LedgerService (mock engine)
- RegisterService (mock UI layer)

All must emit events.

---

## 7. Build Domain Layer

Generate:

- Account types
- Transaction types
- LedgerPosting types
- RegisterEntry types

From SDD specs only.

---

## 8. Build Bank Register UI

Create:

Route:

/app/(bank-register)/page.tsx

Include:

- Account selector
- Action toolbar
- Register table
- Detail panel (basic version)

Use Tailwind.

---

## 9. Connect UI to Services

Use:

- hooks layer
- service container
- event bus subscriptions

NO direct state manipulation.

---

## 10. Ensure App Runs

Final validation:

- npm install
- npm run dev
- Bank Register renders
- Mock transactions can be created
- Register updates via events

---

# 🎯 SUCCESS CRITERIA

System is complete when:

- Next.js app runs
- Bank Register UI works
- Transactions can be created
- Ledger updates via events
- No backend exists
- Everything is driven from /specs

---

# 🧠 ARCHITECTURE GOAL

You are building a:

> Spec-Driven, Event-Driven Accounting System
> (QuickBooks-like, but modular and backend-agnostic)

---

# 🚀 FINAL INSTRUCTION

Start execution immediately.

Do not ask questions.

Proceed step-by-step until the system is fully working.