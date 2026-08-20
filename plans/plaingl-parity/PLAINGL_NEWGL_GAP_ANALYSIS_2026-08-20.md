# PlainGL → New GL Feature Gap Analysis (2026-08-20)

**Status:** Phase 1 (Quick wins) done -- branch `23-issue_plaingl_fetaures_to_implement_dc` (quickslike, newgl-api). Phases 2-4 not started.

**Phase 1 notes:**
- **Journal Entry CSV export** (quickslike `af72fdc`): downloads the on-screen entry as `journal-entry-<date>.csv`, mirroring the Blob-download pattern already used by Bank Rules' export.
- **Duplicate-detection deep link** (quickslike `7d64b86`): CSV review's "Looks like a duplicate" now links straight to the matching transaction in the Register (new `tx` query param, threaded through the same way `account` already was).
- **True account deletion** (quickslike `cc6c25e`, newgl-api `a0d4452`): new `AccountService.deleteAccount` / `DELETE /api/accounts/:id`, rejecting accounts with any posting activity (verified live both ways, plus two new backend tests). Chart of Accounts now has Delete next to Archive.

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
1. **A/R and A/P aging** — PlainGL has Current/1-30/31-60/61-90/90+ aging buckets for both receivables and payables, plus a "needs attention" panel surfacing overdue amounts. New GL has an `ACCOUNTS_RECEIVABLE` category but no aging report or overdue tracking anywhere. **Unchanged from the older audit's known blocker**: no A/P account category exists at all, and transactions have no due-date field — this needs schema work before any UI.
2. ~~Period comparison + columnar reporting isn't uniform.~~ **Correction (2026-08-20, after starting Phase 2): this was wrong, struck from the gap list.** Re-reading the original PlainGL audit closely, its own text says compare/columnar is scoped to "P&L and Balance Sheet only" in PlainGL itself — it was never applied to Trial Balance, P&L Detail, or By Payee there either. New GL already matches PlainGL's actual scope (both features exist on P&L + Balance Sheet). Structurally, forcing this onto the other three wouldn't even fit well: Trial Balance is a point-in-time Debit/Credit snapshot (not period activity), and P&L Detail is a raw transaction list — neither composes with "compare two periods" or "one column per period" the way P&L/Balance Sheet's rolled-up account totals do. No work needed here.
3. **No split categorization during CSV/bank-feed review** — PlainGL lets you split a single imported row into multiple category legs with a live balance check, right in the review grid. New GL's `csv-review-table.tsx` still only allows one category per row. This is the exact item the old backlog called out as "left out of scope on purpose" under items #5/#6 ("CSV import row splitting") — still not built.
4. **No bank-rule auto-post** — PlainGL rules can carry an auto-post flag plus a one-click "Auto-post N" bulk action. New GL's rules only ever *suggest* a category as an override you still accept manually per row.
5. **Bank rules match fewer condition types** — PlainGL rules scope by money-in/money-out direction and by a specific source account, and match against raw bank-memo text separately from the cleaned description. New GL only conditions on payee/memo/amount.
6. **Journal Entry has no export** — PlainGL can download the on-screen entry as CSV. New GL's `journal-entry-modal.tsx` only has paste-in import, no export.
7. **Duplicate detection isn't a clickable link** — PlainGL's "already posted ↗" opens the exact matching transaction in a new tab. New GL just shows "Looks like a duplicate" as plain text.

### Smaller / nice-to-have gaps
8. **No true account deletion** — PlainGL allows deleting a zero-activity account; New GL only supports Archive.
9. **Only 2 themes** (light/dark) vs. PlainGL's 5 cosmetic skins — pure polish, no functional impact.
10. **No company/entity deletion in the UI** — `CompanyPicker` can create/switch but not delete.

---

## Comparative Table

| Feature | PlainGL | New GL (quickslike) | Status |
|---|---|---|---|
| Multi-company/entity management | Create (blank/template/duplicate), switch, delete, per-entity password | Create (blank/template/duplicate), switch | No delete-company UI |
| Auth | SHA-256 "convenience lock" per entity | Real Supabase per-user auth | New GL ahead |
| Themes | 5 cosmetic skins | Light/dark only | Minor gap |
| Dashboard KPIs | Cash, A/R, A/P, net income, health check | Cash flow, bank balances, P&L snippet, expenses donut, AI usage | Different focus, no A/P/A/R |
| A/R & A/P aging | Full aging buckets + "needs attention" panel | None | **Gap** (schema-blocked) |
| P&L / Balance Sheet | Hierarchical, drill-down | Hierarchical, drill-down | Parity |
| Trial Balance | Basic only (no compare/columnar in PlainGL either) | Basic only | Parity |
| P&L Detail | Basic only (no compare/columnar in PlainGL either) | Basic only | Parity |
| By Payee report | Folded into Summary tab, not first-class | Dedicated report page | New GL ahead |
| Period comparison (prior year/custom) | P&L + Balance Sheet only | P&L + Balance Sheet only | Parity |
| Columnar (month/quarter/week) | P&L + Balance Sheet only | P&L + Balance Sheet only | Parity |
| Print/PDF | Reports tab only | All 5 report pages | New GL ahead |
| Register inline edit | Yes, plus single-line "Excel mode" | Yes (expanded-form style) | Parity (different UX) |
| Splits in register | Yes | Yes | Parity |
| Splits during CSV/bank-feed review | Yes, per-row, live balance check | One category per row only | **Gap** |
| CSV import wizard | Basic paste + header detection | Header detection + AI-suggested mapping | New GL ahead (AI) |
| AI categorization suggestions | None | Yes (AI suggest + BYOK key) | New GL ahead |
| Bank rules — condition fields | Payee/memo/ref/bank-text/amount + direction + account scope | Payee/memo/amount only | **Gap** |
| Bank rules — auto-post | Yes, one-click bulk | No — always manual review | **Gap** |
| Bank rules — export/import JSON | Yes | Yes | Parity |
| Duplicate detection | Flagged + clickable link to the exact duplicate | Flagged text only, no link | **Gap** |
| Journal Entry — import | Paste from Excel/CSV | Paste from Excel/CSV | Parity |
| Journal Entry — export | CSV download of on-screen entry | None | **Gap** |
| Chart of Accounts | Hierarchy, bulk import, delete-if-unused | Hierarchy, bulk import, archive only | **Gap** |
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
4. **A/R & A/P aging report** — the biggest real remaining gap in this phase. Data model first: add an `ACCOUNTS_PAYABLE` account category and an optional due-date field on transactions (falling back to the transaction date when unset, matching PlainGL), then build the aging report itself.

### Phase 3 — Bank feed & rules depth
*Moderate effort, touches the import/posting pipeline — sequenced last because correctness matters most here.*
6. **Split categorization in CSV review** — extend `ReviewRow` to hold multiple category legs instead of one, with a live balance-check UI like the register's existing split editor.
7. **Bank rule auto-post** — add an `autoPost` flag to rules plus a bulk "Auto-post N" action.
8. **Bank rule condition scope** — add direction (money in/out) and source-account scoping to rule conditions.

### Phase 4 — Polish
*Low priority, do opportunistically.*
9. Company/entity deletion in the `CompanyPicker` UI (needs careful confirmation UX given data-loss risk).
10. Additional visual themes.

**Rationale:** Phase 1 ships in isolation with immediate value. Phase 2 is the highest-impact functional gap but sequenced after the easier reporting-parity win since it reuses code that already exists. Phase 3 goes last because it's the riskiest — it touches the import/posting pipeline where correctness really matters. Phase 4 is deferred since neither item blocks real usage.
