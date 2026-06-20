# Create Transfer Flow

## Goal

Move funds between two accounts.

---

# Steps

1. User selects source account
2. User selects destination account
3. User enters amount
4. System validates:
   - accounts are different
   - source account has sufficient balance
5. System creates transaction
6. System creates double ledger postings
7. System creates register entries for both accounts
8. Balances are recalculated

---

# Ledger Behavior

Debit:
- Destination Account

Credit:
- Source Account

---

# Result

- Source balance decreases
- Destination balance increases
- Both registers reflect transaction