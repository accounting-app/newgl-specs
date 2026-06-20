# Ledger Engine Domain

## Overview

The Ledger Engine is the core accounting system responsible for:

- transforming Transactions into Ledger Postings
- maintaining account balances
- ensuring double-entry integrity
- enforcing accounting rules
- providing auditability and immutability

The Ledger is the single source of truth for all financial data.

---

# Core Principle

## Double Entry Accounting

Every financial transaction MUST satisfy:

- Total Debits = Total Credits

If this rule is violated, the transaction is INVALID.

---

# Ledger Architecture

The system is composed of:

## 1. Transaction Layer

High-level business operations:

- Deposit
- Expense
- Transfer
- Refund
- Bill Payment

Transactions are NOT accounting truth.

---

## 2. Posting Layer (Ledger Layer)

Transactions are converted into:

- LedgerPostings

This is the accounting truth.

---

## 3. Account Layer

Postings impact:

- Chart of Accounts
- Account balances
- Financial statements

---

# Ledger Flow

## Step 1: Create Transaction

User creates a transaction (draft state)

Example:

- Expense $100
- Transfer $500
- Deposit $200

---

## Step 2: Validate Transaction

System checks:

- required fields
- valid accounts
- sufficient balance (if required)
- accounting rules

---

## Step 3: Generate Ledger Postings

Transaction is transformed into postings:

Example (Expense):

- DEBIT Expense Account 100
- CREDIT Bank Account 100

---

## Step 4: Validate Double Entry

System ensures:

- sum(debits) == sum(credits)

If not:
- reject transaction

---

## Step 5: Post to Ledger

Once valid:

- postings are written to Ledger
- transaction status = POSTED

---

## Step 6: Update Account Balances

System recalculates:

- currentBalance
- availableBalance
- running balances (register view)

---

# Posting Rules

## Rule 1: Immutability

Once a posting is POSTED:

- it cannot be modified
- only reversed or voided

---

## Rule 2: Append-only Ledger

Ledger is immutable.

Any correction requires:

- reversal transaction
OR
- compensating entry

---

## Rule 3: Ordering

Postings must be ordered by:

1. postingDate
2. createdAt
3. transactionId

---

## Rule 4: Account Impact

Each posting affects one account:

- DEBIT increases asset/expense accounts
- CREDIT increases liability/equity/revenue accounts

---

## Rule 5: Transaction Atomicity

A transaction must:

- either fully post
- or not post at all

No partial postings allowed.

---

# Balance Calculation Engine

## Formula (per account type)

### Asset / Expense (Debit-normal)

Balance =
Debits - Credits

---

### Liability / Equity / Revenue (Credit-normal)

Balance =
Credits - Debits

---

# Register Integration

The Ledger Engine feeds:

- Bank Register UI
- Running balance calculations
- Transaction history

Register entries are derived from postings.

---

# Reversal System

## Reversal Transaction

A reversal creates opposite postings:

Original:
- DEBIT 100
- CREDIT 100

Reversal:
- CREDIT 100
- DEBIT 100

---

## Rules

- Reversals never delete original data
- Reversals create new postings
- Audit trail is preserved

---

# Fiscal Period Engine

Each posting belongs to:

- fiscal month
- fiscal year

Used for:

- closing books
- reporting
- tax calculations

---

# Reconciliation Engine

Future capability:

- match postings to bank statements
- mark reconciled entries
- detect discrepancies

---

# Audit Requirements

System must track:

- who posted
- when posted
- source transaction
- reversal history
- balance snapshots

---

# System Guarantees

The Ledger Engine guarantees:

- financial accuracy
- immutability
- auditability
- consistency
- deterministic balances

---

# Future Enhancements

- real-time balance streaming
- multi-currency ledger
- AI anomaly detection
- automatic categorization
- bank feed synchronization