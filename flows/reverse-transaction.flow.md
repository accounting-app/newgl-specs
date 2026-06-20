# Reverse Transaction Flow

## Overview

This flow defines how a posted transaction is reversed.

Reversal does NOT delete or modify existing ledger data.

Instead, it creates a new compensating transaction
that negates the original financial impact.

---

# Core Principle

## No Deletion Rule

In accounting systems:

- NOTHING is deleted
- EVERYTHING is reversed or voided

---

# Actors

- User (UI)
- Transaction Service
- Ledger Engine
- Account System

---

# Preconditions

A transaction can only be reversed if:

- status = POSTED
- transaction is not already reversed
- transaction exists in ledger
- postings are finalized

---

# Flow Steps

## 1. User initiates reversal

From UI:

- Bank Register
- Transaction Detail View

User selects:

→ "Reverse Transaction"

---

## 2. System loads original transaction

Validate:

- exists
- is POSTED
- not VOIDED
- not already reversed

---

## 3. System creates Reverse Transaction

System generates a NEW transaction:

- type = REVERSAL
- status = POSTED (immediately after validation)
- referenceOriginalTransactionId = original.id

---

## 4. Generate reversing postings

For each original LedgerPosting:

System creates inverse entries:

### Rule

| Original | Reversal |
|----------|----------|
| DEBIT    | CREDIT   |
| CREDIT   | DEBIT    |

---

## Example

Original Transaction:

Expense $100

- DEBIT Expense 100
- CREDIT Bank 100

---

Reversal Transaction:

- DEBIT Bank 100
- CREDIT Expense 100

---

## 5. Ledger write

System writes reversal postings to Ledger:

- immutable entries
- linked to original transaction
- same fiscal period unless overridden

---

## 6. Account balance update

System recalculates:

- current balances
- register running balances
- financial statements impact

---

## 7. Register entry creation

A new RegisterEntry is created:

- type = REVERSAL
- linked to original entry
- displays negative impact

---

## 8. Event emission

System emits:

- TransactionReversed
- LedgerReversalCreated
- AccountBalanceUpdated

---

# Post Conditions

After reversal:

- Original transaction remains intact
- Reversal transaction exists in ledger
- Net financial impact = 0 (for reversed portion)
- Audit trail preserved

---

# Business Rules

## Rule 1: Immutability

Original transaction MUST NOT be modified.

---

## Rule 2: Full Reversal Only

Partial reversal is not allowed in this version.

Future versions may support partial reversals.

---

## Rule 3: Traceability

Reversal MUST reference:

- originalTransactionId
- originalLedgerPostings

---

## Rule 4: Ledger Integrity

After reversal:

SUM(original + reversal) = 0 impact

---

## Rule 5: Account Consistency

Reversal respects:

- account normal balance rules
- debit/credit inversion logic

---

# Failure Rules

If reversal fails:

- NO ledger postings are created
- NO account updates occur
- system remains unchanged

---

# Audit Requirements

System must store:

- reversedBy
- reversedAt
- reason (optional)
- original transaction snapshot
- reversal transaction snapshot

---

# UI Behavior (Next.js)

After reversal:

- original transaction appears "Reversed"
- reversal entry is shown in register
- both entries remain visible
- balances update immediately

---

# System Guarantee

Reversal is:

- deterministic
- irreversible (cannot undo reversal)
- fully auditable
- ledger-safe