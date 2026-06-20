# Frontend Data Layer Design

## Overview

This document defines how the Next.js application interacts with the Ledger System contracts.

The goal is to enable:

- backend-agnostic development
- full UI implementation before backend exists
- mock-driven development
- seamless future backend replacement

---

# Core Principle

## UI Never Talks to Backend Directly

The UI only interacts with:

- service adapters
- domain contracts
- event stream layer

Never:

- REST endpoints directly
- database logic
- infrastructure code

---

# Architecture Overview

The frontend data layer is composed of:

## 1. Service Adapter Layer

Implements contracts from:

- AccountService
- TransactionService
- LedgerService
- RegisterService

Can be:

- mock implementation (current phase)
- API implementation (future)
- event-driven implementation (future advanced)

---

## 2. Domain Store Layer

Manages:

- accounts state
- transactions state
- ledger state
- register state

Acts as in-memory cache + UI state bridge.

---

## 3. Event Subscription Layer

Consumes domain events:

- TransactionPosted
- TransactionVoided
- LedgerPostingCreated
- AccountBalanceUpdated

Updates UI reactively.

---

## 4. UI Hooks Layer (React API)

Provides hooks for components:

- useAccounts()
- useTransactions()
- useLedger()
- useRegister()

---

# SERVICE ADAPTER LAYER

## Purpose

Abstracts all service logic behind contracts.

---

## Interface Pattern

All services are injected via provider:

```ts id="ad1"
type ServiceContainer = {
  accountService: AccountService;
  transactionService: TransactionService;
  ledgerService: LedgerService;
  registerService: RegisterService;
};