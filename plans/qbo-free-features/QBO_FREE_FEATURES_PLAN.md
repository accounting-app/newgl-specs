# QBO free-tier features → All Apps

**Status: Phase 1 planning.** Scoped from screenshots of QuickBooks Online's own "All Apps" flyout (`qbo.intuit.com/app/banking`). Diamond-icon (premium/paid) items are out of scope everywhere below.

## What QBO's All Apps menu actually contains

Transcribed from the screenshots, free items only (💎 = premium, excluded):

| Category | Free items | Premium (excluded) |
|---|---|---|
| **Accounting** | Bank transactions, Receipts, Reconcile, Chart of accounts | Integration transactions, Rules, My accountant, Intuit Experts, Fixed assets |
| **Expenses & Bills** | Overview, Expense transactions, Vendors, Bills, Mileage, Contractors, 1099s | Bill payments |
| **Sales & Get Paid** | Overview, Sales transactions, Invoices, QuickBooks payouts, Products & services | Payment links, Sales channels |
| **Customer Hub** | Overview, Customers, Estimates | *(none)* |
| **Team** | Employees, Contractors, Workers' comp | *(none, but see note below)* |
| **Business Tax** | *(all 3 items)* | *(none, but see note below)* |
| **Lending** | *(all 5 items)* | *(none, but see note below)* |
| Marketing / Payroll / Time / Inventory / Projects / Sales Tax | *(entire category is premium)* | entire category |

## Decisions made with the user before writing this plan

1. **Lending and Business Tax: skipped, not just deferred-with-a-plan.** Both are QBO's own regulated financial products (real loan origination, real tax e-filing) needing banking/tax licensing this app doesn't have and isn't trying to get. Not building UI-only stand-ins either. Tracked as a backlog note only -- see "Explicitly out of scope" below.
2. **Phased, not all-at-once.** Phase 1 (this plan) covers **Accounting** + **Expenses & Bills** -- both extend the app's existing accounting domain. **Sales & Get Paid**, **Customer Hub**, and **Team** are named as Phase 2/3 but not designed yet.
3. **Accounting ▸ Bank transactions and Reconcile already exist** (the Register page, its reconcile-status cycling, and the CSV import flow) and should be left as-is, not rebuilt -- Accounting's job in this plan is to add the two genuinely new items (Receipts, plus a Chart of Accounts link) and route "Bank transactions"/"Reconcile" into what's already there.

## Phase 1 scope

### Accounting ▸

| QBO item | Plan |
|---|---|
| Bank transactions | Route to the existing `/register` page. No new screen. |
| Reconcile | Already covered by Register's per-transaction reconcile-status cell (`ReconcileStatusCell`, cycles uncleared → cleared → reconciled). No new screen. |
| Chart of accounts | Already exists at `/all-apps/chart-of-accounts`. Just needs the nav entry pointed at it (it already is, per `ALL_APPS_CATEGORIES` in `apps.ts`). |
| **Receipts** | **New.** The only genuinely new item in this category -- see below. |

**Receipts**, new: upload a receipt image/PDF against a transaction (existing or new), for recordkeeping. Needs:
- A place to store the file. `newgl-api` has no blob storage today -- Supabase Storage is the natural fit (already the auth/DB provider), a new `receipts` bucket, one row per receipt in Postgres (`receipts` table: `id`, `ledger_id` FK, `transaction_id` nullable FK -- a receipt can be uploaded before it's matched to a transaction, `storage_path`, `original_filename`, `uploaded_at`).
- **Open question for you:** should Receipts require OCR/auto-matching to a transaction (QBO does this), or is a manual "upload, then optionally link to a transaction" flow enough for v1? Auto-matching is a real AI/OCR feature, not a quick add.

### Expenses & Bills ▸

This is the phase's real work -- five new concepts, none of which exist today. Beancount itself has no "Vendor" or "Bill" primitive, so these live as Postgres-only directory/workflow data alongside the ledger (same pattern as `bank_rules` and `ledger_files`), and a Bill becomes a **real beancount transaction** once it's paid -- not a shadow accounting system running next to the real one.

| QBO item | Plan |
|---|---|
| Overview | A dashboard-style landing page for this section (open bills total, recent vendor activity) -- same spirit as `dashboard-metrics.tsx` but scoped to this domain. |
| Expense transactions | Likely **reuse Register**, filtered to expense-category postings, rather than a new transaction list -- needs confirming once Vendors exist (an "expense transaction" in QBO carries a vendor; ours would too, via a new optional `vendor_id` on postings/transactions). |
| **Vendors** | New directory: `vendors` table (`id`, `ledger_id`, `name`, `email`, `phone`, `default_expense_account_id`, `is_1099_contractor` bool, `status`). List + create/edit page, mirroring `chart-of-accounts-page.tsx`'s structure. |
| **Bills** | New: `bills` table (`id`, `ledger_id`, `vendor_id`, `bill_number`, `bill_date`, `due_date`, `line_items` jsonb or a `bill_line_items` table, `status`: draft/open/paid, `posted_transaction_id` nullable -- set once paid). Paying a bill posts a real transaction (debit the expense/AP account, credit cash) via the existing `transaction-service.ts`, then stamps `posted_transaction_id`. |
| **Mileage** | New: `mileage_entries` table (`id`, `ledger_id`, `date`, `miles`, `rate_cents_per_mile`, `purpose`, `vendor_id` nullable). Simpler than Bills -- no beancount posting required unless the user wants mileage reimbursement to hit the ledger, which is a v2 question. |
| **Contractors** | Likely **a filtered view of Vendors** (`is_1099_contractor = true`) rather than a separate entity -- QBO treats contractors as a Team-adjacent concept, but without payroll, a contractor here is really "a vendor you might owe a 1099 to." |
| **1099s** | A report over `vendors WHERE is_1099_contractor` + their paid-bill totals for the tax year, no filing (no e-file capability -- that's Business Tax territory, out of scope). Read-only summary + CSV export, matching the existing report-export patterns in `reports/`. |

## Explicitly out of scope (backlog, not designed)

- **Lending** (Term loan, Line of credit, Credit cards, QuickBooks Checking) -- QBO's own embedded-finance product. No plan; revisit only if there's ever a real path to actual lending infrastructure or a partner integration.
- **Business Tax** (Tax summary, Year-end filing) -- real tax e-filing needs tax-prep licensing/integration (e.g. a provider like Column Tax or Track1099 for the 1099 side specifically, which is more tractable than full e-filing). Revisit if/when a filing provider integration is actually planned.
- **Marketing, Payroll, Time, Inventory, Projects, Sales Tax** -- entirely premium in QBO itself, so out of scope by the "free only" rule, not a separate decision.

## Phase 2/3 (named only, not designed yet)

- **Sales & Get Paid** ▸ Overview, Sales transactions, Invoices, QuickBooks payouts, Products & services -- a full new AR/invoicing domain (Customers, Invoices, Products & Services catalog), the mirror image of Phase 1's Vendors/Bills AP domain.
- **Customer Hub** ▸ Overview, Customers, Estimates -- the Customers entity is shared with Sales & Get Paid; Estimates is invoicing-adjacent.
- **Team** ▸ Employees, Contractors, Workers' comp -- without Payroll (premium, out of scope), "Employees" here would be limited to a roster/directory, not paychecks. Needs its own scoping conversation before a plan is written -- unclear what "Employees" means without payroll behind it.

## Open questions before Phase 1 implementation starts

1. Receipts: manual link-to-transaction only, or OCR/auto-match (see above)?
2. Do you have QBO screenshots of the actual **Vendors list**, **Bill entry form**, **Mileage entry**, and **1099s summary** screens? The flyout menu alone tells us the section exists, not its field layout -- want to match QBO's fields/layout closely, or design our own simpler version of each?
3. `newgl-api`'s Postgres schema additions (`receipts`, `vendors`, `bills`, `bill_line_items`, `mileage_entries`) -- confirm before migrations are written, since `vendor_id` also means threading a new optional field through the existing `transactions`/`postings` schema.

## Critical files (once implementation starts)

- `quickslike/src/constants/apps.ts` -- `ALL_APPS_CATEGORIES`, needs an `expenses-bills` category added alongside the existing `accounting` one.
- `newgl-api/src/domain/models.ts`, `src/http/routes/`, `src/application/services/` -- new Vendor/Bill/Mileage/Receipt domain types, routes, services, following the existing `bank-rules.ts`/`account-service.ts` pattern.
- `newgl-api/supabase/migrations/` -- new tables.
- New `quickslike/src/components/settings/` (or a new `expenses-bills/` component dir) for Vendors/Bills/Mileage/1099s pages, following `chart-of-accounts-page.tsx`'s structure as the closest existing template.
