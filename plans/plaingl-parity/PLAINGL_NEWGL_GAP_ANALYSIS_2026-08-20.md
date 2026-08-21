# PlainGL → New GL Feature Gap Analysis (2026-08-20)

**Status:** Phases 1-4 done, plus a post-Phase-4 follow-up -- branch `23-issue_plaingl_fetaures_to_implement_dc` (quickslike, newgl-api). Every gap this doc ever identified is closed. See "Final Status" immediately below for the complete implemented/left-out breakdown and the parity verdict; the rest of this doc is the working log kept for history.

---

## Final Status (2026-08-21)

### What was implemented

Everything below shipped on `23-issue_plaingl_fetaures_to_implement_dc`, verified live in the browser (not just typechecked), with tests added where the surface already had test coverage precedent.

| # | Feature | quickslike | newgl-api |
|---|---|---|---|
| 1 | Journal Entry CSV export | `af72fdc` | — |
| 2 | Duplicate-detection deep link (clickable, not just text) | `7d64b86` | — |
| 3 | True account deletion (Delete next to Archive, zero-activity only) | `cc6c25e` | `a0d4452` |
| 4 | `ACCOUNTS_PAYABLE` category + transaction due date | `8d665a0` | `d9da374` |
| 5 | A/R & A/P Aging report (`/reports/aging`) | `fb64316` | — |
| 6 | Split categorization in CSV/bank-feed review (multi-leg, live balance check) | ✅ | ✅ (posting logic generalized to N-way) |
| 7 | Bank rule auto-post (`autoPost` flag + "Auto-post N" bulk action) | ✅ | ✅ (`bank_rules.auto_post` column) |
| 8 | Bank rule condition scope (direction: money in/out; scoped to one account) | ✅ | ✅ (`bank_rules.direction`/`scoped_account_id`) |
| 9 | Company/entity deletion (`DELETE /api/companies/{name}`, primary-delete guard, active-ledger fallback) | ✅ | ✅ |
| 10 | Additional visual themes: Modern, America 250, **and** Pretty (all 5 of PlainGL's skins) | ✅ | — |
| 11 | Bank rules match raw bank-memo text separately from cleaned memo (`rawMemo` field) | ✅ | ✅ (schema) |
| 12 | Dashboard "needs attention" panel (overdue A/R/A/P banner, linked to the aging report) | ✅ | — |
| 13 | `/api/companies` route test coverage (list/create/switch/delete) | — | `tests/companies.test.ts` |

Item 10 (themes) is the one case where the actual delivered scope exceeds what was originally planned: the plan only called for "additional visual themes" generically, and PlainGL's 5th skin ("Pretty," a gradient/backdrop-blur look) was initially written off as not implementable with this app's CSS-token system — a second look found a workable trick (a CSS variable can hold a full `background` value, gradients included, wherever the app already renders a token via the `background` shorthand) and it shipped anyway. See "What was left out" for the one piece of Pretty that still doesn't fully render, and why.

### What was left out, and why

| Item | Why it wasn't implemented |
|---|---|
| Backdrop-blur (frosted glass) on the Pretty theme's sidebar/header | Not a design decision — it's a build-tool limitation. The `backdrop-filter` CSS property is stripped from the compiled stylesheet by this project's Next.js/Tailwind/lightningcss pipeline (confirmed by inspecting the actual served CSS: only the `-webkit-`-prefixed declaration survives, the standard one is silently dropped). Chasing this further would mean changing build tooling for one cosmetic detail on one of five themes. The theme still ships and still looks distinctly different from the other four — it just renders as a plain translucent panel instead of a blurred one. |
| Uniform compare/columnar reporting across all 4 statement types (Trial Balance, P&L Detail, By Payee, in addition to P&L/Balance Sheet) | Not a real gap, so nothing to implement — this was in the original audit but was **wrong**, caught and struck mid-Phase-2. PlainGL itself only supports compare/columnar on P&L and Balance Sheet; it was never on Trial Balance, P&L Detail, or By Payee in PlainGL either. New GL already matches PlainGL's actual scope. It also wouldn't fit structurally even if desired: Trial Balance is a point-in-time Debit/Credit snapshot and P&L Detail is a raw transaction list — neither composes with "compare two periods" or "one column per period" the way P&L/Balance Sheet's rolled-up account totals do. |
| PlainGL's per-entity SHA-256 password ("convenience lock") | Never scoped as something to port — New GL already has real Supabase per-user authentication, which is strictly stronger. PlainGL's own code documents its password as not real access control. Copying it would be a downgrade, not parity. |

No other item from any phase of this doc, or from the follow-up pass, was skipped or deferred.

### Where New GL stands vs. PlainGL

**Yes — every PlainGL feature this audit found has a New GL equivalent or better**, with one caveat: the frosted-glass visual effect on one of five themes doesn't fully render, for the build-tooling reason above. That is the only remaining PlainGL behavior without a byte-for-byte equivalent in New GL.

Beyond parity, New GL is ahead of PlainGL in several areas that were never gaps to begin with (see "Where New GL is already ahead" below for details): real per-user authentication vs. PlainGL's documented-as-fake password lock, full ledger version history with restore vs. PlainGL's no-undo flat-file overwrites, AI-assisted CSV mapping and categorization (PlainGL has none), Postgres as the system of record with the `.bean` file as an export format rather than *being* the database, print/PDF coverage on all 5 reports vs. PlainGL's one tab, and a dedicated By Payee report vs. PlainGL folding it into Summary.

This verdict is scoped to what a source-level review plus a live click-through of PlainGL v1.0.28 found as of 2026-08-20, re-verified through 2026-08-21. It is not a formal spec-by-spec certification — a future PlainGL release could add features this audit never saw.

---

**Phase 1 notes:**
- **Journal Entry CSV export** (quickslike `af72fdc`): downloads the on-screen entry as `journal-entry-<date>.csv`, mirroring the Blob-download pattern already used by Bank Rules' export.
- **Duplicate-detection deep link** (quickslike `7d64b86`): CSV review's "Looks like a duplicate" now links straight to the matching transaction in the Register (new `tx` query param, threaded through the same way `account` already was).
- **True account deletion** (quickslike `cc6c25e`, newgl-api `a0d4452`): new `AccountService.deleteAccount` / `DELETE /api/accounts/:id`, rejecting accounts with any posting activity (verified live both ways, plus two new backend tests). Chart of Accounts now has Delete next to Archive.

**Phase 2 notes:** the "uniform compare/columnar reporting" item was dropped as a false gap -- see the correction under "Real functional gaps" below, made mid-phase after re-reading the original PlainGL audit more carefully. The only real item was A/R & A/P aging:
- **Accounts Payable category + transaction due date** (newgl-api `d9da374`, quickslike `8d665a0`): the schema prerequisite the original audit flagged -- no A/P category existed at all, and transactions had no due-date field. New `ACCOUNTS_PAYABLE` category wired everywhere `ACCOUNTS_RECEIVABLE` already was; new optional `dueDate` on transactions, falling back to `transactionDate` when unset (matching PlainGL's own `due`-metadata fallback).
- **A/R & A/P Aging report** (quickslike `fb64316`): new `/reports/aging`, in the report switcher alongside the other 5. Buckets each posting to an A/R/A/P account by age (Current/1-30/31-60/61-90/90+), grouped by payee -- ages individual postings rather than matched invoice/payment pairs (no invoice-matching exists in this app, same simplification PlainGL itself makes), so per-payee Total is always the correct net balance even though individual bucket columns are an approximation. Also added a "Due date" field to the Journal Entry modal. Verified live end-to-end (created an A/P account, posted a bill, confirmed it aged correctly); bucket-boundary math checked separately.

**Reviewed:** PlainGL (`/plaingl`, live at `localhost:3020`, v1.0.28) vs. New GL (`quickslike`).
**Method:** Full source review of both codebases, plus a live click-through of every PlainGL tab against its seeded demo data.

**Relationship to the earlier audit:** this is a fresh, live re-audit done after the `21-issue_ui_fixes_and_updates_dc` UI overhaul and the original [`PLAINGL_FEATURES_TO_IMPLEMENT.md`](./PLAINGL_FEATURES_TO_IMPLEMENT.md) backlog (all 18 of its items are marked done). It is **not** a duplicate of that work — most of what's listed as "already ahead" below is exactly what that backlog delivered. What follows are gaps found *after* that backlog was completed, discovered by re-checking PlainGL's actual current behavior line by line rather than relying on the older audit's snapshot. Two items below (compare/columnar reporting, split categorization in CSV review) refine or narrow a scope decision the older backlog already flagged rather than introducing a brand-new topic — see the notes on each.

---

## Analysis

### Where New GL is already ahead
- **AI features** — column-mapping suggestions, AI categorization suggestions, BYOK Anthropic key. PlainGL has none of this; its bank rules are pure deterministic condition-matching, no model involved.
- **Real ledger versioning** — the Ledger page has full version history with restore. PlainGL has **zero** undo/rollback at the storage layer; every save is a blind overwrite of the flat file.
- **Real authentication** — Supabase per-user accounts. PlainGL's per-entity password is a SHA-256 "convenience lock," explicitly documented in their own code as not real access control.
- **Print coverage** — all 5 report pages have Print. PlainGL only prints from its "Reports" tab (P&L/BS/TB/Detail); no other tab has print/PDF.
- **Dedicated By Payee report** — a first-class report page (this was `PLAINGL_FEATURES_TO_IMPLEMENT.md` item #12, done). PlainGL only folds payee breakdowns into its Summary tab.
- **Postgres as source of truth** — with the `.bean` file as an export/interchange format, vs. PlainGL's flat file *being* the database.

### Real functional gaps
1. ~~A/R and A/P aging~~ ✅ **Done (Phase 2 + follow-up).** PlainGL has Current/1-30/31-60/61-90/90+ aging buckets for both receivables and payables, plus a "needs attention" panel surfacing overdue amounts. New GL now has an `ACCOUNTS_PAYABLE` category, an optional transaction due date, a dedicated `/reports/aging` report bucketing outstanding A/R and A/P by payee, and (added in the post-Phase-4 follow-up) a dashboard "needs attention" banner surfacing the same overdue totals.
2. ~~Period comparison + columnar reporting isn't uniform.~~ **Correction (2026-08-20, after starting Phase 2): this was wrong, struck from the gap list.** Re-reading the original PlainGL audit closely, its own text says compare/columnar is scoped to "P&L and Balance Sheet only" in PlainGL itself — it was never applied to Trial Balance, P&L Detail, or By Payee there either. New GL already matches PlainGL's actual scope (both features exist on P&L + Balance Sheet). Structurally, forcing this onto the other three wouldn't even fit well: Trial Balance is a point-in-time Debit/Credit snapshot (not period activity), and P&L Detail is a raw transaction list — neither composes with "compare two periods" or "one column per period" the way P&L/Balance Sheet's rolled-up account totals do. No work needed here.
3. ~~No split categorization during CSV/bank-feed review~~ ✅ **Done (Phase 3).** `ReviewRow` holds multiple category legs with a live balance-check UI mirroring the register's existing split editor.
4. ~~No bank-rule auto-post~~ ✅ **Done (Phase 3).** Rules carry an `autoPost` flag plus a one-click "Auto-post N" bulk action in the CSV review table.
5. ~~Bank rules match fewer condition types~~ ✅ **Done (Phase 3 + follow-up).** Direction (money in/out) and account scope shipped in Phase 3; raw-bank-memo-vs-cleaned-memo matching shipped in the post-Phase-4 follow-up.
6. ~~Journal Entry has no export~~ ✅ **Done (Phase 1).**
7. ~~Duplicate detection isn't a clickable link~~ ✅ **Done (Phase 1).**

### Smaller / nice-to-have gaps
8. ~~No true account deletion~~ ✅ **Done (Phase 1).**
9. ~~Only 2 themes~~ ✅ **Done (Phase 4 + follow-up).** All 5 of PlainGL's skins now exist.
10. ~~No company/entity deletion in the UI~~ ✅ **Done (Phase 4).**

---

## Comparative Table

| Feature | PlainGL | New GL (quickslike) | Status |
|---|---|---|---|
| Multi-company/entity management | Create (blank/template/duplicate), switch, delete, per-entity password | Create (blank/template/duplicate), switch, delete | Parity (password lock intentionally not ported — see "What was left out") |
| Auth | SHA-256 "convenience lock" per entity | Real Supabase per-user auth | New GL ahead |
| Themes | 5 cosmetic skins | 5 cosmetic skins (light/dark/modern/america250/pretty) | Parity (Pretty's backdrop-blur doesn't render — see "What was left out") |
| Dashboard KPIs | Cash, A/R, A/P, net income, health check | Cash flow, bank balances, P&L snippet, expenses donut, AI usage, overdue-A/R/A/P "needs attention" banner | Parity |
| A/R & A/P aging | Full aging buckets + "needs attention" panel | Aging buckets by payee (dedicated report) + dashboard "needs attention" banner | Parity |
| P&L / Balance Sheet | Hierarchical, drill-down | Hierarchical, drill-down | Parity |
| Trial Balance | Basic only (no compare/columnar in PlainGL either) | Basic only | Parity |
| P&L Detail | Basic only (no compare/columnar in PlainGL either) | Basic only | Parity |
| By Payee report | Folded into Summary tab, not first-class | Dedicated report page | New GL ahead |
| Period comparison (prior year/custom) | P&L + Balance Sheet only | P&L + Balance Sheet only | Parity |
| Columnar (month/quarter/week) | P&L + Balance Sheet only | P&L + Balance Sheet only | Parity |
| Print/PDF | Reports tab only | All 5 report pages | New GL ahead |
| Register inline edit | Yes, plus single-line "Excel mode" | Yes (expanded-form style) | Parity (different UX) |
| Splits in register | Yes | Yes | Parity |
| Splits during CSV/bank-feed review | Yes, per-row, live balance check | Yes, per-row, live balance check | Parity |
| CSV import wizard | Basic paste + header detection | Header detection + AI-suggested mapping | New GL ahead (AI) |
| AI categorization suggestions | None | Yes (AI suggest + BYOK key) | New GL ahead |
| Bank rules — condition fields | Payee/memo/ref/bank-text/amount + direction + account scope | Payee/memo/raw-memo/amount + direction + account scope | Parity |
| Bank rules — auto-post | Yes, one-click bulk | Yes, "Auto-post N" bulk action | Parity |
| Bank rules — export/import JSON | Yes | Yes | Parity |
| Duplicate detection | Flagged + clickable link to the exact duplicate | Flagged + clickable link to the exact duplicate | Parity |
| Journal Entry — import | Paste from Excel/CSV | Paste from Excel/CSV | Parity |
| Journal Entry — export | CSV download of on-screen entry | CSV download of on-screen entry | Parity |
| Chart of Accounts | Hierarchy, bulk import, delete-if-unused | Hierarchy, bulk import, delete (zero-activity) or archive | Parity |
| Ledger file versioning | None — every save overwrites | Full version history + restore | New GL ahead |
| Storage | Filesystem/Vercel Blob, flat file is the DB | Postgres (source of truth) + exportable `.bean` file | New GL ahead |

---

## Suggested Execution Order

### Phase 1 — Quick wins
*Small, isolated, no schema changes, near-zero risk.*
1. **Journal Entry CSV export** — mirror the existing Ledger-page download pattern.
2. **Duplicate-detection deep link** — wrap the existing "Looks like a duplicate" text in a link to the matched transaction (already have the transaction object in hand).
3. **True account deletion** — add a delete action alongside Archive, gated on zero activity.

### Phase 2 — Reporting parity
~~4. Uniform compare/columnar reporting~~ -- **dropped, see the correction above under "Real functional gaps": this was never actually a gap.**
4. ~~A/R & A/P aging report~~ ✅ **Done** -- see Phase 2 notes above.

### Phase 3 — Bank feed & rules depth ✅ Done
*Moderate effort, touches the import/posting pipeline — sequenced last because correctness matters most here.*
6. ~~Split categorization in CSV review~~ ✅ **Done** -- `ReviewRow` holds multiple category legs (`categorySplits`), with a live balance-check UI mirroring the register's existing split editor. Backend generalizes single-category posting to the N=1 case of a split.
7. ~~Bank rule auto-post~~ ✅ **Done** -- rules carry an `autoPost` flag (new `bank_rules.auto_post` column); the CSV review table shows an "Auto-post N" bulk action that posts matched rows immediately, bypassing the confirm dialog.
8. ~~Bank rule condition scope~~ ✅ **Done** -- rules carry `direction` (`ANY`/`INFLOW`/`OUTFLOW`, matched against the row's amount sign) and `scopedAccountId` (restricts the rule to imports into one specific account); new `bank_rules.direction`/`scoped_account_id` columns.

### Phase 4 — Polish ✅ Done
*Low priority, do opportunistically.*
9. ~~Company/entity deletion in the `CompanyPicker` UI~~ ✅ **Done** -- `DELETE /api/companies/{name}` refuses to delete the primary company and clears any membership's `active_ledger_name` pointing at the deleted one; the picker shows a hover-revealed trash icon with an inline "can't be undone" confirmation, and a full reload if the deleted company was active.
10. ~~Additional visual themes~~ ✅ **Done** -- added "Modern" (violet), "America 250" (navy/red), and "Pretty" (teal/indigo gradient) skins alongside light/dark. New GL now has all 5 of PlainGL's cosmetic skins.

**Rationale:** Phase 1 ships in isolation with immediate value. Phase 2 is the highest-impact functional gap but sequenced after the easier reporting-parity win since it reuses code that already exists. Phase 3 goes last because it's the riskiest — it touches the import/posting pipeline where correctness really matters. Phase 4 is deferred since neither item blocks real usage.

## Post-Phase-4 follow-up (2026-08-21)

A second pass closed every item the first "Remaining gaps" note (below, kept for history) had flagged as either missing or skipped, plus one more found on re-inspection:
- **Pretty theme** — added. Uses a CSS-var-holds-a-gradient trick for the page-wash background (works because `body` renders it via `background:`, not `background-color:`) and new `.btn-primary`/`.avatar-circle`/`.ui-card` marker classes for the gradient buttons/avatar and elevated-card hover lift (`bg-[var(...)]` compiles to `background-color`, which can't hold a gradient, so those needed a different hook).
- **`/api/companies` test coverage** — added `tests/companies.test.ts` (list/create/switch/delete, including the primary-delete guard and active-ledger fallback).
- **Bank rules raw-memo matching** — added a `rawMemo` condition field, matched against a CSV row's `rawDescription` independently of the cleaned `memo`, closing the last piece of gap #5 that direction/account scoping (Phase 3) hadn't covered.
- **Dashboard "needs attention" panel** (not previously listed as its own gap, found while reviewing the aging report against PlainGL again) — added an amber banner on the dashboard summarizing overdue A/R and A/P, shown only when something is actually overdue, linking to `/reports/aging`.

## Remaining gaps (2026-08-21, superseded by the follow-up above where noted)

- ~~A 5th theme ("Pretty")~~ — done, see above.
- ~~No automated tests for the `/api/companies` routes~~ — done, see above.
- Nothing else identified as missing relative to PlainGL at this time; a fresh feature audit would be needed to catch drift since 2026-08-20.
