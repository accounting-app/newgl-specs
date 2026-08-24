# In-app .bean File Editor & Linter

**Status:** Planning -- not started.

## Context

The Ledger settings page (`quickslike` `src/app/(app)/all-apps/ledger/page.tsx`) already lets a user download the raw `.bean` file, upload a replacement, copy it to the clipboard, and restore an earlier version. What it doesn't offer is editing the file *in the browser*: today's workflow is download -> edit in an external text editor -> re-upload, with the upload endpoint's validation as the only feedback loop, and that feedback is a single error string, not inline diagnostics.

The user wants a real online editor for the `.bean` file, with syntax highlighting and a linter that flags syntax and content errors as you type -- essentially bringing an IDE-lite editing experience for Beancount directly into Settings, instead of round-tripping through an external editor.

## Current state (confirmed via codebase research)

- **No code-editor library exists yet.** This app has been deliberately dependency-light on the frontend (per `UI_DESIGN_SYSTEM_PLAN.md`, the only non-framework/non-data UI dependency is `lucide-react`). A real syntax-highlighting editor needs a new dependency -- this plan is the first place that tradeoff gets made.
- **The backend's Beancount parser is intentionally lenient, not a validator.** `newgl-api/src/infra/beancount/parser.ts`'s `parseBeancount` is a hand-rolled line scanner that "never throws" (its own comment) -- anything it doesn't recognize is passed through untouched into `preamble`/`epilogue`. Upload validation (`POST /api/ledgers/{name}/upload`) layers one extra check on top, `isPlausibleBeancountDocument`, which only confirms the file has an `option "title"` line. Neither catches real content errors: unbalanced transactions, postings to an account that was never `open`ed, duplicate opens, currency-constraint violations, malformed dates/amounts, etc.
- **The real Beancount validator already exists in this codebase, but only as an optional dev/test tool.** `newgl-api/tests/bean-check.test.ts` shells out to the Python `beancount` package's `bean-check` CLI, skipping the test entirely if it isn't on `PATH`. It is not installed in the production Docker image (`newgl-api/Dockerfile` only installs `python-is-python3` at build time, to compile native Bun modules -- no `pip install beancount`, and Python isn't even present in the final runtime stage). Wiring real semantic validation into the app would mean adding that dependency to production, a real infra change, not a code-only one.
- **Save-as-new-version already works and needs no new backend endpoint.** `POST /api/ledgers/{name}/upload` replaces the whole file and validates before persisting (400 on failure, nothing written); `GET /api/ledgers/{name}/versions` and `POST /api/ledgers/{name}/versions/{version}/restore` already give full history + rollback. The editor's "Save" action can call the exact same upload endpoint the file-upload button already uses.
- **`source: "app"` already exists as a version-history label ("Edited in app") but nothing sets it today** -- it's written by the *structured* domain write path (register entries, journal entries, account CRUD), not by raw content replacement. Saving from the new raw-text editor through the existing upload endpoint will record as `source: "upload"` ("Uploaded"), which is technically accurate (same whole-file-replace mechanism) but may read oddly to a user who typed in the browser rather than picking a file. See "Smaller decisions" below.
- **Where this lives:** the Ledger page is reached via the "All apps" flyout -> Accounting -> Ledger (`quickslike/src/constants/apps.ts`), already a single nav entry pointing at `/all-apps/ledger`. No navigation changes are needed for this plan.

## Decisions confirmed with the user before this plan was written

- **Linter scope: syntax only**, not full Beancount semantics. Catches malformed lines (bad dates, invalid directive keywords, malformed amounts/currencies, unclosed metadata blocks, mismatched cost/price braces) but does **not** check transaction balancing, undeclared accounts, or other cross-reference/semantic rules real `bean-check` enforces. This keeps the linter fully client-side and avoids the production-infra change of shipping Python + `beancount` in the Docker image. Full semantic linting is an explicit non-goal for this iteration -- see "Future work."
- **Live-as-you-type linting**, not just on-save. This is what makes "syntax only" the right scope for now: a client-side linter can give instant feedback; a Python-`bean-check`-backed one could only ever be on-save (a network round trip per keystroke isn't viable).
- **Placement: a new "Edit" tab on the existing Ledger page**, alongside the current file-management card and version history, not a separate settings page. Saving from the editor is the same "replace the whole file, validate first, persist as a new version" action the upload button already performs.
- **Editor: CodeMirror 6.** Lighter than Monaco (~150-300KB vs. 2-5MB depending on which CodeMirror packages are pulled in), and CodeMirror's extension model (`@codemirror/lint` for inline diagnostics + gutter markers, a custom `StreamLanguage` for tokenizing/highlighting) is a closer fit for "one custom domain-specific language, with live diagnostics" than Monaco's much heavier IDE feature set.

## Approach

### 1. Beancount tokenizer + syntax linter (new, client-side, `quickslike`)

A pure-TypeScript module, no DOM/React dependency, so it's usable both by CodeMirror's highlighting layer and its lint layer without duplicating grammar knowledge. Two responsibilities:

- **Tokenizer** (`tokenizeLine` or similar): given one line of source, classify it -- directive keyword, date, account name, quoted string, amount, currency, comment, metadata key, tag/link, comment-only, blank -- for CodeMirror's `StreamLanguage` to color. Multi-line constructs (a transaction's indented postings/metadata, a multi-line string is not a thing in Beancount so this is simpler than most languages) are handled by tracking "am I inside a transaction's posting block" state between lines, the same way the backend's `parseBeancount` already does with its `index`-walking loop -- this can lean on that existing logic's *shape* (not its code, since one runs in the browser and one in Bun) as a reference for how Beancount's line grammar nests.
- **Linter** (`lintBeancountSource(text) -> Diagnostic[]`): re-walks the tokenized lines and reports syntax errors with line/column spans, for rules including at minimum:
  - Malformed or missing date on a directive line (`YYYY-MM-DD` strict shape)
  - Unknown/misspelled directive keyword
  - Account name not matching `Type:Segment:Segment...` shape (segments capitalized, colon-separated) -- per the cheat sheet's `Assets:US:BofA:Checking` example
  - Amount not matching `<number> <CURRENCY>` (currency must be all-caps per the cheat sheet's commodity rules)
  - Unclosed or mismatched quotes in narration/payee/tag strings
  - Mismatched cost/price brace pairs -- `{...}` vs `{{...}}`, unclosed `{`/`(` etc.
  - Metadata lines (`key: "value"` or `key: value`) that aren't indented under a directive, or malformed key syntax
  - Malformed `#tag` / `^link` tokens
  - Orphaned posting/metadata lines (indented content with no preceding directive line to attach to)

  Explicitly **not** checked (semantic/cross-reference rules, deferred -- see "Future work"): does every posted-to account have a matching `open`; do a transaction's postings sum to zero; are declared currency constraints on an account respected; duplicate `open`/`close` directives for the same account.

### 2. CodeMirror integration (`quickslike`)

- New dependency: `codemirror` (the CM6 meta-package) or the individual `@codemirror/state`/`@codemirror/view`/`@codemirror/lint`/`@codemirror/language` packages plus `@codemirror/theme-one-dark` (or a custom theme matching this app's existing light/dark/modern/america250/pretty tokens -- see "Smaller decisions").
- New `src/components/bean-editor/bean-editor.tsx`: wraps a CodeMirror `EditorView` in a React component (ref-based mount/teardown, controlled `value`/`onChange` props matching this app's existing form-component conventions), wires the custom `StreamLanguage` for highlighting and a `linter()` extension backed by `lintBeancountSource`.
- Before hand-rolling the `StreamLanguage` from scratch, check whether a usable community CodeMirror Beancount mode already exists to adapt (Fava, the popular open-source Beancount web UI, ships its own CodeMirror-based `.bean` editor with syntax highlighting -- worth a quick license/dependency-fit check before committing to a fully from-scratch grammar).

### 3. Ledger page "Edit" tab (`quickslike`)

- `src/app/(app)/all-apps/ledger/page.tsx` gains a small tab switcher (matching the existing `SelectField`/tab patterns elsewhere in the app, e.g. the reports report-type switcher) with two tabs: **Manage file** (today's download/upload/copy/version-history card, unchanged) and **Edit** (new).
- **Edit tab**: on mount, fetches the current content via the existing download endpoint (`GET /api/ledgers/{name}/download`, no date-range params -- always the full file for editing) and renders it in the `BeanEditor`. A gutter/status area surfaces live lint diagnostic counts ("3 issues" style, matching this app's toast/badge visual language). A **Save** button:
  - Disabled while there are outstanding lint errors (not just warnings, if the rule set ever grows a warning tier) -- consistent with "uploads are validated before anything is saved."
  - On click, calls the same `POST /api/ledgers/{name}/upload` the file-upload button already uses, with the editor's current text as the body.
  - On the (should-be-rare, since the client linter already caught syntax issues) case the server's own plausibility check still rejects it, surfaces that 400 response's message the same way the existing upload flow does today.
  - On success, shows the same version-bump confirmation the upload flow shows, and refreshes the version-history list (shared state with the Manage-file tab, so switching tabs shows the new version immediately).
- Unsaved-changes guard: warn before navigating away or switching tabs with unsaved edits (a `beforeunload` listener plus an in-app confirm), since a full `.bean` file can be large enough that losing an edit session would be genuinely costly.

### Smaller decisions made without re-asking (low-stakes, reversible if the user disagrees after seeing the result)

- **Version-history label for editor saves**: reuse `source: "upload"` ("Uploaded") as-is rather than adding a new `source: "edited"` value (which would need a schema change in both repos' `bankRuleSchema`-style enums, a migration-free but still cross-cutting change for a cosmetic label). If this reads confusingly in practice once shipped, it's a small follow-up to add a fourth `source` value.
- **CodeMirror theme**: build a small custom CodeMirror theme mapping to this app's existing `--color-*` CSS variables (same var-driven approach the 5 app themes already use) rather than pulling in a prebuilt CodeMirror theme package, so the editor automatically matches whichever of the 5 app themes (light/dark/modern/america250/pretty) is active.
- **Full-file only, no date-range editing**: unlike download (which supports `from`/`to` query params for a scoped export), the editor always loads and saves the entire file -- partial-file editing would risk silently dropping content outside the selected range on save, which is a correctness risk not worth taking for an editing feature.

## Open questions for a future iteration (not blocking this plan)

- Should large ledgers (multi-thousand-line `.bean` files) get any special handling (virtualized rendering, lazy diagnostics) or is CodeMirror 6's native performance sufficient at this app's realistic file sizes? Worth a quick check against the largest real tenant ledger before implementation, not worth speculating about now.
- Should the linter eventually grow a "warnings" tier (stylistic issues that don't block Save) distinct from "errors" (that do)? Not needed for the syntax-only v1 -- everything this linter catches is a real syntax error.

## Future work (explicitly out of scope for this plan)

- **Semantic/content linting** (transaction balancing, undeclared-account detection, currency-constraint enforcement, duplicate-open detection) -- the "real bean-check" tier the user's request gestures at beyond syntax. Two paths, neither attempted here:
  1. Add Python + the `beancount` pip package to the production Docker image and add a new `POST /api/ledgers/{name}/lint` (or similar) endpoint that shells out to `bean-check` on demand (e.g. debounced, on-pause-in-typing, or on-save) -- real infra work, and inherently can't be "live as you type" the way the syntax linter is.
  2. Reimplement Beancount's balance-checking and account-registry logic in TypeScript, running fully client-side -- a substantial undertaking (this is a meaningful fraction of what the `beancount` Python package itself does), but would preserve the "live as you type" experience for semantic errors too.
- **Multi-file / `include` directive support** -- Beancount supports splitting a ledger across files via `include`; this app's model is one `.bean` file per company/ledger row, so this is out of scope unless that data model changes.

## Critical files

- `newgl-specs/plans/bean-editor/BEAN_FILE_EDITOR_PLAN.md` -- this doc
- `quickslike/src/app/(app)/all-apps/ledger/page.tsx` -- gains the tab switcher and the new Edit tab
- `quickslike/src/lib/beancount/lint.ts` (new) -- the tokenizer + syntax linter, pure TS
- `quickslike/src/components/bean-editor/bean-editor.tsx` (new) -- the CodeMirror React wrapper
- `newgl-api/src/infra/beancount/parser.ts` -- read-only reference for this plan (its line-grammar shape informs the client tokenizer); not modified by this plan
- `newgl-api/src/http/routes/ledgers.ts` -- the existing upload/download/versions/restore endpoints this plan reuses as-is; not modified by this plan
- `Assets/Beancount - Syntax Cheat Sheet.pdf` -- the syntax reference this plan's lint rules are drawn from

## Verification

- Load the Ledger page's new Edit tab, confirm the current `.bean` content renders with syntax highlighting matching the cheat sheet's constructs (dates, directives, accounts, amounts, strings, comments, tags/links, cost/price syntax).
- Type each class of syntax error from the rule list above one at a time, confirm a diagnostic appears at the right line/column and Save is disabled while any error is present.
- Fix an error, confirm the diagnostic clears and Save re-enables.
- Save a valid edit, confirm: a new version appears in the (shared) version-history list, the Manage-file tab's download now reflects the edit, and the register/reports elsewhere in the app reflect the new content (proving it went through the real upload/validate/persist path, not a shortcut).
- Confirm all 5 app themes (light/dark/modern/america250/pretty) render the editor with matching colors/contrast, per this session's established per-theme verification habit.
- Confirm the unsaved-changes guard fires when navigating away or switching tabs mid-edit, and does not fire after a successful save.
