# Void Transaction Flow

## Overview

This flow defines how a transaction is voided in the system.

Voiding is used to invalidate a transaction while preserving full audit history.

Unlike reversal, voiding does not necessarily create compensating financial effects depending on posting state.

---

# Core Principle

## Audit Preservation Rule

Void NEVER deletes data.

Void ALWAYS preserves history.

---

# Actors

- User (UI)
- Transaction Service
- Ledger Engine
- Audit System

---

# Preconditions

A transaction can be voided if:

- transaction exists
- transaction is not already voided
- transaction is not deleted
- user has permission
- transaction is either:
  - POSTED OR
  - DRAFT

---

# Flow Types

There are TWO void strategies depending on state:

---

## 1. VOID DRAFT TRANSACTION

Used when transaction is NOT posted yet.

### Behavior:

- No ledger impact exists
- No postings exist

### Steps:

1. User selects "Void"
2. System marks transaction as VOIDED
3. Status updated immediately
4. No ledger changes required

---

## 2. VOID POSTED TRANSACTION

Used when transaction already affected ledger.

### Behavior:

- Requires compensating entries
- Must preserve ledger integrity

---

# Flow Steps (POSTED VOID)

## 1. User initiates void

From UI:

- Bank Register
- Transaction Detail

User selects:

→ "Void Transaction"

---

## 2. System loads transaction

Validate:

- exists
- status = POSTED
- not already reversed
- not already voided

---

## 3. System decides void strategy

If POSTED:

→ requires ledger compensation

---

## 4. Create Void Transaction

System creates new transaction:

- type = VOID
- status = POSTED
- referenceOriginalTransactionId = original.id

---

## 5. Generate compensating postings

System creates inverse ledger entries:

### Rule

| Original Posting | Void Posting |
|------------------|--------------|
| DEBIT            | CREDIT       |
| CREDIT           | DEBIT        |

---

## 6. Ledger write

System writes void postings:

- immutable entries
- linked to original transaction
- marked as VOID reversal type

---

## 7. Account balance update

System recalculates:

- current balances
- register running balance
- financial reports

---

## 8. Register entry creation

A VOID register entry is created:

- type = VOID
- linked to original entry
- displayed as cancellation event

---

## 9. Event emission

System emits:

- TransactionVoided
- LedgerVoidCreated
- AccountBalanceUpdated

---

# Post Conditions

After void:

- transaction is marked VOIDED
- ledger impact is neutralized (if posted)
- audit trail preserved
- original transaction remains unchanged

---

# Business Rules

## Rule 1: Immutability

Original transaction MUST NOT be modified.

---

## Rule 2: Void vs Reverse Distinction

| Action | Purpose |
|--------|--------|
| VOID | Cancel transaction |
| REVERSE | Correct financial impact |

---

## Rule 3: Void is permanent

A voided transaction:

- cannot be un-voided
- must be corrected with new transaction

---

## Rule 4: Ledger Integrity

Void must preserve:

SUM(original + void) = 0 impact

---

## Rule 5: Partial Void Not Allowed

This version does not support partial voids.

---

# Failure Rules

If void fails:

- NO ledger changes
- NO status updates
- system remains unchanged

---

# Audit Requirements

System must store:

- voidedBy
- voidedAt
- voidReason (optional)
- original transaction snapshot
- void transaction snapshot

---

# UI Behavior (Next.js)

After void:

- transaction appears as VOIDED
- register entry is marked as cancelled
- balances are recalculated
- transaction remains visible for audit

---

# System Guarantee

Void is:

- immutable
- auditable
- deterministic
- ledger-safe