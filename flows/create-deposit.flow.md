# Create Deposit Flow

## Goal

Increase the balance of a selected account
by recording an incoming deposit transaction.

---

# Actors

- User
- Ledger Engine
- Account Service

---

# Steps

1. User selects account
2. User clicks "Deposit"
3. User enters:
   - amount
   - date
   - payee
   - memo
4. System validates:
   - account is active
   - amount > 0
5. System creates transaction
6. System creates ledger postings
7. System updates account balance
8. System creates register entry
9. Transaction status becomes POSTED

---

# Ledger Behavior

Debit:
- Bank Account

Credit:
- Source Income / Equity Account

---

# Result

- Account balance increases
- Register entry becomes visible
- Audit trail is persisted