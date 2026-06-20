# Post Transaction Flow

## Overview

This flow defines how a Transaction is posted into the Ledger Engine.

Posting is the process of converting a business transaction into immutable Ledger Postings.

Once posted, the transaction becomes part of the accounting truth.

---

# Actors

- User (via UI)
- Transaction Service
- Ledger Engine
- Account System

---

# Preconditions

- Transaction must exist
- Transaction must be in DRAFT state
- All required fields must be valid
- Accounts must be ACTIVE

---

# Flow Steps

## 1. User initiates "Post Transaction"

From UI (Next.js Bank Register or Transaction screen)

---

## 2. System loads transaction

Validate:

- transaction exists
- status = DRAFT

---

## 3. Validation Phase

System checks:

### Accounting Rules

- Must have at least 2 postings
- Debits must equal Credits
- All accounts exist
- No CLOSED accounts used

---

## 4. Ledger Generation

System transforms Transaction → LedgerPostings

Example:

Expense $100

→

- DEBIT Expense Account 100
- CREDIT Bank Account 100

---

## 5. Ledger Write

System writes postings to Ledger:

- create LedgerPosting records
- assign postingDate
- assign fiscalPeriod

---

## 6. Account Balance Update

System recalculates:

- currentBalance
- availableBalance
- register running balance

---

## 7. Register Entry Creation

System generates RegisterEntry:

- date
- memo
- payment/deposit
- running balance

---

## 8. Transaction Status Update

Transaction becomes:

POSTED

---

## 9. Event Emission

System emits:

- TransactionPosted
- LedgerPostingsCreated
- AccountBalanceUpdated

---

# Post Conditions

- Ledger is updated
- Transaction is immutable
- Account balances are updated
- Register UI reflects changes

---

# Failure Rules

If any step fails:

- entire transaction is rejected
- no partial ledger writes allowed

---

# System Guarantee

This process is:

- atomic
- deterministic
- replayable
- audit-safe