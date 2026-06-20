# TypeScript Generation Strategy

## Overview

This document defines how the SDD (Spec-Driven Development) system
is transformed into production-ready TypeScript code.

The goal is to ensure:

- single source of truth = /specs
- zero manual duplication of types
- deterministic code generation
- backend-agnostic implementation

---

# Core Principle

## Specs Are the Source of Truth

Everything in the system derives from:

- /specs/schemas
- /specs/domain
- /specs/flows
- /specs/events
- /specs/contracts

NO type should be manually duplicated in code.

---

# GENERATION PIPELINE

## Step 1: YAML → Type Definitions

Schemas become TypeScript interfaces.

Example:

```yaml
accountType:
  type: string
  enum: [ASSET, LIABILITY]