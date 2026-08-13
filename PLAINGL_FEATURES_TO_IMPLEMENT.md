# Features to Implement, Based on PlainGL

**Source:** `PLAINGL_NEWGL_FEATURE_COMPARISON.md` (the audit) — this document turns that audit's "Not Implemented" list into an actual build plan, with concrete detail pulled from PlainGL's own source (`plaingl/app/`), grouped by area, in priority order.

**Scope reminder from the audit doc, worth repeating here:** the target is PlainGL's *accounting functionality*, built in **our own QBO-inspired UI** — icon rail, register chrome, report filter bar, Settings pattern. Nothing here means porting PlainGL's look, its 8-tab shell, or its component structure. Where a description below says "like PlainGL's X," that's describing the *capability*, not the UI to copy.

**One item already done, no longer in this list:** the audit's "Multi-entity / company switcher" and "Create company" rows are marked `Not Implemented` there, but that was written before Phase A — we already shipped a company switcher and company creation (see `INSTANCE_ARCHITECTURE_PLAN.md` Phase A). Not repeated below.

**Branch:** `19-issue-plaingl_features_to_implement_dc` (quickslike, newgl-api, newgl-ai).

**Progress:** All nine original items are done -- #3 (Report compare + columnar statements), #2 (Trial Balance), #9 (Date-range export), #1 (Chart of Accounts), #8 (Dashboard metrics), #7 (Deterministic bank rules manager), #4 (P&L Detail), and #5 + #6 (Register splits + Journal Entry) last, as planned. All verified end-to-end locally (self-hosted Docker not required -- tested directly against `bunx supabase start` + the dev servers).

**Addendum (items 11-18):** after finishing the original nine, we did a second, fresh pass over every PlainGL view and server action (not just the ones the first audit focused on) to find anything still missing. Items #10-18 below are the result -- none yet built. See "Confirmed non-gaps" after #18 for what we explicitly checked and ruled out (recurring transactions, budgets, attachments, multi-currency, reconciliation UI, audit log).

**#5/#6 turned out smaller than expected:** the backend's `postings` array was already N-generic (no 2-leg cap anywhere in `newgl-api` -- confirmed by reading the schema and the double-entry validator before writing any code), so both features were pure frontend work. Known gaps left out of scope on purpose, not silently skipped: editing an existing split/multi-leg transaction's line items, and CSV import row splitting (categorizing one imported row across multiple accounts).

**#7 precedence decision (made, not left open):** AI's suggestion (and the learned-payee-memory it checks first) wins by default whenever both an AI suggestion and a deterministic rule match a CSV import row. The rule's match is never silently discarded — it's shown as a one-click "Use instead" override, and it auto-fills a row outright when AI has no suggestion for it.

**Known data-model gap surfaced while building #8:** no A/P account category exists (only A/R), and transactions have no due-date field, so A/P outstanding and any aging/overdue reporting (a real part of PlainGL's dashboard) aren't buildable without a schema change first. Not tracked as its own numbered item yet -- worth adding if this becomes a priority.

---

## 1. Chart of Accounts screen

**What PlainGL has:** `ChartView.tsx` — a tree of accounts grouped by root (Assets, Liabilities, Equity, Income, COGS, Expenses), each showing its balance. Supports adding a new account (typing a friendly name like "Chase Checking" auto-normalizes to a canonical `Assets:Bank:ChaseChecking`-style path), removing accounts, and bulk-importing a list of accounts at once. Clicking a balance opens that account's register.

**What we have:** nothing — account CRUD exists at the API layer only, reachable today just through the register's account-picker dropdowns. There's no dedicated page to see the whole chart, add an account, or import several at once.

**Why it matters:** this is one of the most basic things a bookkeeping app needs a visible page for — right now the only way to see "every account that exists" is indirectly, through dropdowns built for other purposes.

**Build notes:** new `/settings/chart-of-accounts` (or similar) page. Root-grouped tree view, add/remove actions, bulk import (reuse patterns already established in the CSV import wizard for file parsing), and a "view register" link per account. The backend account CRUD already exists — this is primarily a UI build.

---

## 2. Trial Balance report

**What PlainGL has:** `StatementView`'s `tb` mode — every account with a non-zero balance, debit/credit columns, as of a chosen date.

**What we have:** P&L and Balance Sheet reports exist (`/reports/profit-loss`, `/reports/balance-sheet`), but no Trial Balance.

**Why it matters:** Trial Balance is a standard accounting report (used to sanity-check that debits = credits across the whole ledger) that any bookkeeping tool is expected to have alongside P&L/BS.

**Build notes:** new report type using the same report-chrome/index pattern the existing two reports already use — this is the most mechanically straightforward item on this list, since the surrounding report infrastructure (index page, filter bar) already exists.

---

## 3. Report compare + columnar statements

**What PlainGL has:** on `StatementView`, two features working together: (a) **compare mode** — show a prior period (or a custom date range) side-by-side with $ and % change columns; (b) **columnar mode** — one column per sub-period (week/month/quarter) across a date range, via `getStatementsByPeriod`.

**What we have:** the UI controls for both already exist in our reports (a Compare control and a Display-columns control), but per the audit they're **URL-only** — selecting them doesn't change what's actually computed or rendered. This is un-wired UI, not a missing feature.

**Why it matters:** highest-value-per-effort item on this list — the controls are already built and visible; only the computation behind them is missing.

**Build notes:** wire the existing Compare control to fetch and render a second data column (prior period or custom range) with computed $/% deltas. Wire the existing Display-columns control to request and render one column per sub-period. Both are additive to the existing report-fetching logic, not a rewrite of it.

---

## 4. P&L Detail as a first-class report

**What PlainGL has:** `StatementView`'s `pld` mode — a full Profit & Loss broken out with an account-level filter, as its own report view.

**What we have:** section drill-down within the existing P&L report, but no dedicated "Detail" report of its own.

**Why it matters:** smaller gap than most items here — mostly about whether this is its own report or an enhancement to the existing drill interaction.

**Build notes:** could go either way — a genuinely separate report page matching PlainGL, or extending the existing P&L's drill panel to reach the same depth. Worth deciding which before starting, since it changes scope significantly.

---

## 5. Register: split transactions

**What PlainGL has:** in both the register and the bank feed, a transaction can post to *multiple* categories at once (e.g., one $100 charge split $60 to Office Supplies and $40 to Software) instead of one single offset account.

**What we have:** every register row posts to exactly one offset account — no split editor.

**Why it matters:** a very common real-world need (one payment covering multiple expense categories) that the current single-offset model can't represent at all.

**Build notes:** needs a split-line editor inline in the register row UX (add/remove split lines, running total must equal the original amount) and likely touches the CSV import review step too, since categorization there also currently assumes one account per row.

---

## 6. Multi-line Journal Entry + paste-from-Excel/CSV

**What PlainGL has:** `JournalEntryView` — an arbitrary number of debit/credit lines (not limited to two), a live running balance readout as you type, and the ability to paste a block of tab-separated (Excel) or comma-separated data directly into the form, which auto-splits into rows.

**What we have:** a `JOURNAL_ENTRY` transaction type, but limited to exactly two legs (debit/credit pair) — no arbitrary multi-line entry, no paste support.

**Why it matters:** proper double-entry bookkeeping sometimes needs more than two legs in one entry (e.g., one payment allocated across three accounts) — the two-leg limit is a real functional ceiling, not just a UX gap.

**Build notes:** a dedicated Journal Entry flow, built in our design system: dynamic line list, live balance validation (must net to zero), and a paste handler that detects tab vs. comma separation and populates rows (PlainGL's `splitPaste` logic is a reasonable reference for the parsing approach, not the UI).

---

## 7. Deterministic bank rules manager

**What PlainGL has:** `BankRulesManager` — user-defined rules with conditions on payee/memo/amount/account (text operators: contains, not-contains, equals, starts-with, regex; amount operators: greater-than, less-than, between, etc.), used to auto-categorize or auto-post matching transactions during import. Rules can be exported/imported as a set.

**What we have:** AI-suggested categorization (`POST /api/ai/categorize`) plus the learned-rules feedback loop (exact-payee-match memory) — no user-authored conditional rules.

**Why it matters:** the two approaches are complementary, not competing — AI suggestion handles the general case, but power users often want an explicit, deterministic rule ("anything from Amazon over $500 → Equipment") they can see, edit, and trust completely, independent of AI.

**Build notes:** a rules UI living **alongside** the AI suggestion flow in the import wizard, not replacing it — order of precedence (does a matching deterministic rule win over an AI suggestion, or vice versa?) needs deciding before implementation.

---

## 8. Dashboard metrics + management summary

**What PlainGL has:** two related but distinct screens. `DashboardView` — an executive summary (cash position, AR/AP, net income, comparison bar charts, recent activity, top customers), with a date-range picker (defaults to YTD). `ReportsView`'s management summary — a compact combined P&L/BS view plus A/R and A/P aging and income/expense-by-payee rollups.

**What we have:** Home is a static greeting screen with no real metrics at all.

**Why it matters:** this is the "at a glance, how is the business doing" surface — currently the app has none, so every question requires navigating into a specific report.

**Build notes:** likely lands on Home (matching PlainGL's placement) or a new dedicated Dashboard route — in our visual language (cards/widgets matching the existing Home layout style, not PlainGL's bar-chart panels). Aging and payee rollups could ship as report cards on the existing `/reports` index rather than a separate page.

---

## 9. Date-range `.bean` export (+ clipboard copy)

**What PlainGL has:** `ExportView`'s scope toggle — export the full ledger, or a specific date range — plus a "copy to clipboard" button as an alternative to downloading a file.

**What we have:** full-ledger download only (Settings → Ledger), no range scoping, no clipboard option.

**Why it matters:** smallest, most contained item on this list — a straightforward extension of an existing, working feature.

**Build notes:** add a date-range option to the existing Settings → Ledger download UI, plus a clipboard-copy button next to the existing download button. No new backend endpoint needed if the existing download endpoint can accept optional `from`/`to` query params.

---

## 10. Report columns/compare by dimension (Customer, Employee, Product/Service, Vendor)

**What surfaced this:** while building #3 (Report compare + columnar statements), we found the "Display columns by" dropdown on the P&L/Balance Sheet reports mixes two different features: true period granularities (Days/Weeks/Months/Quarter/Years — now wired up as part of #3) and dimension breakdowns (Customer/Employee/Product/Service/Vendor), which are a separate, still-unbuilt capability. Similarly, the "Compare to" dropdown's `% of Row`/`% of Column`/`% of Expense`/`% of Income` options are a different QBO-style feature (percentage of a total elsewhere in the same statement) from the prior-period comparison #3 implemented. All of these remain selectable in their dropdowns today but are no-ops — picking one just falls back to the normal single-column report, same as "none."

**What PlainGL has:** no direct equivalent found in `plaingl/app/` — this one doesn't have a PlainGL reference implementation to draw from the way the rest of this document does. It's closer to a QuickBooks Online pattern (columns broken out per customer/employee/product, or amounts shown as a percentage of a row/column/section total).

**Why it matters:** lower priority than everything else in this document — it's a "nice to have" reporting refinement, not a functional gap in core bookkeeping. Flagged here mainly so the dropdown options don't sit inert indefinitely and someone remembers why they don't do anything yet.

**Build notes:** two independent pieces of work: (a) dimension-based columnar reports — needs each posting/transaction to carry a customer, employee, product/service, or vendor tag to group by, which may not exist in the data model yet (worth checking before scoping this); (b) percentage-of-total display modes — a pure rendering change on top of whatever report is currently shown (row total, column total, total expense, or total income as the denominator), no new data needed. (b) is by far the smaller of the two.

---

## 11. Bank feed dedup / exclude memory

**What PlainGL has:** `feedSignature()` plus `getFeedSignatures`/`recordDeletedFeedRows` — every bank-feed row gets a stable signature (date/payee/amount based) checked against two persistent lists: rows already posted as transactions (so re-importing the same statement doesn't create duplicates) and rows a user explicitly excluded (so a recurring junk row, e.g. a bank fee you never want to import, doesn't keep reappearing every import).

**What we have:** none. The CSV import wizard (`ImportModal`) has no dedup detection at all — importing the same file twice creates duplicate transactions, and there's no way to permanently exclude a recurring row pattern.

**Why it matters:** a real, common annoyance — bank exports frequently overlap date ranges with a previous import (e.g. downloading "last 30 days" every week), and without dedup, re-importing means either manually diffing rows against what's already in the register or risking duplicate transactions.

**Build notes:** needs both a signature function (deterministic hash of date + payee + amount, mirroring PlainGL's `feedSignature()`) and two new persisted lists scoped to tenant/ledger — "signatures already posted" (checked automatically, computed from existing transactions, no new table needed if derivable on the fly) and "signatures explicitly excluded" (does need a small new table, since exclusion is a user decision with no other source of truth). In the review table, a row matching either list would be pre-unchecked with a "Looks like a duplicate" / "Previously excluded" note, with an explicit action to exclude a row going forward. Medium lift — new backend table + matching logic + review-table UI changes.

**Status: done.** Split exactly as anticipated: duplicate-import detection needs no persistence at all — computed client-side each time the review table builds, matching date+payee+amount against `listTransactions({sourceAccountId, status: "POSTED"})` (already an existing call, just newly used here). Exclude memory does need real storage since it's a user decision with no other source of truth, so it got its own tenant-scoped Postgres table (`excluded_feed_rows`, same pattern as `bank_rules`/`payee_rules`) plus a list/create/delete route — deliberately matched on payee+amount only, *not* date, since the whole point is catching the same recurring row (e.g. a monthly bank fee) across different statement periods, unlike duplicate detection which needs the exact date to match. Added `src/lib/accounting/feed-dedup.ts` (quickslike) with the two matching functions, wired into the CSV import review table with "Looks like a duplicate" / "Previously excluded" notes (rows pre-unchecked either way) and a per-row "Exclude" action. Verified live: imported 2 rows, re-imported the identical file and both rows correctly showed "Looks like a duplicate" pre-unchecked; excluded one row, confirmed "Previously excluded" appeared; then imported a third file with the same payee/amount but a different date and confirmed the exclusion still matched (date correctly ignored).

---

## 12. Income/expense-by-payee report

**What PlainGL has:** `ReportsView`'s management summary includes an income/expense-by-payee rollup (`byPayee()` in `lib/beancount/report.ts`) — same P&L postings, grouped by payee instead of by account.

**Status: done.** New `/reports/by-payee` tab, verified live (income/expense totals matched the ending Cash balance exactly).

**Why it matters:** confirmed this one does **not** depend on the A/R/A/P aging gap noted under Dashboard metrics (#8) — it's a pure regrouping of data we already have in full (every transaction already carries a `payee` field). A genuinely buildable report, not blocked on a schema change.

**Build notes:** a new report (or a toggle on the existing P&L: "Group by: Account | Payee") that buckets the same income/expense postings by `transaction.payee` (falling back to account name when payee is blank, same convention already used on the Home dashboard's "Top income sources" card). Small-to-medium — mostly reuses the P&L computation already built, swapping the grouping key.

---

## 13. Company creation: templates + duplicate-existing

**What PlainGL has:** `Shell.tsx`'s "New Company" flow offers three starting points — blank, a starter chart-of-accounts template (`lib/coa-templates.ts`, a few industry-shaped presets), or duplicate-an-existing-company's chart of accounts (structure only, not transactions).

**What we have:** Phase A's company creation (`POST /api/companies`, `newgl-api/src/http/routes/companies.ts`) only builds a single blank starter document (`defaultDocument()`) — no template choice, no duplicate option.

**Why it matters:** the blank-only flow is fine for a single company, but as multi-company usage grows (the whole point of Phase A), starting a second or third company from scratch with zero accounts is real friction compared to picking a template or cloning the chart you already set up.

**Build notes:** two independent pieces — (a) starter templates: a small, static set of category-account presets (data-only, no new endpoint shape, just alternate seed documents alongside `defaultDocument()`); (b) duplicate-existing: a new code path that copies another ledger's chart-of-accounts structure (not its transactions or balances) into the new company — needs a new backend action, not just new frontend UI. Medium lift, mostly backend.

---

## 14. Bank rules export / import / duplicate

**What PlainGL has:** `BankRulesManager` supports exporting the full rule set as JSON, importing a JSON rule set (e.g. from another company or a backup), and duplicating a single rule as a starting point for a similar one.

**What we have:** the Bank Rules manager built this session (Settings → Bank Rules) supports create/enable/disable/delete only — no export, import, or duplicate.

**Why it matters:** minor but genuinely useful once someone has more than a couple of rules — duplicating a rule to tweak one condition is much faster than rebuilding it, and export/import matters for anyone running multiple companies who wants the same rules everywhere (ties into #13 above).

**Build notes:** small, mostly frontend. Export = serialize the existing `GET /api/bank-rules` response to a downloadable JSON file (client-side only, no new endpoint). Import = parse a JSON file client-side and call the existing `POST /api/bank-rules` once per rule (same batching pattern already used for Chart of Accounts bulk import). Duplicate = pre-fill the "New rule" form from an existing rule's fields, a pure client-side convenience.

**Status: done.** Export serializes rules to a `PortableRule` shape (name/targetAccountId/conditions/enabled/priority only — id/createdAt/updatedAt deliberately stripped, since importing into another company or re-importing a backup should always create fresh rules rather than reuse another tenant's ids) and downloads it as `bank-rules.json`. Import accepts either that file or a bare array, validates each entry, calls `POST /api/bank-rules` per valid rule, and reports a count plus any skipped/malformed entries instead of failing the whole batch. Duplicate pre-fills the New Rule form from an existing rule. Verified live: exported the rule set, duplicated a rule and submitted it as a new rule, and re-imported a hand-crafted file containing one valid rule and one malformed entry — got "Imported 1 of 2 rules." with the malformed one correctly reported and skipped.

---

## 15. Account opening balance on creation

**What PlainGL has:** `addAccount` lets a new account be seeded with an opening balance, posted against Equity automatically.

**What we have:** newgl-api's `createAccount` accepts `openingBalance` in its schema already (`createAccountInputSchema`, `domain/models.ts`), but nothing in quickslike's Chart of Accounts "Add an account" form exposes it — new accounts always start at $0, and there's no automatic offsetting Equity entry either way.

**Why it matters:** a real onboarding gap — anyone setting up a new company with existing bank balances (the common case, not the exception) currently has to work around it with a manual journal entry per account instead of just entering the balance once at creation time.

**Build notes:** small. Add an optional "Opening balance" field to the Chart of Accounts creation form (the backend field already exists — this may be almost entirely a frontend change), confirming first whether `createAccount`'s existing handling already posts the correct offsetting Equity entry or just stores the number on the account with no corresponding ledger effect (worth checking `account-service.ts` before assuming either way).

**Status: done.** Confirmed the backend gap first: `createAccount` just stored `openingBalance` as a bare field on the account row with no offsetting entry — harmless for that one account's own balance (reports already seed from `account.openingBalance` before applying postings) but it silently left the trial balance out of balance company-wide, since nothing credited an equity account for the same amount. Fixed server-side: `createAccount` now stores `openingBalance`/`currentBalance` as `0` on the account row and, when a nonzero opening balance is given, posts a real `POSTED` `JOURNAL_ENTRY` transaction against a find-or-created "Opening Balance Equity" account (code `9000`), debit/credit direction chosen from `DEBIT_NORMAL_CATEGORIES` so it's correct for both debit-normal (Bank, Expense, etc.) and credit-normal (Liability, Equity, Income) accounts — mirrors the existing `importTransactions` pattern of building a `POSTED` transaction directly and calling `rebuildDerivedViews`/`updateAccountBalances`. Added the "Opening balance" input to the Chart of Accounts "Add an account" form. Verified live: created a Bank account with a $500 opening balance — it showed $500.00 immediately, "Opening Balance Equity" picked up the offsetting $500.00 credit, and the Trial Balance report showed no out-of-balance warning with both sides ties out exactly.

---

## 16. Chart of Accounts: real hierarchy tree, not just root-grouped list

**What PlainGL has:** `ChartView` renders a genuine tree — parent accounts show a rolled-up balance across all their children (e.g. "Travel" shows the sum of "Travel:Airfare", "Travel:Hotels", etc.), collapsible/expandable, matching the colon-segment hierarchy already used throughout the app (reports, register).

**What we have:** the Chart of Accounts page built this session groups accounts by root category only (Assets/Liabilities/Equity/Income/Expenses) and lists every account flat within that group — "Travel," "Travel:Airfare," and "Travel:Hotels" all appear as unrelated siblings, each showing only its own balance, not a rolled-up parent total.

**Why it matters:** for anyone with a deep chart of accounts (the seed data alone has several 2-3 level hierarchies under Travel, Medical Expenses, Office Expenses, Payroll Tax), a flat list makes it hard to see the big picture at a glance — the whole point of a "Travel" rollup is answering "how much did we spend on travel total" without manually adding up six sub-line items.

**Status: done.** Turned out `buildHierarchyRows` itself does *not* sum children into a parent's total (correct for reports — a statement that already lists both "Travel" and "Travel:Airfare" as separate lines would double-count if summed) and skips parent segments with no account of their own entirely. Added a sibling function, `buildRollupHierarchyRows`, that does the actual PlainGL-style summing and always emits a row per path segment, used only by the Chart of Accounts page — the existing report-facing helper was left untouched. Verified live: "Office Expenses" correctly reads as the sum of its children, collapse/expand works, and synthetic parent rows (no account of their own) correctly show no register link or Archive button.

---

## 17. Print / Save-as-PDF for reports

**What PlainGL has:** every `StatementView` report has a print button plus a print-specific stylesheet (clean layout, no chrome/nav) so a report can be printed or saved as PDF directly from the browser's print dialog.

**What we have:** the register already has this exact pattern (`use-register-print.ts`, wired to a Print toolbar button) — it was just never extended to the report pages (P&L, Balance Sheet, Trial Balance, P&L Detail).

**Why it matters:** small gap, but a real one — sharing or archiving a report as a PDF is a basic accounting-software expectation, and the infrastructure for it already exists in this codebase for the register.

**Status: done.** Turned out simpler than reusing `use-register-print.ts` — that hook reconstructs a whole new HTML document because the live register view has interactive chrome unsuited for printing, but a report card is already exactly what should print. Used a plain `@media print` stylesheet (hide side nav/top bar/filter controls, show only the report card) instead, so whatever's on screen — compare mode, columnar statements, an account filter — prints exactly as shown, no separate serialization to maintain. Added to all five report pages (P&L, Balance Sheet, Trial Balance, P&L Detail, By Payee).

---

## 18. Generic multi-account paste import

**What PlainGL has:** `ImportView`'s paste-based import is distinct from both the bank CSV wizard and the Journal Entry paste built this session — each pasted row can target a *different* pair of accounts (not one shared "main account" like the CSV wizard, and not built as balanced debit/credit lines like Journal Entry). It's aimed at bulk-loading arbitrary historical transactions from a spreadsheet where every row is its own two-account transaction.

**What we have:** no equivalent. The CSV import wizard assumes one shared source account for the whole file; Journal Entry assumes every pasted block is a single balanced multi-leg entry. Neither covers "paste 50 unrelated two-account transactions, each with its own pair of accounts, in one shot."

**Why it matters:** a real but narrower gap than it sounds — it mainly matters for one-time bulk historical data loading (e.g. migrating years of transactions from a spreadsheet), not day-to-day use, since day-to-day bank activity already goes through the CSV wizard.

**Build notes:** would need a new paste-parsing flow (reusing the tab/comma-detection logic already built for Journal Entry's paste handler) expecting columns like Date/Account/Offset-Account/Amount/Memo per row, each row becoming its own independent 2-posting transaction via the existing `createTransaction` call — no backend changes needed, same reasoning as #5/#6 (postings are already N-generic, and each row is just its own ordinary 2-leg transaction). Medium lift, mostly because of the paste-column-mapping UI, not the underlying transaction creation.

---

## Confirmed non-gaps

Scanned PlainGL's `actions.ts` (every exported server action) and `lib/` directory in full for common accounting-software features that turned out **not** to exist in PlainGL at all, so they're not gaps against PlainGL specifically (they may still be worth building someday, just not "PlainGL has this and we don't"): recurring/scheduled transactions, budgets, attachments/receipt uploads, multi-currency, formal bank reconciliation UI, and an audit log / activity history beyond the per-transaction audit trail already in our data model.

**Still a real, larger gap, unchanged from #8's original note:** A/R and A/P aging reports remain blocked on schema work (no A/P account category exists at all, and transactions have no due-date field) — not re-listed as its own numbered item here since it was already called out under Dashboard metrics (#8) and nothing changed about that assessment during this pass.

---

## Priority order

Roughly ordered by value-for-effort, per the original audit's backlog, refined with the concrete detail above.

**Original nine — all done:**

1. **Report compare + columnar statements** (#3) — controls already exist, purely wiring. ✅
2. **Trial Balance** (#2) — mechanically simple, reuses existing report infrastructure. ✅
3. **Date-range export** (#9) — small, contained, extends an existing feature. ✅
4. **Chart of Accounts screen** (#1) — no new backend work, meaningful UI build. ✅
5. **Dashboard metrics** (#8) — high visible value, moderate build. ✅
6. **Banking rules manager** (#7) — needs a product decision (precedence vs. AI) before building. ✅
7. **Register splits + Journal Entry** (#5, #6) — largest, most structurally invasive items (touch the register, the CSV wizard, and the transaction data model); worth doing last so the data-model implications are informed by everything else already built. ✅
8. **P&L Detail** (#4) — smallest true gap; slot in wherever convenient once the report-wiring work (#3) is done, since it benefits from the same infrastructure. ✅

**Addendum (11-18) — not yet built, ordered by value-for-effort:**

9. **Chart of Accounts real tree/rollup** (#16) — small, the hierarchy helper already exists in this codebase; likely the single cheapest item in the whole addendum. ✅
10. **Print/Save-as-PDF for reports** (#17) — small, the register already has this exact pattern to copy. ✅
11. **Income/expense-by-payee report** (#12) — small-to-medium, reuses the existing P&L computation, no schema dependency. ✅
12. **Bank rules export/import/duplicate** (#14) — small, frontend-only convenience on top of the existing rules CRUD. ✅
13. **Account opening balance on creation** (#15) — small, the backend field already exists; check whether it needs an Equity-offset fix first. ✅
14. **Bank feed dedup/exclude memory** (#11) — medium, a real day-to-day friction point once someone re-imports overlapping statements. ✅
15. **Company creation: templates + duplicate-existing** (#13) — medium, matters more as multi-company usage grows.
16. **Generic multi-account paste import** (#18) — medium, narrower value (one-time bulk historical loads, not day-to-day use).
17. **Report columns/compare by dimension** (#10) — lowest priority, a reporting refinement rather than a core gap; the two sub-pieces (dimension columns, percent-of-total display) can be split further if only one turns out to be worth doing.
