# UI Design System & Apps Navigation — Implementation Plan

**Status:** Stage 5 in progress -- Groups A (Register cluster) and B (CSV import flow) done (quickslike commits `20deea4`, `d9afd40`, `ec57923`, branch `21-issue_ui_fixes_and_updates_dc`). Groups C-D not started.

**Stage 5 Group B notes:** found and fixed two real unstyled-element bugs of the same class as Stage 1's Button fix -- `csv-mapping-step.tsx`'s 3 native `<select>`s referenced the dead `input-field` class (no CSS since Stage 1 baked that styling directly into components) and `payee-side-modal.tsx`'s header "Close" button referenced the dead `.button`/`.secondary` classes (no CSS since Stage 1 removed the `.tw-override`-scoped button rules). Both now render through `ui/Select` and `ui/Button`. `payee-side-modal.tsx`'s local `Field`/`SelectField` helpers now thin-wrap `InputField`/`Select` instead of duplicating label markup, its two checkboxes move to `ui/Checkbox`, and its `.tw-override`/`.payee-modal-select` CSS is deleted outright (fully migrated, not deferred). `csv-review-table.tsx`'s sign-convention radios move to `ui/RadioGroup` -- literally the one call site `RadioGroup`'s own code comment names as its reason for existing -- plus its checkboxes to `ui/Checkbox` and delete-row button to `IconButton`. `bulk-paste-import.tsx`'s raw textarea and row checkbox move to `ui/Textarea`/`ui/Checkbox`. `NATIVE_SELECT_CLASS` and `PAYEE_MODAL_SELECT_CLASS` are both fully retired per the plan. Verified live (CSV mapping selects, payee modal, bulk paste import) plus a clean `tsc --noEmit` and `next build`.

**Stage 5 Group A notes:** `add-transaction-form.tsx` and `edit-transaction-form.tsx` were already fully migrated (Button/InputField/SelectField) from earlier stages -- no changes needed. `register-table.tsx`'s icon-only toolbar (Print, Export, Import, Journal Entry, Settings) now uses `IconButton` for visual consistency, per the plan's note that the toolbar's structure stays but its icon buttons migrate; "Manage .bean file" stays a direct `Link` as planned. `journal-entry-modal.tsx`'s close button moved to `IconButton` and its paste-from-CSV textarea moved to the shared `Textarea` component. `bank-rules-page.tsx`'s manually-wrapped `<label>`/`<p>` field labels were replaced with `InputField`/`Select`'s own `label` prop, matching Chart of Accounts' pattern. The dense, fixed-column register grid itself (`RegisterTableColumnGroup`, `header-table`/`content-table`/`action-bar` `.tw-override` classes, the raw per-row `<table>` markup) was deliberately left as raw HTML rather than forced through `Table.*` primitives -- its exact shared pixel-width columns across multiple separate `<table>` elements make it too high-risk to re-platform for no visual gain, consistent with the plan calling this file "highest-risk, done last." Verified live (Register page toolbar, Journal Entry modal, Bank Rules form) plus a clean `tsc --noEmit` and `next build`.

**Stage 4 notes:** wired real `useToast()` success/error toasts into the two screens migrated in earlier stages -- Chart of Accounts and Bank Rules -- replacing every silent-refresh-on-success and inline `text-red-600` error `<p>` with a toast: account create/archive/bulk-import, rule create/enable-disable/delete/export/import. `loadError`/`loading` states (initial page load, not an action result) were deliberately left as inline text -- toasts are for one-shot action feedback, not persistent page state. Ledger (`/all-apps/ledger`) was left for Stage 5's full sweep since it wasn't touched in Stages 2-3 and hasn't been migrated to the `ui/` component set yet. Verified live: create-account and disable-rule toasts both confirmed rendering with correct copy in the browser, plus a clean `tsc --noEmit` and `next build` (run under Node 20 via nvm -- this machine's default `node` is 18, which Next.js 16 rejects).

**Layout-density revision (second round of feedback, with QBO screenshots):** subpages (Settings, All Apps, and everything under them), Home, and the Reports index were all being shrunk into a narrow centered column (`mx-auto max-w-3xl`/`max-w-6xl`) with wasted space on either side -- QBO's own screens fill the space next to the sidebar instead. Settings/All-Apps layouts and Home now use flat `p-5` (20px) padding with no centering wrapper, so Chart of Accounts' table etc. stretch full-width. The Reports index was rebuilt from a card grid into QBO's own flat-list style (name + trailing icon, thin dividers) on the same full-width shell.

**Stage 3 notes:** built richer than the original flat-pill sketch in Part 3, per user-provided QBO screenshots of the actual "All apps" menu -- implemented as a real two-level hover flyout (category list + nested sub-items panel), matching QBO's interaction exactly, still with zero locked/"coming soon" placeholders.

**Stage 3 revision (user feedback after first pass):** the initial version folded AI/Billing/Organization into the same unified list as Chart of Accounts/Bank Rules/Ledger and made "All apps" a click-to-toggle rail button. Corrected per explicit feedback: Settings is restored as its own bottom-pinned rail icon (`/settings/ai` default, holding AI/Billing/Organization only); "All apps" moved to the top-level rail group and now supports both interactions QBO itself has -- hover (350ms intent delay) opens the flyout, click navigates to a real `/all-apps` page using the same accordion-sidebar pattern as Settings, defaulting to its first item. Chart of Accounts/Bank Rules/Ledger physically moved from `/settings/*` to `/all-apps/*` (their conceptual home now), and Register was dropped from the Accounting category since it already has its own top-level rail icon -- QBO doesn't repeat Bank Transactions in both places either. `src/constants/apps.ts` split into `ALL_APPS_CATEGORIES` (Accounting only) and `SETTINGS_GROUPS` (Account: AI/Billing/Organization), since items can no longer be routed to the correct nav surface by URL prefix alone.

**Stage 1 notes:** built exactly as planned -- see Part 1's component table, all present in `src/components/ui/`. The `.button` bug from Part 2 is fixed (verified live: `/login`'s "Sign in" button rendered with zero styling before, renders correctly now); the now-redundant `.tw-override .button`/`.input-field`/`.selector-field`/`.selector-option*` CSS blocks were removed in the same commit rather than deferred, since the components no longer emit those class names at all (nothing left to conflict). `.tw-override` rules still needed by not-yet-migrated screens (register cluster, payee modal, page-chrome) are untouched, per plan. `/dev/ui-kit` is live and confirmed to return a real 404 in a production build (`next build` + `next start`, checked via curl) while working normally in dev.

**Stage 2 notes:** Chart of Accounts (`chart-of-accounts-page.tsx`) migrated to `Card`/`Select`/`NumberField`/`Textarea`/`InputField`'s built-in label prop, and the account hierarchy tree (indentation, collapse/expand, rollup balances, register links, Archive) now renders through `Table.*` primitives with each root category as a spanning header row inside one continuous table. No behavior changes -- verified live end-to-end (create, archive, bulk import, collapse/expand) in both themes, plus a clean `next build`. This is the template the rest of Stage 5's screens will follow.

**Scope:** `quickslike` only. Modeled after QuickBooks Online's design language (screenshots provided by the user: Receipts, Reconcile, Chart of accounts, Bank transactions), applied to this app's own real sections — not a port of QBO's product lineup or visual identity, just its component discipline and its "Apps" navigation pattern.

**Two decisions confirmed with the user before finalizing this plan:**
- The new Apps menu shows **only real, working sections** — no locked/"coming soon" placeholders like QBO's Payroll/Inventory/Lending rows.
- The toast/notification system is **hand-rolled**, not a library — matches this codebase's current zero-UI-dependency pattern (only `lucide-react` beyond framework/data deps).

---

## Context

The UI has grown feature-by-feature over many sessions: every screen hand-builds its own inputs, cards, and tables instead of sharing components, and navigation is duplicated across three places that don't know about each other (the left icon rail, the Settings sidebar, and the home dashboard's pill row). This plan brings the UI in line with QuickBooks Online's design language on two fronts:

1. A real shared component library ("design system") — text/number fields, select, checkbox, radio, textarea, buttons, cards, tables, toasts — so screens stop reinventing the same bordered box and error `<p>` tag.
2. A QBO-style "Apps" entry in the main nav: one item that opens a categorized list of the app's sections, replacing the three overlapping nav lists with one source of truth.

Every screen is reviewed against the new system and moved if it makes more sense elsewhere. The work is sequenced into shippable stages, not one large change — the user explicitly asked for this to not be an unreviewable mega-PR.

---

## Current state (confirmed via full codebase audit)

**Components:**
- `src/components/ui/` has only `Button`, `InputField`, `Tooltip` — everything else (select, checkbox, radio, textarea, card, table, toast, icon-button, badge) is either missing entirely or duplicated ad hoc across the app.
- `SelectField` (`src/components/bank-register/select-field.tsx`) is a fully-built combobox already used from ~6 unrelated features — the best candidate to promote into `ui/`.
- 3 independently-styled native `<select>` implementations exist with copy-pasted class strings (`company-picker.tsx`, `csv-mapping-step.tsx`'s `NATIVE_SELECT_CLASS`, `payee-side-modal.tsx`'s `PAYEE_MODAL_SELECT_CLASS`).
- 5 raw checkboxes, 2 raw radios, 3 ad-hoc textareas — no shared components for any of them.
- `SettingsCard` exists but is used in only ~4 files; ~30 files hand-build the same bordered-panel look at inconsistent radius/padding (`dashboard-metrics.tsx` alone has 5+ inline instances).
- 12 files hand-roll `<table>` markup; zero shared table component anywhere, including the most complex one (`register-table.tsx`).
- No toast/notification system exists at all — every error is an inline `text-red-600` `<p>`, and there's no success-feedback pattern whatsoever (successful actions just silently refresh data).

**Design tokens:**
- `tailwind.config.ts` has a `theme.extend.colors` block (`surface.*`, `text.*`) mapping to the CSS vars — confirmed **zero real usages** anywhere in `src/`. Dead code.
- `src/styles/tailwind-overrides.css` defines a comprehensive CSS custom-property token system (colors, radius, typography, motion), themed via `.dark` — this part is solid and stays as-is.

**Critical bug found during audit (see "`.tw-override` audit" below for full detail):** `.button` has **no styling at all outside a `.tw-override` ancestor**. Verified live — on `/login`, the "Sign in" button's computed style is `background: transparent, border: 0, border-radius: 0, padding: 0`. Only 7 files in the entire app wrap content in `.tw-override`; every other page (Login, Signup, Home, every `/settings/*` page) has been relying on an effectively-unstyled `Button`. This means Stage 1 is a visible bug fix for Login/Signup, not just a refactor.

**Navigation:**
- `SideNav` — 4 items (Home/Register/Reports/Settings), 73px icon rail.
- `SETTINGS_NAV_GROUPS` (`src/app/(app)/settings/layout.tsx`) — 2 groups (Books/Account), 6 items.
- `NAV_PILLS`/`CREATE_ACTIONS` (`src/components/home/home-greeting-screen.tsx`) — 8+4 items, home-page-scoped only.
- These three lists independently encode largely the same section list with no single source of truth. `REPORT_NAV_ITEMS` (`src/constants/reports.ts`) is the one nav list that's already properly factored out and stays that way.
- Full route tree (no dynamic routes): `/`, `/register`, `/reports` (+5 report pages), `/settings/{ai,bank-rules,billing,chart-of-accounts,ledger,organization}`, `/login`, `/signup`.

---

## Part 1 — Component library

Every component below replaces something that already exists 2+ times in the codebase. Nothing speculative.

| Component | File | Replaces |
|---|---|---|
| `Button` (extend) | `ui/button.tsx` | Bakes real default styling directly into the component (fixes the live bug above). Adds `ghost`, `destructive` variants; `size`; `loading` state. Absorbs ad-hoc text-only action buttons and manual disabled+spinner patterns. |
| `IconButton` (new) | `ui/icon-button.tsx` | Register toolbar's Print/Export/Import/Filter/Settings icons, modal close (X) buttons, table row-action icons — currently each hand-styled per file. |
| `InputField` (extend, keep name) | `ui/input-field.tsx` | Bakes real default border/background/sizing directly into the component. Adds `label`/`error`/`hint` props, folding in ~25 files' inline `<label>` + manual error `<p>` markup. |
| `NumberField` (new, wraps InputField) | `ui/number-field.tsx` | Right-aligned/`$`-prefixed amount inputs currently reimplemented per file (register, journal-entry, reports, add/edit-transaction-form). |
| `Select` (promote) | `ui/select.tsx` | `SelectField` moved as-is, chevron fixed to use lucide `ChevronDown` instead of a duplicate inline SVG, default sizing/option-list styling baked in directly. Replaces its 6 existing consumers **plus** the 3 native-`<select>` reimplementations, retiring `NATIVE_SELECT_CLASS` and `PAYEE_MODAL_SELECT_CLASS` outright. |
| `Checkbox` (new) | `ui/checkbox.tsx` | 5 raw checkbox call sites (table row/select-all checkboxes). Supports `indeterminate` for select-all headers. |
| `RadioGroup`/`Radio` (new) | `ui/radio-group.tsx` | The 2 sign-convention radio call sites in CSV import. |
| `Textarea` (new) | `ui/textarea.tsx` | 3 ad-hoc textareas (bulk-paste-import, chart-of-accounts description, journal-entry memo), same label/error/hint contract as InputField. |
| `Card` (generalize) | `ui/card.tsx` | `SettingsCard` becomes a thin re-export, then gets deleted once its 4 call sites move to `Card` directly (Stage 5). Flagship migration target is `dashboard-metrics.tsx`'s 5+ inline instances. |
| `Table.*` compound primitives | `ui/table.tsx` | `Table.Root/Head/HeaderCell/Body/Row/Cell` — opt-in styled wrappers, **not** a data-driven `<Table columns rows>` (see rationale below). Targets all 12 hand-rolled tables. |
| `Badge` (new) | `ui/badge.tsx` | No current call site, but the `--color-highlight-badge-*` tokens already exist unused — needed for status pills (e.g. reconcile/review states) as screens migrate. |
| `Toast` system (new) | `ui/toast/toast-provider.tsx`, `toast-context.tsx`, `toast-viewport.tsx` | Nothing exists today. `useToast().toast({variant, title, description})`, hand-rolled, wired into the root `(app)` layout. |

**Why compound table primitives, not a generic `<Table columns rows>`:** `register-table.tsx`'s column-group sub-components and inline-editable cells don't map cleanly onto a generic `columns` config without either an escape-hatch-heavy API or losing the abstraction's value. Primitives give all 12 tables consistent borders/headers/dividers immediately, with call sites keeping their own `.map()` loops — smaller lift, easier migration, especially for the highest-risk file.

---

## Part 2 — the `.tw-override` problem (full audit)

**Resolution:** the new `ui/` components become the single sizing source of truth and never read `.tw-override` ancestor state. All 61 occurrences of `.tw-override` in `tailwind-overrides.css` were individually classified:

| Target | Classification | Disposition |
|---|---|---|
| `.button` (all variants/states) | **The single highest-impact finding** — the *only* styling `Button` has anywhere, and it's ancestor-gated | Baked directly into the new `Button` component as its unconditional default; `.tw-override .button*` block deleted once `Button` no longer depends on it |
| `.input-field` | Same issue, milder (component has some bare Tailwind utilities already, but no border/intentional color without the ancestor) | Baked directly into `InputField`'s default styling |
| `.selector-field` (+ a redundant duplicate sub-rule) | Legitimate compact size variant | Becomes `Select`'s default sizing; the duplicate rule is deleted outright as dead weight |
| `.selector-option`, `.selector-option-selected*` | This *is* SelectField's dropdown-option look | Baked into the new `Select` component's option-list styling |
| `.payee-modal-select`, `.payee-side-modal` (text color) | Component-specific, soon-dead | Retired once `payee-side-modal.tsx` migrates to `Select` (Stage 5) |
| Page-shell classes (`.main`, `.header`, `.header-reports`, `.page-title`, `.balance-label`, `.balance-amount`, `.page-content`) | Page-specific chrome, not a sizing conflict — already working correctly on the 7 pages using `.tw-override` today | Deferred to Stage 5, migrated screen-by-screen |
| Register-specific classes (`.register-table`, `.form-popover`, `.dgrid-hider-menu` + children, `.action-bar`, `.header-table` + children, `.content-table`, `.actions-quickadd*`, `.no-transactions-data`, `.form-control`, `.form-transaction-row*`) | Confirmed **live** (grepped against actual JSX, not assumed dead despite legacy-looking naming) — all tightly coupled to `register-table.tsx`/`register-table-header.tsx` | Fold into `Table.*`/`IconButton` when the register cluster migrates (Stage 5 Group A, done last — highest complexity) |

Net effect for Stage 1: `Button`, `InputField`, and `Select` get their real default look baked directly into the component, with zero ancestor-class dependency — resolving the two highest-severity items outright. Everything register-specific correctly defers to Stage 5 rather than being touched piecemeal.

**Dead Tailwind config:** `theme.extend.colors` in `tailwind.config.ts` is deleted in Stage 1 rather than wired up — it would just be a second naming vocabulary for the same CSS vars with no forcing function to actually get adopted (confirmed zero usage today, and the arbitrary-value `bg-[var(--color-...)]` syntax already wins everywhere in practice).

---

## Part 3 — "Apps" navigation restructure

New canonical source of truth, `src/constants/apps.ts`:

```ts
type AppNavItem = { label: string; href: string; icon: LucideIcon };
type AppCategory = { id: string; label: string; icon: LucideIcon; items: AppNavItem[]; href?: string };

export const APP_CATEGORIES: AppCategory[] = [
  { id: "accounting", label: "Accounting", icon: Landmark, items: [
      { label: "Register", href: "/register", icon: Wallet },
      { label: "Chart of Accounts", href: "/settings/chart-of-accounts", icon: Building2 },
      { label: "Bank Rules", href: "/settings/bank-rules", icon: Landmark },
      { label: "Ledger", href: "/settings/ledger", icon: Database }
  ]},
  { id: "reports", label: "Reports", icon: BookOpen, href: "/reports", items: [] }, // REPORT_NAV_ITEMS stays the source of truth for the 5 report types
  { id: "ai", label: "AI", icon: Sparkles, items: [{ label: "AI Settings", href: "/settings/ai", icon: Sparkles }] },
  { id: "account", label: "Account", icon: Users, items: [
      { label: "Billing", href: "/settings/billing", icon: CreditCard },
      { label: "Organization", href: "/settings/organization", icon: Users }
  ]}
];
```

All icon choices above are reused exactly from the current Settings sidebar / home pills (confirmed no conflicts between the two existing surfaces during the audit) — nothing re-picked.

- **`SideNav`**: add a 5th item, "Apps" (grid icon), between Reports and the bottom-pinned Settings item. Clicking opens a flyout (new `src/components/layout/apps-flyout.tsx`), reusing the same expand/collapse interaction already proven in the current Settings sidebar.
- **Settings sidebar**: absorbed, not kept independent. `src/app/(app)/settings/layout.tsx` becomes a *view* that filters `APP_CATEGORIES` down to `/settings/*` items, rather than owning its own `SETTINGS_NAV_GROUPS` array.
- **Home dashboard**: `NAV_PILLS` becomes `APP_CATEGORIES.flatMap(c => c.items)` instead of its own duplicate array. `CREATE_ACTIONS` stays independent — it's a different kind of list (actions, not destinations).
- **Register's internal toolbar**: no structural change; "Manage .bean file" stays a direct link. Its icon buttons migrate to `IconButton` in Stage 5's register-cluster group for visual consistency only.
- **TopHeader**: no structural change (no search/breadcrumb/notifications requested); `CompanyPicker`'s native selects migrate to `Select` when that file is touched.

---

## Part 4 — Staged sequence

1. **Stage 0 — Audit.** ✅ Done — see Part 2 above.
2. **Stage 1 — Core `ui/` primitives, zero call-site changes.** Build/promote every component in Part 1's table. Delete dead Tailwind config. Add a permanent `/dev/ui-kit` route rendering every component/variant for manual visual QA.
3. **Stage 2 — First vertical slice: Settings → Chart of Accounts.** Chosen because it already touches Select, a Textarea, a data table, and card-style panels — exercises most new primitives in one self-contained screen without the highest-risk file. This PR is the template the user reviews before repeating the pattern elsewhere.
4. **Stage 3 — Navigation restructure.** `apps.ts`, `apps-flyout.tsx`, `SideNav` update, Settings-layout and home-dashboard refactors to read from `APP_CATEGORIES`. Sequenced after Stage 2 (flyout built with the new primitives) and before the full sweep (no screen migrated twice around a moving nav target).
5. **Stage 4 — Toast system + feedback wiring.** Build `ToastProvider`/`useToast`, wire into the `(app)` root layout, retrofit the screens already touched in Stages 2–3 with real success/error toasts in place of silent refresh / inline red text.
6. **Stage 5 — Full remaining screen sweep**, grouped by feature area:
   - **Group A — Register cluster** (`register-table.tsx`, `journal-entry-modal`, `add/edit-transaction-form`, `bank-rules-page`): highest complexity, done last within this stage.
   - **Group B — CSV import flow** (`bulk-paste-import`, `csv-review-table`, `csv-mapping-step`, `payee-side-modal`): retires the two dead native-select CSS constants.
   - **Group C — Reports** (5 report tables, reports index, drill-down-panel): mostly mechanical `Table.*` adoption.
   - **Group D — Home dashboard & auth** (`dashboard-metrics.tsx`'s inline cards, login/signup/auth layout — this group fixes the live Login/Signup button bug for good, though Stage 1 already fixes it structurally).
   - Final cleanup commit: delete now-empty `.tw-override` CSS, delete `SettingsCard`.

Each stage ships as its own commit (or small set of commits), reviewed and confirmed working in the browser before the next stage starts — never one unreviewable mega-change.

---

## Smaller decisions made without a separate round of questions

- Keep the `InputField` name rather than renaming to `TextField` — avoids a mechanical rename across ~25 files for a naming preference only.
- Keep the `/dev/ui-kit` QA route permanently rather than deleting it — cheap, useful as the component set evolves.
- Delete `SettingsCard` outright once superseded by `Card` (only 4 usages) rather than keeping it as an alias.

---

## Critical files

- `src/components/ui/` — new home for all primitives (`button.tsx`, `input-field.tsx`, `number-field.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `textarea.tsx`, `card.tsx`, `table.tsx`, `badge.tsx`, `icon-button.tsx`, `toast/`)
- `src/components/bank-register/select-field.tsx` — source being promoted to `ui/select.tsx`
- `src/styles/tailwind-overrides.css` — `.tw-override` cleanup per Part 2
- `tailwind.config.ts` — remove dead `theme.extend.colors`
- `src/constants/apps.ts` — new canonical nav source of truth (new file)
- `src/components/layout/side-nav.tsx`, `src/components/layout/apps-flyout.tsx` (new), `src/app/(app)/settings/layout.tsx`, `src/components/home/home-greeting-screen.tsx` — the nav surfaces being unified
- `src/components/settings/chart-of-accounts-page.tsx` — Stage 2 template migration
- `src/components/bank-register/register-table.tsx` — highest-risk migration target, sequenced last in Stage 5

---

## Verification plan, per stage

Each stage is checked in the browser before moving to the next (dev server, screenshot + console-error check, both light and dark mode):

- **Stage 1**: load `/dev/ui-kit`, screenshot every component/variant in both themes, confirm no console errors. Confirm `/login` and `/signup` buttons now render correctly (the bug fix).
- **Stage 2**: load `/settings/chart-of-accounts`, verify visual parity/improvement (add account, bulk import, hierarchy tree, archive), confirm `.tw-override` removal didn't change intended sizing.
- **Stage 3**: click through the new Apps flyout to every destination, confirm Settings sidebar and home pills still show the same destinations post-refactor, confirm no broken links.
- **Stage 4**: trigger a success path (e.g. create an account) and an error path (e.g. duplicate account name) on a migrated screen, confirm toast appears/dismisses correctly in both themes.
- **Stage 5**: per group, spot-check the 2-3 most complex screens plus a `tsc --noEmit` and `next build` pass, matching the verification pattern used for every prior feature this project.
