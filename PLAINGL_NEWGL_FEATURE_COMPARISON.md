# UI Feature Comparison: newgl-ui vs plaingl

**Basis:** Code under `newgl-ui/` (plus user-facing surfaces backed by `newgl-api/`) vs `plaingl/` (PlainGL.com export). QuickBooks Online is a polish benchmark only — it is not a third codebase under diff. Bidirectional gaps included.

**Code shape**

| | **Our product** | **plaingl** |
|--|--|--|
| App model | Next.js App Router; routes under `src/app/` | Single page `app/page.tsx` + tabbed `Shell.tsx` |
| Nav | SideNav: Home, Register, Reports, Settings | Tabs: Dash, Summary, Reports, Ledger, Journal, Chart, Bank Feed, Import/Export |
| Auth | Supabase login/signup | Per-entity owner/password + admin password |
| Tenancy | Single tenant/org (`TenantProvider`) | Multi-entity ledger files |

---

## 1. Summary table

| Parity Status | Count |
|---|---:|
| `1:1` | 3 |
| `Near 1:1` | 14 |
| `Not Implemented` | 28 |
| **Total** | **45** |

Of the 28 `Not Implemented`: **18 plaingl → missing in ours**, **10 ours → missing in plaingl**.

Parity status values:

- `1:1` — same functionality and comparable UI structure
- `Near 1:1` — feature exists on both sides but differs in fields, flow, states, or completeness
- `Not Implemented` — exists on one side only (direction marked in Gap Notes)

---

## 2. Detailed comparison (by functional area)

### Shell, tenancy & access

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| App shell / primary navigation | `newgl-ui/src/components/layout/side-nav.tsx`, `app-shell.tsx` — Home / Register / Reports / Settings | `plaingl/app/Shell.tsx` — 8 accounting tabs | Near 1:1 | Both shell + main work area; ours is QBO-narrow icon rail; plaingl exposes Dash→Import/Export as first-class tabs |
| Multi-entity / company switcher | — (single tenant via `TenantProvider`) | `Shell.tsx` entity list, search, active entity | Not Implemented | **Missing in ours** — no company picker / multi-ledger switcher in UI |
| Create company (scratch / COA template / duplicate) | — | `Shell.tsx` New entity modal + `lib/coa-templates.ts` | Not Implemented | **Missing in ours** — service/product COA starters + duplicate entity absent |
| Entity password gate | — | `Shell.tsx` login modal + `verifyLogin` | Not Implemented | **Missing in ours** — replaced by account auth, not per-ledger password |
| Sample company + admin reseed/delete | — | Sample entity, Admin mode, `reseedSample`, `deleteEntity` | Not Implemented | **Missing in ours** — demo/admin ops not in our UI |
| Theme switcher | `theme-toggle.tsx` (light/dark via `next-themes`) | `Shell.tsx` select: default / pretty / dark / america250 / modern | Near 1:1 | Both theme skins; plaingl has more named skins |
| Email auth (login / signup / sign-out) | `(auth)/login`, `signup`, `TopHeader` sign-out, Supabase | — | Not Implemented | **Missing in plaingl** — real user accounts only on our side |
| Home / onboarding greeting | `(app)/page.tsx` → `home-greeting-screen.tsx` | — (lands on Reports tab) | Not Implemented | **Missing in plaingl** — ours is static placeholder home, not a KPI dashboard |

### Dashboard & management summary

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| Executive dashboard (cash/AR/AP/NI, bars, recent, top customers) | — | `DashboardView.tsx` (`Dash` tab) | Not Implemented | **Missing in ours** — Home is greeting only; no metrics dashboard |
| Management summary (compact P&L/BS + A/R·A/P aging + income/expense by payee) | — | `ReportsView.tsx` (`Summary` tab) | Not Implemented | **Missing in ours** — aging and payee rollups have no UI counterpart |

### Financial statements / reports

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| Standard reports index | `(app)/reports/page.tsx` + `REPORT_NAV_ITEMS` | Implicit via Reports tab sub-tabs | Near 1:1 | Ours is QBO-style card index (P&L + BS only); plaingl nests report types in one view |
| Profit & Loss (single period) | `reports/profit-loss` → `reports-page.tsx` | `StatementView.tsx` `which=pl` | 1:1 | Both date-ranged P&L with section totals; ours client-aggregates postings |
| Balance Sheet (as-of) | `reports/balance-sheet` → `reports-page.tsx` | `StatementView.tsx` `which=bs` | 1:1 | Both hierarchical BS with balance indicator concept (plaingl pills “balanced”; ours shows equation totals) |
| P&L Detail (transaction-level report) | Section drill in `reports-page.tsx` only | `StatementView.tsx` `which=pld` + account filter | Near 1:1 | Ours drills a section into account txns; plaingl has first-class P&L Detail report + account picker |
| Trial Balance | — | `StatementView.tsx` `which=tb` + `getTrialBalance` | Not Implemented | **Missing in ours** — no TB route or table |
| Prior-period / custom compare columns | Compare-to `<SelectField>` in `reports-page.tsx` (URL only) | `StatementView.tsx` compareMode prior-year/custom + $/% change | Not Implemented | **Missing in ours (functional)** — ours options in `ui.ts` do **not** change computed rows; plaingl compare is live |
| Columnar statements (week / month / quarter) | Display-columns `<SelectField>` (URL only) | `getStatementsByPeriod` + `PeriodStatementTable` | Not Implemented | **Missing in ours (functional)** — control is non-functional stub; plaingl builds real multi-column statements |
| Cash vs accrual toggle | Cash/Accrual buttons in `reports-page.tsx` (label + URL) | — | Not Implemented | **Missing in plaingl** — ours toggle also does not alter posting aggregation today (UI-only) |
| Drill from report into register / transactions | In-report drill + `drill-down-panel.tsx`; no deep-link to `/register` | Click statement → `onOpenTransaction` / open account in Ledger | Near 1:1 | Both drill to txn detail; plaingl jumps to Ledger focused on account/tx |

### Ledger / register / journal entry

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| Account register (select account, running/ending balance, grid) | `/register` → `bank-register-layout.tsx` + `register-table.tsx` | `DataEntryView` → `RegisterView.tsx` (`Ledger` tab) | 1:1 | Core register browsing/editing present on both |
| Add / edit / delete register lines | Inline draft + edit forms; `use-bank-register.ts` | Inline / editMode + `updateTransaction` / `deleteTransaction` | Near 1:1 | Same job; ours locks cleared/reconciled rows; plaingl has continuous `editMode` |
| Split transactions (multi-category counters) | Single offset account in add/edit forms | `RegisterView` splits + `BankFeedView` splits | Not Implemented | **Missing in ours** — no multi-line split editor in register UI |
| Basic two-posting data-entry form (debit/credit/amount panel) | Absorbed into register draft row | `DataEntryView.tsx` form above register | Near 1:1 | Functionally covered by register add; plaingl keeps separate “Basic data entry” panel |
| Multi-line journal entry + Excel/CSV paste | `JOURNAL_ENTRY` type in type catalog only (2-leg register path) | `JournalEntryView.tsx` live debit/credit balance + paste | Not Implemented | **Missing in ours** — no dedicated Journal workspace / paste grid |
| QBO-style transaction-type quick-add | `action-toolbar.tsx` + `transaction-type-policy.ts` | Generic debit/credit / journal | Not Implemented | **Missing in plaingl** — large type catalog (Check, Bill, Transfer, …) only on ours |
| Reconcile status cycling (cleared / reconciled) | `reconcile-status.tsx` + API reconcile | — | Not Implemented | **Missing in plaingl** — QBO-like C/R marks only on ours |
| Register filters (date, find, payee, type, reconcile) | `filter-form-popover.tsx` + `use-register-filters.ts` | Date presets + account filter in `RegisterView` | Near 1:1 | Ours richer filter chips; both filter the grid |
| Register print | `use-register-print.ts` | — | Not Implemented | **Missing in plaingl** |
| Register filtered export (HTML download) | `use-register-export.ts` | — (ledger export is beancount under Import/Export) | Near 1:1 | Different artifact: ours HTML register dump vs plaingl full ledger text |
| Payee create modal (customer / vendor / employee) | `payee-side-modal.tsx` (local list on save) | Free-text payee fields | Not Implemented | **Missing in plaingl** — ours has QBO-dense form; persistence looks client-local |
| Void / reverse transaction UI | `detail-panel.tsx` + hooks exist; **not mounted** in register table | Delete only | Not Implemented | **Missing in both UIs as a finished flow** — component/API on ours unused; plaingl has delete, no void/reverse |

### Chart of accounts

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| Chart of accounts tree + balances | No page (accounts only via register selector / API `HttpAccountService`) | `ChartView.tsx` tree, rollups | Not Implemented | **Missing in ours** — `createAccount` exists in API client; no Chart screen |
| Add / remove accounts UI | — | `ChartView` add/remove | Not Implemented | **Missing in ours** |
| Bulk account import | — | `importAccounts` in `ChartView` | Not Implemented | **Missing in ours** |
| Chart → open register for account | — | Balance click → Ledger focus | Not Implemented | **Missing in ours** |

### Bank feed & import

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| Bank / CSV import → categorize → post | `ImportModal` wizard (upload → account → mapping → verify) | `BankFeedView.tsx` file/paste, categorize, bulk, commit | Near 1:1 | Same job; plaingl adds posted/deleted signatures, flip sign, in/out filters, feed splits |
| Deterministic bank rules manager (conditions, auto-post, import/export rules) | AI suggest + `learnPayeeRules` during import | `BankRulesManager.tsx` + `lib/bank-rules.ts` | Not Implemented | **Missing in ours** — ours is AI/session learning, not a rules CRUD UI |
| Paste Excel ledger import (Account/Offset columns) | Mapping wizard covers arbitrary columns | `ImportView.tsx` preview + commit | Near 1:1 | Overlapping capability; different UX |

### Export & ledger file ops

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| Full `.bean` / beancount download | Settings Ledger download `settings/ledger/page.tsx` | `ExportView.tsx` `.beancount` / `.txt` + copy | Near 1:1 | Both export plain-text ledger |
| Date-range ledger export | — | `ExportView` scope=range | Not Implemented | **Missing in ours** |
| Ledger upload + version history + restore | `settings/ledger/page.tsx` | — | Not Implemented | **Missing in plaingl** — versioned replace/restore is ours-only |

### Settings / AI / commercial

| Feature/Screen | Our UI (path/component) | plaingl UI (path/component) | Parity Status | Gap Notes |
|---|---|---|---|---|
| Settings hub (AI / Ledger / Billing / Org) | `(app)/settings/*` | Feedback/about modal only | Not Implemented | **Missing in plaingl** |
| AI enablement, BYOK, usage meters | `settings/ai/page.tsx` + import AI calls | — | Not Implemented | **Missing in plaingl** |
| Billing / plan display | `settings/billing/page.tsx` (free stub) | — | Not Implemented | **Missing in plaingl** — placeholder only on ours |
| Organization profile | `settings/organization/page.tsx` | Entity name/owner as company identity | Near 1:1 | Different model (tenant vs entity file); both show org identity |

---

## 3. UI/UX quality flags (QBO benchmark — judgment, not parity)

These are **`1:1` or `Near 1:1` items where our execution still trails QBO-grade polish**, independent of feature existence:

| Item | Why it falls short of QBO-caliber UX |
|---|---|
| **Home greeting** | Static “Hello, John” + one CTA card; no company context, balances, or actionable inbox density |
| **Register** | Stronger visual kinship with QBO than plaingl, but payee modal is heavyweight vs shallow persistence; many transaction types without matching specialized document UIs; void/reverse panel orphaned |
| **CSV import wizard** | Solid multi-step flow; still not a persistent Bank Feed inbox with matching/exclude memory like QBO Banking |
| **P&L / Balance Sheet** | QBO-like filter chrome (Compare, Display columns, Cash/Accrual) **looks** complete but several controls are non-operative — worse than sparse UI because it implies capability |
| **Reports index** | Only two reports; QBO users expect a broader report library and saved customizations |
| **App chrome** | Icon rail + header is on-path, but missing company switcher, global search, and dense secondary nav QBO users expect |
| **Settings** | Clear cards, but Billing/Org are stubs — feels unfinished vs productized QBO settings |

plaingl’s utilitarian tables/panels are **not** QBO-grade either; our advantage is design tokens and register patterns, offset by stubbed report controls.

---

## 4. Priority gap list (close first)

1. **Make report Compare / Display-columns / Cash–Accrual real (or remove them)** — Stub controls actively undermine QBO polish; plaingl already ships live compare + columnar statements (`StatementView`).
2. **Chart of Accounts screen** — API account CRUD exists; plaingl `ChartView` is a core workflow (add/remove/import/drill). Blocking for everyday bookkeeping.
3. **Bank Feed + rules (or harden Import into a feed)** — plaingl `BankFeedView` + `BankRulesManager` are major product differentiators; our wizard is one-shot, not recurring matching.
4. **Dashboard + aging / payee summaries** — `DashboardView` + `ReportsView` aging/payee packs are high-visibility scope gaps vs plaingl functional target.
5. **Trial Balance (+ first-class P&L Detail)** — Completes the statement suite accountants expect; present in plaingl Reports tab.
6. **Register splits + journal entry workspace** — Split posting and multi-line JE (`JournalEntryView`) are table-stakes for GL work beyond simple bank lines.
7. **Wire or drop void/reverse (`DetailPanel`)** — Hooks/API exist; dead UI hurts trust.
8. **Multi-entity / company context (if product intends plaingl’s multi-company model)** — Otherwise formally defer and document “single org only.”
9. **Date-range beancount export** — Small gap vs `ExportView` once Ledger settings already download full file.
10. **Home → real overview** — Replace greeting with cash/AR/AP/recent (even a thin port of `DashboardView`) so first viewport matches QBO “do work now” density.

---

## Inventories (quick reference)

### Our routes (`newgl-ui`)

- `/` — Home greeting
- `/register` — Bank register + CSV import modal
- `/reports` — Standard reports index
- `/reports/profit-loss`
- `/reports/balance-sheet`
- `/settings/ai`
- `/settings/ledger`
- `/settings/billing`
- `/settings/organization`
- `/login`, `/signup`, `auth/callback`

### plaingl tabs / views

- `DashboardView` — Dash
- `ReportsView` — Summary
- `StatementView` — Reports (P&L, P&L Detail, Balance Sheet, Trial Balance)
- `DataEntryView` + `RegisterView` — Ledger
- `JournalEntryView` — Journal
- `ChartView` — Chart
- `BankFeedView` + `BankRulesManager` — Bank Feed
- `ImportView` + `ExportView` — Import/Export
- Entity/admin modals in `Shell.tsx`
