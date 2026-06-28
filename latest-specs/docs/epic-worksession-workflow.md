# Epic Worksession Workflow — OpenLedger

> **Purpose**: Follow this workflow when the user references a specific epic page from the OpenLedger roadmap.
> This narrows your focus to ONLY the issues and files in that epic.
>
> **Trigger**: The user references this document + an epic's overview page:
> ```
> I want to work on @docs/epic-worksession-workflow.md using @roadmap/epic-01-scaffold-contracts/overview.md
> ```

---

## Prerequisites

> ⚠️ **OpenLedger uses Bun for all development.** Ensure Bun is installed.

```bash
# Verify Bun is installed
bun --version    # >= 1.x

# Install dependencies (first time)
cd openledger
bun install
```

### Required Environment

```bash
# Start dev server (hot reload)
bun run dev

# Verify server is running
curl -sf http://localhost:4000/health

# Verify GraphQL endpoint
curl -sf http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ health { status version } }"}'
```

---

## Step 1: Read the Epic Page

Read the epic page the user referenced. Extract:

- **Epic title** and scope description
- **SPEC milestone** — which milestone this epic maps to
- **Issues table** — these are the ONLY issues you work on this session
- **Implementation plan** — approach, files to create/modify
- **Conformance obligations** — which CT-* tests must pass
- **Dependencies** — check if prerequisite epics are marked ✅ Done on `roadmap.md`
- **Session checklist** — follow this as your task list
- **Session log** — review what was done in previous sessions (if any)

> ⚠️ The epic page is your **single source of truth**. Do not research from scratch. The epic already contains the scoped plan.

### Also Read (for context, not for scope):

```
Review /Users/ealastre/Documents/GitHub/gsx-wiki/projects/openledger/overview.md
Review /Users/ealastre/Documents/GitHub/openledger/SPEC.md (the relevant sections cited in the epic)
```

This gives you the full architecture context. Your **scope** comes from the epic page only.

---

## Step 2: Check Current State

1. **Verify the dev server starts clean:**
   ```bash
   cd /Users/ealastre/Documents/GitHub/openledger
   bun install
   bun run dev &
   sleep 2
   curl -sf http://localhost:4000/health
   kill %1
   ```

2. **Run existing tests:**
   ```bash
   bun test
   ```

3. **Check the epic page's status:**
   - If **⬜ Not Started** → update `roadmap.md` to **🔄 In Progress**
   - If **🔄 In Progress** → review the session log for what was done previously

---

## Step 3: Plan This Session's Work

From the epic's implementation plan, pick a coherent subset:

- **Prefer dependency order** — types before resolvers, parser before serializer
- **Aim for 2–4 issues per session** — quality over quantity
- **Tell the user your plan** — what you'll tackle now, what you'll defer

### Plan Template

```
This session I'll work on Epic N — [Title]:

1. Issue: [title] → [file to create/modify]
2. Issue: [title] → [approach]

Deferred to next session:
3. Issue: [title] (depends on #1 being complete)
```

---

## Step 4: Execute → Test → Commit

For each issue:

### 4a. Implement

| Type | Where to look |
|------|---------------|
| `GraphQL Schema` | `src/graphql/schema.ts`, `src/graphql/scalars.ts` |
| `Ledger Core` | `src/ledger/parse.ts`, `serialize.ts`, `dag.ts`, `validate.ts`, `readModel.ts` |
| `P2P` | `src/p2p/node.ts`, `gossip.ts`, `antiEntropy.ts` |
| `Security` | `src/security/identity.ts`, `sign.ts` |
| `Tests` | `test/*.test.ts` |
| `Config` | `gl-node.config.json` |

### 4b. Test

```bash
# Run all tests
bun test

# Run specific test file
bun test test/scaffold.test.ts

# Verify dev server still starts
bun run dev
```

> ⚠️ **SPEC rule:** A milestone is not "done" until its conformance obligations (CT-*) pass under `bun test`.

### 4c. Commit

```bash
git add -A && git commit -m "feat(openledger): Epic N — description"
```

### 4d. Update Issue Status

Mark the issue as ✅ in the epic's overview page.

---

## Step 5: Update the Epic Page

After completing issues in this session:

### 5a. Mark Resolved Issues

In the epic's **Issues** table, change status:

```markdown
| ✅ | Implement Decimal scalar with decimal.js validation | feature | critical |
```

### 5b. Update the Session Log

```markdown
## Session Log

| Date | Issues Completed | Conversation | Notes |
|------|-----------------|--------------|-------|
| 2026-07-01 | Decimal scalar, Date scalar, TxId scalar | [Link] | All 3 scalars validate correctly, bun test passes |
```

### 5c. Update Roadmap Status

Edit `/Users/ealastre/Documents/GitHub/gsx-wiki/projects/openledger/roadmap.md`:

- All issues done → mark **✅ Done**
- Some remain → keep **🔄 In Progress**

---

## Step 6: Session Dev Blog

Create a dev blog entry inside the epic's folder:

```
gsx-wiki/projects/openledger/roadmap/epic-NN-<slug>/YYYY-MM-DD-<session-slug>.md
```

Include: frontmatter, what changed, verification results, files modified.

---

## Quick Reference

| What | Path |
|------|------|
| **SPEC.md** | `openledger/SPEC.md` |
| **Roadmap index** | `gsx-wiki/projects/openledger/roadmap.md` |
| **Epic folders** | `gsx-wiki/projects/openledger/roadmap/epic-NN-*/` |
| **Epic overview** | `roadmap/epic-NN-*/overview.md` |
| **Epic dev blogs** | `roadmap/epic-NN-*/YYYY-MM-DD-<slug>.md` |
| **Project overview** | `gsx-wiki/projects/openledger/overview.md` |
| **Source code** | `openledger/src/` |
| **Tests** | `openledger/test/` |
| **ADRs** | `openledger/docs/adr/` |
| **This doc** | `openledger/docs/epic-worksession-workflow.md` |
