# Chart of Accounts Domain

## Overview

The Chart of Accounts (COA) defines the complete
financial account structure used by the accounting system.

Every financial transaction must impact one or more accounts
from the chart of accounts.

The COA determines:

- account classification
- balance behavior
- reporting behavior
- financial statement grouping
- debit and credit rules

---

# Core Accounting Types

The accounting system supports five primary account types.

## Asset

Represents resources owned by the business.

Examples:

- Cash
- Bank Accounts
- Accounts Receivable
- Equipment
- Vehicles

Normal balance:
DEBIT

---

## Liability

Represents money owed by the business.

Examples:

- Credit Cards
- Loans
- Accounts Payable
- Mortgages

Normal balance:
CREDIT

---

## Equity

Represents owner equity and retained earnings.

Examples:

- Owner Investment
- Owner Draw
- Retained Earnings

Normal balance:
CREDIT

---

## Revenue

Represents income earned by the business.

Examples:

- Sales
- Service Income
- Interest Income

Normal balance:
CREDIT

---

## Expense

Represents operational costs.

Examples:

- Rent
- Payroll
- Utilities
- Software

Normal balance:
DEBIT

---

# Account Structure

Each account contains:

- account type
- account subtype
- normal balance
- parent account
- reporting group
- account number
- status

---

# Parent / Child Accounts

Accounts may optionally belong to a parent account.

Example:

Assets
└── Bank Accounts
    ├── Chase Checking
    ├── Savings Account

Parent accounts aggregate balances
from child accounts.

---

# Normal Balance

Each account type defines a normal balance side.

| Account Type | Normal Balance |
|---------------|----------------|
| Asset | Debit |
| Liability | Credit |
| Equity | Credit |
| Revenue | Credit |
| Expense | Debit |

---

# Balance Calculation Rules

## Debit Normal Accounts

Balance Formula:

Debits - Credits

Examples:

- Assets
- Expenses

---

## Credit Normal Accounts

Balance Formula:

Credits - Debits

Examples:

- Liabilities
- Equity
- Revenue

---

# Reporting Groups

Accounts may belong to reporting groups.

Examples:

- Current Assets
- Fixed Assets
- Current Liabilities
- Operating Expenses
- Other Income

---

# Account Status

Supported statuses:

- ACTIVE
- ARCHIVED
- CLOSED

Closed accounts cannot receive postings.

---

# System Accounts

Some accounts are system protected.

Examples:

- Retained Earnings
- Undeposited Funds
- Opening Balance Equity

System accounts may restrict edits or deletion.

---

# Multi Currency

Future versions may support:

- account base currency
- exchange rates
- foreign balance tracking

---

# Fiscal Behavior

Accounts participate in:

- fiscal year closing
- retained earnings rollups
- period reporting
- reconciliation

---

# Audit Requirements

The system must preserve:

- account creation history
- balance history
- posting history
- hierarchy changes