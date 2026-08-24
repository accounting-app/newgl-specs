# How Beancount.io's Git Flow Works — and What We're Missing

This is a **research/explanation document, not a plan** — it exists to answer "how does the git-clone button in beancount.io actually work" before we decide anything for `newgl`. No implementation decisions are made here.

Note this is a **different product than Fava**, which is what `BEAN_EDITOR_PLAN.md` was originally modeled on. Fava is the open-source, self-hosted web UI for Beancount (you run it yourself, on your own machine/server). **Beancount.io** is a separate, commercial, hosted SaaS product built around Beancount. Their git integration is a fundamentally different architecture from Fava's, not a bigger version of it.

## What beancount.io actually does (confirmed from their site)

- They run their own **Gitea server** at `git.beancount.io` — Gitea is a real, open-source, self-hostable Git service (think "a GitHub you run yourself"): private repos, SSH access, a web UI for browsing/history, an admin API for provisioning repos and users.
- When you sign up, beancount.io provisions **a private Git repository per ledger/book** on that Gitea instance.
- The URL you saw, `ssh://git@git.beancount.io:2222/davecast/my-accounting-book.git`, is a standard Gitea SSH clone URL — `davecast` is your username/namespace on their Gitea instance, `my-accounting-book` is the repo name, port `2222` is just where they've bound SSH (common when a box already uses port 22 for something else, or as a deliberate separation from any admin SSH access).
- The documented workflow is exactly normal git: `git clone ssh://...`, edit locally with whatever tool you want (VS Code, Vim, Emacs, Fava, anything), `git commit`, `git push origin main`.
- One user on their forum described a **backup chain** built on top of this: beancount.io's own server is the primary copy, it auto-syncs (push-mirrors) to a private GitHub repo as backup #1, individual laptops with local clones are backup #2, and periodic pulls to an external drive are backup #3. That mirroring is a native Gitea feature (Gitea can push-mirror any repo to GitHub/GitLab/another remote automatically), not something custom-built.
- Their stated pitch is **data sovereignty/portability**: since it's a real git repo, you're never locked in — you can push it anywhere, edit with any tool, and walk away with full history intact.

## What is *not* publicly documented (real unknowns, not just "we haven't decided yet")

I could not find documentation — from their site, blog, or forum — that answers:

1. **How you register an SSH public key** with your beancount.io account. (Standard Gitea behavior is "paste your public key into account settings," so it's a safe guess, but it's not confirmed for this product specifically.)
2. **Whether their own web-based editor writes to the same Gitea repo** that you can clone over SSH, or whether the web app and the git repo are two separate stores that get reconciled somehow. This matters a lot — see the open questions below.
3. **How conflicts are handled** if you edit in their web UI and someone (or you, from another machine) pushes a conflicting change over SSH at the same time.
4. **Any multi-user/permissions model** — e.g. if a bookkeeper and an accountant both have push access to the same book's repo, is that just standard Gitea collaborator permissions, or something beancount.io layers on top?

These would need either testing an actual beancount.io account directly, or asking their support — I'm flagging them as unknown rather than guessing.

## How this differs from Fava's model (the approach `BEAN_EDITOR_PLAN.md` assumed)

| | Fava (self-hosted) | Beancount.io (hosted SaaS) |
|---|---|---|
| Git server | None — just the local filesystem's `.git` | A real hosted git server (Gitea) with SSH access |
| How commits happen | An optional extension (`auto_commit`) shells out `git commit` locally after each web-editor save | Unknown/undocumented whether the web editor even goes through git the same way |
| External access | None — there's no remote, no SSH endpoint, no way to `git clone` your Fava ledger from elsewhere unless you set that up yourself outside Fava entirely | The whole point of the feature — `git clone` from any machine, using your own tools |
| Infra to run | Nothing beyond Fava itself | A whole separate git-hosting service (Gitea or equivalent), SSH key auth, per-user repo provisioning |

In short: Fava's model is "the app quietly keeps a local history for you." Beancount.io's model is "the app **is** a git remote you can clone, with a web UI on top." Those are not the same feature at two different sizes — replicating the second one means standing up infrastructure that doesn't exist in `BEAN_EDITOR_PLAN.md` at all.

## What we'd need to build to replicate the beancount.io (SSH-clone) model in `newgl`

- **A git-hosting component**, not just a `git` binary shelling out from `newgl-api`. Realistic options:
  - **Self-host Gitea** (what beancount.io itself uses) — free, open-source, gives us private repos + SSH + a web UI + an admin API for provisioning, essentially for free. This is a new service to deploy and operate, separate from `newgl-api` and `quickslike`.
  - **Provision private repos on GitHub/GitLab programmatically** via their APIs instead of self-hosting anything — less infra to run ourselves, but ties every user's ledger to a third-party SaaS account/org and its billing/auth model.
  - **Hand-roll a minimal git-over-SSH service** — technically possible (git's SSH protocol is just `git-upload-pack`/`git-receive-pack` over a shell), but this is reinventing a meaningful slice of what Gitea already does well; hard to justify unless there's a strong reason not to use existing software.
- **SSH key management** — a place for users to register/rotate public keys, and an SSH front door that authenticates by key and maps to the right repo. (Gitea provides this out of the box if we self-host it.)
- **Per-user or per-company repo provisioning** — automatic creation of a private repo when a new book/company is set up. Note `newgl-api` today is single-tenant in practice (one `COMPANY`, one `LEDGER_FILE` per deployment, no user/account model at all) — this feature implicitly assumes multi-tenancy exists, which it currently doesn't.
- **A reconciliation story between the in-browser Files editor (from `BEAN_EDITOR_PLAN.md`) and this external git remote** — if both can write to the same repo, we inherit real merge-conflict handling, not just "commit on save."

## Open questions to answer before we can make a Git decision

1. **Do we actually want the beancount.io model (a real git server users can `git clone` from), or the Fava model (quiet local history, no external git access)?** These require very different amounts of new infrastructure — this is the single biggest fork.
2. **If we want external git access: self-host Gitea, provision repos on GitHub/GitLab, or build our own?** Self-hosting Gitea is the closest match to what beancount.io actually does and is the lowest-effort way to get SSH clone + web UI + API "for free."
3. **Is `newgl` single-tenant or multi-tenant?** Today it's one company per deployment with no user/account system. A per-user git remote only makes sense once there's a real notion of "users" and "their own ledger" — does that model exist or need to be built first?
4. **If both a web editor and external `git push` can modify the ledger, which one wins on conflict?** Do we accept real git merge conflicts and require manual resolution, or lock/disable the web editor while there are unpushed/unmerged upstream changes?
5. **Who hosts and maintains the git server?** This becomes a third long-lived service (alongside `newgl-api` and `quickslike`) with its own uptime, backups, and security surface (SSH access is a bigger attack surface than an HTTP API).
6. **Is SSH-clone access actually the requirement, or is the underlying want just "portability / I'm not locked in"?** A much smaller feature — a "Download ledger as .zip" or "export to a git bundle" button — could satisfy data-sovereignty concerns without standing up a whole git-hosting service. Worth confirming which problem we're actually solving before committing to the bigger build.

## Sources

- [Beancount.io v3.0: Your Financial Data, Under Your Control](https://beancount.io/blog/2025/11/26/beancount-io-v3)
- [Git for Beancount | Version Control for Your Finances](https://beancount.io/git)
- [Beancount v3's Git Integration is a Game-Changer for Data Sovereignty — Beancount.io Forum](https://beancount.io/forum/t/beancount-v3s-git-integration-is-a-game-changer-for-data-sovereignty/116)
