# Ledger Events Domain

## Overview

This document defines the domain events emitted by the Ledger System.

Events represent facts that have already happened in the system.

They are immutable and serve as the backbone for:

- UI updates (Next.js)
- future backend processing
- audit logs
- integrations
- reporting systems

---

# Core Principle

## Event Immutability Rule

Once an event is emitted:

- it cannot be changed
- it cannot be deleted
- it is append-only

---

# Event Categories

The system defines three main categories:

## 1. Transaction Events

Events related to business transactions.

## 2. Ledger Events

Events related to accounting postings.

## 3. Account Events

Events related to chart of accounts and balances.

---

# TRANSACTION EVENTS

## TransactionCreated

Emitted when a transaction is created in DRAFT state.

```json
{
  "eventType": "TransactionCreated",
  "transactionId": "uuid",
  "transactionType": "EXPENSE",
  "status": "DRAFT",
  "createdAt": "timestamp"
}