# Wiki Update Workflow — OpenLedger

> **Purpose**: Guide for updating gsx-wiki documentation for OpenLedger.
> Follow this when completing work sessions to keep documentation current.

---

## Wiki Locations

| Document | Path |
|----------|------|
| **Project Overview** | `gsx-wiki/projects/openledger/overview.md` |
| **Project Roadmap** | `gsx-wiki/projects/openledger/roadmap.md` |
| **Epic Overviews** | `gsx-wiki/projects/openledger/roadmap/epic-NN-<slug>/overview.md` |
| **Dev Blog** | `gsx-wiki/projects/openledger/dev-blog/` or inline in epic folders |
| **Projects Index** | `gsx-wiki/projects/index.md` |

---

## When to Update

### After Every Work Session

1. **Update the epic's overview page:**
   - Mark completed issues as ✅
   - Add entry to session log table

2. **Update the roadmap:**
   - Change epic status if all issues are done (⬜ → 🔄 → ✅)

3. **Write a dev blog entry:**
   - Create `YYYY-MM-DD-<slug>.md` in the epic folder
   - Include: what changed, verification results, files modified

### After Completing an Epic

1. **Update the project overview:**
   - Move items from "In Progress" to "Completed" table
   - Update current phase description

2. **Update the roadmap:**
   - Mark epic as ✅ Done
   - Update "Last Updated" date

3. **Update the projects index** (if project status changed significantly)

---

## Dev Blog Format

```markdown
---
title: "OpenLedger — Epic N Session: <description>"
date: YYYY-MM-DDT00:00:00.000Z
tags: "openledger, epic-N, dev-blog"
---

# Epic N Session — <description>

## What Changed
- [List of changes]

## Verification
- [Test results, curl commands, screenshots]

## Files Modified
- `src/path/to/file.ts` — [what changed]

## Next Steps
- [What remains for this epic]
```
