# Accounting Rules

## Double Entry Accounting

Every transaction must contain:

- at least one debit
- at least one credit

Total debits MUST equal total credits.

---

# Immutable Posting Rule

Posted transactions cannot be edited directly.

Edits require:

- reversal transaction
OR
- void + replacement

---

# Soft Delete Rule

Transactions are never physically deleted.

Deleted records remain in audit history.

---

# Balance Integrity Rule

Account balances must always equal:

SUM(debits) - SUM(credits)

depending on account type behavior.

---

# Transfer Rules

Transfers require:

- source account
- destination account

Transfers cannot use the same account twice.

---

# Register Integrity Rule

Running balances are calculated sequentially
based on transaction posting order.

---

# Audit Rules

System must track:

- createdAt
- updatedAt
- postedAt
- voidedAt
- deletedAt
- createdBy

---

# Transaction State Rules

Allowed states:

- DRAFT
- POSTED
- VOIDED
- DELETED

Only DRAFT transactions are editable.

---

# Currency Rules

All postings inside one transaction
must use the same currency.

Future versions may support multi-currency.

---

# Reconciliation Rules

Future versions may support:

- bank reconciliation
- statement matching
- imported bank feeds