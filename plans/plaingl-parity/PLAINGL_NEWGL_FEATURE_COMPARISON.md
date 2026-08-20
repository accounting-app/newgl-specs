# PlainGL → NewGL Feature Gaps

## Product framing

| Layer | Source of truth |
|---|---|
| **UI/UX** | **Ours — QBO-inspired** (icon rail, register chrome, report filter bar, settings). Do **not** port PlainGL’s tables/tabs look. |
| **Functionality target** | **PlainGL’s accounting scope**, implemented in our UX. |

**This doc lists only what we still need from PlainGL** (missing or incomplete vs their app). It does **not** inventory capabilities we have that PlainGL lacks.

**Code:** `newgl-ui/` (+ `newgl-api/` where user-facing) vs `plaingl/`. QBO inspires UX quality, not a third codebase under comparison.

### Parity status (vs PlainGL only)

| Status | Meaning |
|---|---|
| `1:1` | We already cover this PlainGL capability (UI may differ). |
| `Near 1:1` | We have it, but PlainGL’s version is more complete — close the delta in our UX. |
| `Not Implemented` | PlainGL has it; we do not (or our control is non-functional). |
| `Skip` | PlainGL has it; we intentionally do not adopt (called out separately). |

---

## 1. Summary table

| Parity Status | Count |
|---|---:|
| `1:1` | 3 |
| `Near 1:1` | 10 |
| `Not Implemented` | 15 |
| **Total (in scope)** | **28** |
| `Skip` (intentionally not adopting) | 3 |

---

## 2. Gaps & coverage by functional area

### Shell & company setup

| Feature | Our UI | PlainGL | Status | Gap Notes |
|---|---|---|---|---|
| App shell / primary navigation | SideNav: Home, Register, Reports, Settings | `Shell.tsx` 8 tabs | Near 1:1 | Keep our IA; surface missing capabilities through rail / secondary nav as they land |
| Multi-entity / company switcher | Single tenant (`TenantProvider`) | Entity list + search in `Shell.tsx` | Not Implemented | Product decision: QBO-style switcher, or stay single-org |
| Create company (scratch / COA template / duplicate) | — | New entity modal + `lib/coa-templates.ts` | Not Implemented | Starters + duplicate — ship as onboarding/settings in our UX |

### Dashboard & management summary

| Feature | Our UI | PlainGL | Status | Gap Notes |
|---|---|---|---|---|
| Executive dashboard (cash, AR/AP, NI, bars, recent, top customers) | Home is greeting only | `DashboardView.tsx` | Not Implemented | Put metrics on Home (or a Dashboard route) in our visual language |
| Management summary (compact P&L/BS, A/R·A/P aging, income/expense by payee) | — | `ReportsView.tsx` | Not Implemented | Aging + payee rollups as report cards / widgets |

### Financial statements / reports

| Feature | Our UI | PlainGL | Status | Gap Notes |
|---|---|---|---|---|
| Standard reports index | `/reports` card grid | Nested report types in Reports tab | Near 1:1 | Keep our index; add cards as reports land |
| Profit & Loss (single period) | `/reports/profit-loss` | `StatementView` `pl` | 1:1 | Core covered |
| Balance Sheet (as-of) | `/reports/balance-sheet` | `StatementView` `bs` | 1:1 | Core covered |
| P&L Detail | Section drill only | `StatementView` `pld` + account filter | Near 1:1 | First-class Detail report (or deeper drill) on our index |
| Trial Balance | — | `StatementView` `tb` | Not Implemented | New report page using existing report chrome |
| Prior-period / custom compare columns | Compare control (URL only; no row effect) | Live compare + $/% change | Not Implemented | Wire existing filter chrome to real computation |
| Columnar statements (week / month / quarter) | Display-columns control (URL only) | `getStatementsByPeriod` | Not Implemented | Wire existing control to multi-column statements |
| Drill report → register / transactions | In-report drill panel; no register deep-link | Opens Ledger on account/tx | Near 1:1 | Optional navigate to `/register` focused on account |

### Ledger / register / journal

| Feature | Our UI | PlainGL | Status | Gap Notes |
|---|---|---|---|---|
| Account register (select, balance, grid) | `/register` | `RegisterView` | 1:1 | Our register is the UX baseline |
| Add / edit / delete lines | Inline draft + edit | Inline / editMode | Near 1:1 | Close enough; extend for splits/JE below |
| Split transactions (multi-category) | Single offset account | Splits in register + bank feed | Not Implemented | Split editor in our register row UX |
| Basic two-posting data entry | Absorbed into register draft | Form above register in `DataEntryView` | Near 1:1 | Covered by register add — no separate PlainGL panel needed |
| Multi-line journal entry + Excel/CSV paste | `JOURNAL_ENTRY` type is 2-leg only | `JournalEntryView` + paste | Not Implemented | Dedicated Journal flow in our design system |
| Register date / account filtering | Rich filter popover | Date presets + account filter | Near 1:1 | Ours already covers (and exceeds) PlainGL’s filters |

### Chart of accounts

| Feature | Our UI | PlainGL | Status | Gap Notes |
|---|---|---|---|---|
| Chart tree + balances | No page (API + register selectors only) | `ChartView.tsx` | Not Implemented | QBO-style Chart/Lists screen; API CRUD exists |
| Add / remove accounts UI | — | `ChartView` | Not Implemented | Same surface |
| Bulk account import | — | `importAccounts` | Not Implemented | Import into Chart (or Settings), our wizard style |
| Chart → open register for account | — | Balance click → Ledger | Not Implemented | e.g. `/register?account=…` |

### Bank feed & import

| Feature | Our UI | PlainGL | Status | Gap Notes |
|---|---|---|---|---|
| Bank / CSV → categorize → post | `ImportModal` wizard | `BankFeedView` | Near 1:1 | Keep wizard; add match/exclude memory, bulk, feed-like inbox behavior |
| Deterministic bank rules (conditions, auto-post, import/export rules) | AI suggest + `learnPayeeRules` only | `BankRulesManager.tsx` | Not Implemented | Rules UI alongside AI |
| Paste / mapped ledger import | Mapping wizard | `ImportView` | Near 1:1 | Capability covered by our wizard |

### Export

| Feature | Our UI | PlainGL | Status | Gap Notes |
|---|---|---|---|---|
| Full `.bean` / beancount download | Settings → Ledger download | `ExportView` | Near 1:1 | Placement differs; full-file export exists |
| Date-range ledger export | — | `ExportView` scope=range | Not Implemented | Extend Ledger settings export options |
| Copy ledger to clipboard | — | `ExportView` copy | Near 1:1 → small gap | Optional nicety if we want full PlainGL export parity |

*(Copy-to-clipboard counted inside the Near 1:1 full-export row as a minor delta, not a separate Not Implemented.)*

---

## 3. Skip (PlainGL has it; not our parity target)

| PlainGL feature | Why we skip |
|---|---|
| Entity owner/password gate | Replaced by Supabase account auth |
| Sample company admin reseed / delete-company UI | Ops/demo tooling, not core product UX |
| PlainGL primary IA (8 tabs) + multi named theme skins | UX belongs to our QBO-inspired shell |

---

## 4. Priority backlog (close PlainGL gaps in our UX)

1. **Wire report Compare + Display-columns** — controls exist; PlainGL already ships the behavior.
2. **Chart of Accounts screen** — tree, add/remove, import, drill to register.
3. **Banking feed depth + rules manager** — matching/exclude memory, bulk; rules alongside AI.
4. **Dashboard metrics + aging / payee summaries** — Home widgets and/or report cards.
5. **Trial Balance + first-class P&L Detail**.
6. **Register splits + Journal entry workspace**.
7. **Company / COA starters (if multi-entity is in scope)** — else document single-org and leave switcher as Skip.
8. **Date-range `.bean` export** (and optional clipboard copy).

---

## PlainGL inventory (functionality checklist)

Use this as the checklist of PlainGL capabilities that map into the tables above:

- `DashboardView` — metrics
- `ReportsView` — summary / aging / payee
- `StatementView` — P&L, P&L Detail, BS, TB, compare, columnar
- `DataEntryView` + `RegisterView` — ledger + splits
- `JournalEntryView` — multi-line JE + paste
- `ChartView` — COA CRUD / import / drill
- `BankFeedView` + `BankRulesManager` — feed + rules
- `ImportView` + `ExportView` — import + beancount export (+ range)
- `Shell.tsx` entity create / switcher — product decision; password/admin → Skip
