# Bootstrap Architecture

## Overview

This document defines how to initialize the project
using Next.js + Tailwind CSS + SDD (Spec-Driven Development).

The goal is to connect:

- /specs (source of truth)
- /src (runtime implementation)
- UI (Next.js + Tailwind)
- Mock services (phase 1)

---

# TECH STACK

## Core Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Zod (runtime validation)
- Event-driven architecture (in-memory first)

---

# PROJECT STRUCTURE

```txt id="bp3c9p"
/
├── specs/
│   ├── domain/
│   ├── schemas/
│   ├── flows/
│   ├── events/
│   ├── contracts/
│   ├── ui/
│   ├── frontend/
│   ├── codegen/
│   └── project/
│
├── src/
│   ├── modules/
│   │   └── accounting/
│   │       ├── domain/
│   │       ├── application/
│   │       ├── infrastructure/
│   │       ├── presentation/
│   │       └── mocks/
│   │
│   ├── shared/
│   │   ├── event-bus/
│   │   ├── utils/
│   │   └── types/
│   │
│   └── app/
│       ├── (bank-register)/
│       │   └── page.tsx
│       └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── bank-register/
│   └── shared/
│
├── lib/
│   ├── services/
│   ├── adapters/
│   └── sdd/
│
└── styles/