# Features to Implement, Based on PlainGL

**Source:** `PLAINGL_NEWGL_FEATURE_COMPARISON.md` (the audit) — this document turns that audit's "Not Implemented" list into an actual build plan, with concrete detail pulled from PlainGL's own source (`plaingl/app/`), grouped by area, in priority order.

**Scope reminder from the audit doc, worth repeating here:** the target is PlainGL's *accounting functionality*, built in **our own QBO-inspired UI** — icon rail, register chrome, report filter bar, Settings pattern. Nothing here means porting PlainGL's look, its 8-tab shell, or its component structure. Where a description below says "like PlainGL's X," that's describing the *capability*, not the UI to copy.

**One item already done, no longer in this list:** the audit's "Multi-entity / company switcher" and "Create company" rows are marked `Not Implemented` there, but that was written before Phase A — we already shipped a company switcher and company creation (see `INSTANCE_ARCHITECTURE_PLAN.md` Phase A). Not repeated below.

**Branch:** `19-issue-plaingl_features_to_implement_dc` (quickslike, newgl-api, newgl-ai).

**Progress:** #3 (Report compare + columnar statements) and #2 (Trial Balance) are done — see item 10 below for a follow-on gap #3 surfaced.

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

## Priority order

Roughly ordered by value-for-effort, per the original audit's backlog, refined with the concrete detail above:

1. **Report compare + columnar statements** (#3) — controls already exist, purely wiring.
2. **Trial Balance** (#2) — mechanically simple, reuses existing report infrastructure.
3. **Date-range export** (#9) — small, contained, extends an existing feature.
4. **Chart of Accounts screen** (#1) — no new backend work, meaningful UI build.
5. **Dashboard metrics** (#8) — high visible value, moderate build.
6. **Banking rules manager** (#7) — needs a product decision (precedence vs. AI) before building.
7. **Register splits + Journal Entry** (#5, #6) — largest, most structurally invasive items (touch the register, the CSV wizard, and the transaction data model); worth doing last so the data-model implications are informed by everything else already built.
8. **P&L Detail** (#4) — smallest true gap; slot in wherever convenient once the report-wiring work (#3) is done, since it benefits from the same infrastructure.
9. **Report columns/compare by dimension** (#10) — lowest priority, a reporting refinement rather than a core gap; the two sub-pieces (dimension columns, percent-of-total display) can be split further if only one turns out to be worth doing.
