# Ledger Data Workflow — OpenLedger

> **Purpose**: Guide for managing the `.bean` ledger files during development.
> The `.bean` file IS the database — this is the equivalent of `dev-database-workflow.md` in other GSX projects.

---

## Understanding the Ledger File

In OpenLedger, there is **no external database**. The `.bean` (Beancount) file is the single source of truth (SPEC C1). Everything else — the in-memory DAG, the read model indices, the transaction hashes — is a **deterministic projection** of this file.

```
data/ledger.bean  ← This IS the database
```

---

## File Location

| Environment | Path |
|-------------|------|
| **Host dev** (`bun run dev`) | `./data/ledger.bean` |
| **Docker** (`docker compose up`) | `/app/data/ledger.bean` (inside `ledger_data` volume) |

---

## Common Operations

### Inspect the Ledger

```bash
# View the raw .bean file
cat data/ledger.bean

# Count transactions
grep -c "^[0-9].*\*" data/ledger.bean

# Check file size
ls -la data/ledger.bean
```

### Reset the Ledger (Clean Start)

```bash
# Host dev — just delete the file
rm -f data/ledger.bean

# Docker — wipe the volume
docker compose down -v
docker compose up -d --build
```

### Backup the Ledger

```bash
# Simple file copy
cp data/ledger.bean data/ledger.bean.backup-$(date +%Y%m%d)
```

### Seed with Test Data

For development, you can create a starter `.bean` file:

```beancount
;; OpenLedger — Development Seed Data
;; Created: 2026-06-27

option "title" "Development Ledger"
option "operating_currency" "USD"

2026-01-01 open Assets:Checking        USD
2026-01-01 open Assets:Savings         USD
2026-01-01 open Liabilities:CreditCard USD
2026-01-01 open Equity:Opening         USD
2026-01-01 open Income:Salary          USD
2026-01-01 open Expenses:Rent          USD
2026-01-01 open Expenses:Food          USD
2026-01-01 open Expenses:Office        USD

2026-01-01 * "Opening Balance"
  Assets:Checking      5000.00 USD
  Equity:Opening      -5000.00 USD

2026-01-15 * "Employer" "January Salary"
  Assets:Checking      8000.00 USD
  Income:Salary       -8000.00 USD

2026-01-20 * "Landlord" "January Rent"
  Expenses:Rent        2000.00 USD
  Assets:Checking     -2000.00 USD
```

Save this to `data/ledger.bean` for testing.

---

## Key Concepts

### Append-Only (SPEC C2)

Transactions are **never mutated or deleted**. Corrections are new transactions (reversing/adjusting entries). If you "fix" a transaction by editing the file directly, the original `txid` changes — this creates a NEW transaction, not a fix.

### External Edits (SPEC §3.3)

If `gl-node.config.json` has `"externalFileEdits": "enabled"` (the default):
- Hand-editing the `.bean` file is detected and merged like peer gossip
- **Adding** a transaction by hand → works as expected
- **Editing** a transaction → creates a new one (original is kept)
- **Deleting** a line → the transaction still exists in the DAG on peers

### Round-Trip Stability (SPEC I7)

The canonical serializer guarantees: `parse(serialize(transactions)) === transactions` and the output is byte-identical. This means the `.bean` file will be auto-formatted by the serializer.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `.bean` file won't parse | Syntax error in hand-edited content | Check Beancount syntax, ensure postings balance |
| Server refuses to start | `externalFileEdits: "disabled"` + unexpected file change | Delete `data/ledger.bean` or set to `"enabled"` |
| Data persists after restart | Docker volume not wiped | Use `docker compose down -v` |
| Data lost after restart | Host dev without Docker volume | Data is in `./data/` — check file exists |
