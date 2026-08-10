# Instance Provisioning Runbook

**What this is:** the exact, repeatable steps to stand up one full New GL instance (Supabase project + `newgl-api` + `newgl-ai` + quickslike), written from what actually happened getting the first instance live — including every mistake that cost real debugging time, called out explicitly so the next instance doesn't repeat them.

**Status:** Phase B of `INSTANCE_ARCHITECTURE_PLAN.md` — manual checklist (stage A of the A → B → C provisioning path). Not yet scripted.

**Who this is for:** whoever is standing up a new instance by hand — you, Hector, or eventually a technical customer following this as documentation.

---

## Before you start

You'll need:
- A Fly.io account with `flyctl` installed and logged in (`fly auth login`).
- A Supabase account (supabase.com).
- A platform Anthropic API key, if this instance will offer the metered platform-key AI option (BYOK-only instances can skip this).
- The three repos cloned locally: `newgl-api`, `newgl-ai`, `quickslike`.

---

## 1. Create the Supabase project

Do this in the dashboard (supabase.com) — new project, region close to where you'll deploy Fly apps (we used `iad`/North Virginia). Set a strong database password and **save it somewhere durable immediately** — you will need it multiple times below and it is not retrievable later, only resettable.

Note the **Reference ID** shown on the project's dashboard URL (`supabase.com/dashboard/project/<reference-id>`) — you'll use it below.

---

## 2. Link and push migrations

```bash
cd newgl-api
bunx supabase login          # opens a browser, one-time per machine
bunx supabase link --project-ref <reference-id>   # prompts for the DB password
bunx supabase db push
```

This applies every file in `newgl-api/supabase/migrations/` in order (currently 9 files — tenants/memberships, ledgers, plans with the seeded `free` plan row, ai_credentials, ai_usage, payee_rules, the AI-enabled toggle, and multi-company support). Nothing else needs seeding separately.

---

## 3. Get the two values every service needs

From the Supabase dashboard:

| Value | Where | Used by |
|---|---|---|
| **Project URL** (`SUPABASE_URL`) | Settings → API → Project URL | `newgl-api` (JWT verification via JWKS) |
| **Database connection string** (`DATABASE_URL`) | Settings → Database → Connection string → **Transaction pooler tab specifically** | `newgl-api` and `newgl-ai` both |

> ⚠️ **Gotcha #1 — pick the right connection string.** The Database page shows three variants: Direct connection, Transaction pooler, Session pooler. **Use Transaction pooler** — port `6543`, host ending in `pooler.supabase.com`, username in the form `postgres.<reference-id>` (not just `postgres`). The Direct connection (port `5432`, host `db.<ref>.supabase.co`) will authenticate fine but isn't built for the many-short-lived-connections pattern a web API makes.
>
> Note despite what `.env.example` lists, the running code only actually reads **`SUPABASE_URL`** and **`DATABASE_URL`** — not `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, even though those are listed as env vars. JWT verification uses Supabase's public JWKS endpoint, no service-role secret needed server-side.

---

## 4. Deploy `newgl-api`

The `Dockerfile` and `fly.toml` already exist in the repo.

```bash
cd newgl-api
fly launch --no-deploy    # first time only, for a brand-new Fly app
```

Say no to any bundled Postgres/Redis add-on — this uses Supabase's Postgres, not Fly's.

Set secrets:

```bash
fly secrets set \
  SUPABASE_URL="https://<reference-id>.supabase.co" \
  DATABASE_URL="postgresql://postgres.<reference-id>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
  NEWGL_AI_URL="http://<newgl-ai-app-name>.internal:3002" \
  INTERNAL_SERVICE_TOKEN="$(openssl rand -hex 32)"
```

Save whatever `INTERNAL_SERVICE_TOKEN` value you just generated somewhere — you'll set the *exact same string* on `newgl-ai` in step 5.

Then:

```bash
fly deploy
```

> ⚠️ **Gotcha #2 — Bun version.** If `fly.toml`'s Dockerfile has `ARG BUN_VERSION` pinned below `1.2`, every Postgres-backed route will fail at runtime with `TypeError: undefined is not a constructor (evaluating 'new SQL(url)')` — Bun's native `SQL` client doesn't exist in older Bun images. Confirm the Dockerfile's `BUN_VERSION` matches `package.json`'s `packageManager` field (currently `1.3.13`) before deploying.
>
> ⚠️ **Gotcha #3 — prepared statements.** This should already be fixed in the codebase (`src/infra/postgres/client.ts` passes `{ prepare: false }`), but if you ever see `PostgresError: prepared statement "..." does not exist` or `"...already exists"`, that's Supabase's Transaction pooler (PgBouncer) not supporting server-side prepared statements across pooled connections. Confirm that fix is present before debugging further.
>
> ⚠️ **Gotcha #4 — `git commit` ≠ `fly deploy`.** Committing a fix locally does not redeploy anything. If you're chasing a bug and just fixed the code, you still need to run `fly deploy` again — obvious in hindsight, cost real time to notice the first time.

**Verify:**
```bash
curl https://<newgl-api-app-name>.fly.dev/api/health
```
Should return `{"status":200,...}`.

---

## 5. Deploy `newgl-ai`

```bash
cd newgl-ai
fly launch --no-deploy
```

> ⚠️ **Gotcha #5 — this is the one that actually matters for security.** When `fly launch` asks about a public IP, **decline it**. This service must only be reachable from `newgl-api` over Fly's private network, never the public internet — the entire "shared secret is defense-in-depth, not the only line of defense" design assumes this.
>
> If you already ran `fly launch` and it allocated a public IP anyway (the default), check and release it:
> ```bash
> fly ips list -a <newgl-ai-app-name>
> fly ips release <the-ip-shown>
> ```
> Confirm afterward that `https://<newgl-ai-app-name>.fly.dev` stops resolving publicly.

Set secrets:

```bash
fly secrets set \
  DATABASE_URL="<same pooled connection string as step 3>" \
  INTERNAL_SERVICE_TOKEN="<the exact same value you set on newgl-api in step 4>" \
  AI_KEY_ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  ANTHROPIC_API_KEY="<platform Anthropic key — skip if this instance is BYOK-only>" \
  ANTHROPIC_MODEL="claude-opus-4-8"
```

```bash
fly deploy
```

> ⚠️ **Gotcha #6 — trial-plan machines auto-stop.** If this Fly account is still on the trial plan (no card on file), machines forcibly restart every 5 minutes (`Trial machine stopping. To run for longer than 5m0s, add a credit card`). Not fatal — it restarts itself — but causes intermittent request failures until a card is added at fly.io/trial.

---

## 6. Confirm the two services can talk to each other

From `newgl-api`'s logs (`fly logs -a <newgl-api-app-name>`), trigger any AI action from the frontend (or `curl` `/api/ai/status` with a real bearer token) and confirm you get a real response, not `401 Missing or invalid X-Internal-Token` (token mismatch between the two apps — re-check step 4/5's `INTERNAL_SERVICE_TOKEN` values are identical) or a network-level failure (means `NEWGL_AI_URL` or the private network isn't wired correctly).

---

## 7. Deploy `quickslike`

In the Vercel project dashboard (or `vercel` CLI), set for the **Production** environment:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Project URL as step 3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → Project API keys → **anon public** (never `service_role`) |
| `NEXT_PUBLIC_APP_ENV` | `production` |

> ⚠️ **Gotcha #7 — this one is easy to forget and fails silently.** `NEXT_PUBLIC_APP_ENV` defaults to `"local"` if unset, which makes the deployed site call `http://localhost:3001/api` for every request — from a real user's browser, which obviously can't reach that. The site *looks* fine (it loads, login page renders) and then every API call just fails. Always set this explicitly.

Deploy (push to the branch Vercel watches, or trigger manually from the dashboard).

---

## 8. Set Supabase auth redirect URLs

Back in the Supabase dashboard: **Authentication → URL Configuration**. Set the Site URL and add a Redirect URL for `https://<your-quickslike-domain>/auth/callback`.

> ⚠️ **Gotcha #8.** Skipping this makes login *appear* to succeed (Supabase issues a session) and then silently fail to redirect back into the app — looks exactly like a frontend bug, isn't one.

---

## 9. Smoke test

1. Visit the quickslike production URL, sign up a real test user.
2. Confirm tenant bootstrap succeeds (you land on Home, not an error).
3. Try the CSV import wizard's "Suggest with AI" — confirms `newgl-api` ↔ `newgl-ai` ↔ Anthropic all work end to end.
4. Open the company switcher (top-left), create a second company, switch to it, confirm Register is empty; switch back, confirm original data returns.
5. Settings → Ledger → download the `.bean` file — confirms Postgres-backed ledger storage is working.

If all five pass, the instance is fully live.

---

## Known gaps in this process (not yet solved)

- **Fully manual right now.** Nothing here is scripted yet — that's Phase B → stage B (an ops script) and eventually stage C (customer self-service), per `INSTANCE_ARCHITECTURE_PLAN.md` §11.
- **No custom domain step.** This runbook gets you `<app>.fly.dev` / `<project>.vercel.app` URLs. Subdomain automation (`grupocastillo.newgl.com`-style) is Phase D, not yet built.
- **Self-hosted Supabase isn't covered here.** This runbook uses Supabase Cloud, which the architecture plan says is the fallback story (fine for instance #1), not the primary one (self-hosted Supabase per instance). Phase E.
