# Ledger Services Contract

## Overview

This document defines the service interfaces for the Ledger System.

These contracts are:

- backend-agnostic
- UI-friendly (Next.js ready)
- implementation-independent
- future-proof for REST / GraphQL / event-driven systems

They define HOW the system behaves, not WHERE it runs.

---

# Core Principle

## Contract Over Implementation

The UI must depend only on contracts.

Not on:

- REST endpoints
- database structure
- infrastructure
- backend framework

---

# SERVICE LAYER ARCHITECTURE

The system is composed of four core services:

---

## 1. AccountService

Manages Chart of Accounts.

### Responsibilities

- create account
- update account
- close account
- fetch accounts
- fetch account hierarchy

---

### Interface

```ts id="acc1"
interface AccountService {
  createAccount(input: CreateAccountInput): Promise<Account>;

  updateAccount(id: string, input: UpdateAccountInput): Promise<Account>;

  closeAccount(id: string): Promise<void>;

  getAccountById(id: string): Promise<Account>;

  listAccounts(): Promise<Account[]>;

  getAccountHierarchy(): Promise<AccountHierarchy>;
}