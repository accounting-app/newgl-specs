# Junior Dev Wiki Workflow — OpenLedger

> **Purpose**: After every work session, commit a structured session report directly into the `openledger` repo so that your senior engineer can review your progress asynchronously.
>
> **Why this exists**: Your session reports are your **proof of work**. They live in the repo alongside the code so that review happens in one place — no context-switching to external tools. Your senior reviews these with his own agent, and together they update the gsx-wiki epic pages and roadmap.

---

## The Review Loop

```
You (junior dev)                    Senior Engineer
─────────────────                   ─────────────────
1. Work on epic                     
2. Write session report             
3. git push                         
                                    4. Reviews your session report
                                    5. Updates gsx-wiki epic page
                                    6. Gives feedback via next session's notes
```

Your reports go into the **repo**. The gsx-wiki epic updates are the **senior's job** — you don't need access to gsx-wiki. This separation is intentional: you focus on code + documentation, they handle project management.

---

## Where Session Reports Go

```
openledger/
└── docs/
    └── sessions/
        └── YYYY-MM-DD-epic-NN-<slug>.md
```

**Naming convention:**
- Date first (sorts chronologically)
- Epic number (links to roadmap)
- Short slug describing what you worked on

**Examples:**
```
docs/sessions/2026-07-01-epic-01-pothos-scalars.md
docs/sessions/2026-07-02-epic-01-schema-completion.md
docs/sessions/2026-07-05-epic-02-parser-spike.md
```

---

## Session Report Template

Copy this template for every session:

```markdown
---
epic: 1
title: "Short description of what you did"
date: YYYY-MM-DD
spec_sections: "§2.6, §3.1"
conformance_tests: "CT-1, CT-2"
status: "completed | partial | blocked"
---

# Epic N Session — <title>

## What I Worked On

> List the issues from the epic overview you tackled this session.

- [ ] Issue title (copy from epic page) — ✅ Done / 🔄 In Progress / ❌ Blocked
- [ ] Issue title — status

## What Changed

> List the files you created or modified, with a one-liner about what you did.

| File | Change |
|------|--------|
| `src/graphql/scalars.ts` | Implemented Decimal scalar with decimal.js validation |
| `test/scalars.test.ts` | Added property-based tests for all 3 custom scalars |

## How I Verified

> Show the commands you ran and their output. Paste test results, curl responses, etc.

```bash
$ bun test
 ✓ Decimal scalar validates input
 ✓ Date scalar rejects datetime strings
 ✓ TxId scalar validates hex format
3 tests passed
```

## What I Learned

> This section is **required**. Write 2–3 sentences about something you understood better
> after this session. This is the educational payoff — the reason we structured the project
> this way. Be specific.

Example: "I learned that GraphQL custom scalars need both `serialize` (server → client)
and `parseValue` (client → server) methods. The Decimal scalar can't just use `Number()`
because JavaScript floats lose precision — that's why SPEC C8/I4 insists on string
serialization and `decimal.js`."

## Questions / Blockers

> Anything you're unsure about, stuck on, or need a decision from the senior engineer.
> These will be addressed in the next session's review.

- "Should the Date scalar reject dates in the future, or is that a business rule for the ledger service?"
- "I couldn't get Pothos subscription types to work — need help with the Yoga PubSub setup"

## Next Session Plan

> What you plan to tackle next time. This helps the senior engineer prepare review context.

- Complete remaining Epic 1 issues: stub all mutation resolvers
- Configure Biome for lint/format
- Write schema introspection test
```

---

## Git Commit Convention

When you push a session report, use this commit format:

```bash
# Session report only
git add docs/sessions/
git commit -m "docs(session): Epic N — short description"

# Code + session report together
git add -A
git commit -m "feat(openledger): Epic N — what you built

Session report: docs/sessions/YYYY-MM-DD-epic-NN-slug.md"
```

**Rules:**
1. **Always commit the session report in the same PR/push as the code it describes.** The report and the code are reviewed together.
2. **One session = one report.** Even if you only worked 30 minutes — write the report. Consistency matters more than length.
3. **Push at the end of every session.** Don't accumulate uncommitted work. Your senior reviews asynchronously and needs to see progress.

---

## Quality Bar

Your session report is **good enough** when:

- [ ] The frontmatter is filled out (epic number, date, spec sections, status)
- [ ] Every issue you touched has a status (✅ / 🔄 / ❌)
- [ ] Files changed are listed with what you did
- [ ] Verification output is pasted (not "tests pass" — show the actual output)
- [ ] "What I Learned" has at least 2 specific sentences
- [ ] Questions/blockers are listed (or "None" if genuinely none)
- [ ] Next session plan has at least 1 item

---

## What Your Senior Does With This

When your senior engineer reviews your session report, they will:

1. **Read your report** alongside the code diff (`git log --oneline`, `git diff`)
2. **Update the gsx-wiki epic page** — mark issues ✅, update session log table
3. **Update the gsx-wiki roadmap** — change epic status if needed
4. **Leave feedback** — either as comments in the next epic page or via direct message
5. **Adjust future epic scope** — if you're ahead/behind, they'll rebalance

This creates a **structured mentorship loop** where every session has a clear input (epic page) and a clear output (session report + code).

---

## First Session Checklist

For your very first session, do this:

1. [ ] Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. [ ] Clone the repo: `git clone https://github.com/mrrobot16/openledger.git`
3. [ ] Install deps: `cd openledger && bun install`
4. [ ] Start dev server: `bun run dev`
5. [ ] Open GraphQL Playground: `http://localhost:4000/graphql`
6. [ ] Run the health query: `{ health { status version } }`
7. [ ] Run tests: `bun test` (in a second terminal, with dev server running)
8. [ ] Read the SPEC.md — at minimum §0 (how to use), §1 (constitution), §2.6 (GraphQL contract)
9. [ ] Read your first epic: `gsx-wiki/projects/openledger/roadmap/epic-01-scaffold-contracts/overview.md`
10. [ ] Create `docs/sessions/` directory and write your first session report
11. [ ] Push: `git add -A && git commit -m "docs(session): Epic 0 — first session onboarding" && git push`

---

## Quick Reference

| What | Where |
|------|-------|
| **Your session reports** | `openledger/docs/sessions/YYYY-MM-DD-*.md` |
| **Epic pages (your task lists)** | `gsx-wiki/projects/openledger/roadmap/epic-NN-*/overview.md` |
| **SPEC (the constitution)** | `openledger/SPEC.md` |
| **Workflow docs** | `openledger/docs/*.md` |
| **This doc** | `openledger/docs/junior-dev-wiki-workflow.md` |
