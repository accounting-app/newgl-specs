# Self-Hosting New GL

Run a complete New GL instance on your own machine — no Fly.io, no Vercel, no Supabase Cloud account. This is Phase E of `INSTANCE_ARCHITECTURE_PLAN.md`.

---

## What you need

- **Docker Desktop**, running.
- **Bun** (`bun --version` ≥ `1.3.13`) — only needed to run the Supabase CLI via `bunx`.
- The three repos cloned as sibling folders under one parent directory:
  ```
  my-newgl/
    newgl-api/
    newgl-ai/
    quickslike/
  ```

You do **not** need a Fly.io, Vercel, or Supabase account for any of this.

---

## 1. Copy the self-hosting files into your parent folder

From this `newgl-specs` repo:

```bash
cp self-host/docker-compose.yml self-host/generate-secrets.sh /path/to/my-newgl/
```

You should now have `docker-compose.yml` and `generate-secrets.sh` sitting alongside `newgl-api/`, `newgl-ai/`, and `quickslike/`.

---

## 2. Start local Supabase (Postgres + Auth)

This is **not** part of `docker compose up` — it's the Supabase CLI's own local stack, run separately:

```bash
cd my-newgl/newgl-api
bunx supabase start
```

First run takes a minute or two (pulling images). Leave it running — everything else connects to it.

---

## 3. Generate your secrets

```bash
cd my-newgl
./generate-secrets.sh
```

Writes a `.env` file with a freshly generated `INTERNAL_SERVICE_TOKEN` and `AI_KEY_ENCRYPTION_KEY` — the two values that are genuinely secret to your instance. Safe to re-run; it won't overwrite an existing `.env`.

**Optional:** open `.env` and add your own `ANTHROPIC_API_KEY` if you want AI features (column mapping, categorization) to work. Leave it blank and everything else still works — you'll just see errors if you try the AI-specific buttons.

---

## 4. Build and start everything

```bash
docker compose up --build
```

First build takes a few minutes (installing dependencies, building quickslike's production bundle). Subsequent runs are much faster thanks to Docker's layer caching.

> If you see `error: Fail extracting tarball for "next"` during the build, that's a known intermittent Bun + Docker BuildKit issue — just re-run `docker compose up --build`. It resolves on retry and doesn't recur once the layer is cached.

When it's up, you'll see log lines from all three services. `newgl-api` and `quickslike` are reachable on your machine; `newgl-ai` deliberately is not (no port is published for it — it's only reachable from `newgl-api`, matching the production security model even locally).

---

## 5. Apply database migrations

One-time, after Supabase is running:

```bash
cd my-newgl/newgl-api
bunx supabase db push
```

This creates all the tables New GL needs (tenants, ledgers, AI credentials, etc.) in your local Supabase Postgres.

---

## 6. Open the app

**http://localhost:3010**

Sign up with any email/password — local Supabase auto-confirms accounts, no real email is sent. You'll land on Home with a starter company already created.

---

## Stopping and restarting

```bash
docker compose down          # stops newgl-api/newgl-ai/quickslike
cd newgl-api && bunx supabase stop   # stops Postgres/Auth
```

To start again later: `bunx supabase start` (from `newgl-api/`), then `docker compose up` (no `--build` needed unless you changed code).

Your data persists across restarts — Supabase's local stack keeps its Postgres volume until you explicitly reset it (`bunx supabase db reset`, which wipes everything).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `newgl-api` can't reach the database | Is `bunx supabase start` actually running? `docker compose` doesn't start it for you. |
| Signup succeeds but every page bounces back to `/login` | This is what a `SUPABASE_SERVER_URL` / cookie-name / `SUPABASE_JWT_ISSUER` mismatch looks like -- see below. The shipped `docker-compose.yml` already sets all three correctly, so you shouldn't hit this unless you've edited it. If you do: this happens because the browser reaches Supabase at `localhost:54321` while quickslike's *own server* (inside its container) must reach it at `host.docker.internal:54321` -- two different hostnames for the same logical Supabase instance breaks both the auth cookie's name (`@supabase/ssr` derives it from the hostname) and JWT issuer verification (Supabase always stamps tokens with `iss=http://127.0.0.1:54321/auth/v1`, regardless of which URL reached it). Check `docker compose logs newgl-api` for `401` responses as the tell. |
| `401 Missing or invalid X-Internal-Token` on AI features | `.env`'s `INTERNAL_SERVICE_TOKEN` wasn't picked up by both services — confirm you ran `docker compose up` from the same folder as the generated `.env`. |
| AI buttons error out but everything else works | You left `ANTHROPIC_API_KEY` blank in `.env` — expected, add a key if you want AI features. |
| Build fails with `Fail extracting tarball` | Known flaky Bun/BuildKit issue, see step 4 — just retry. |

For anything else, check each service's logs: `docker compose logs newgl-api`, `docker compose logs newgl-ai`, `docker compose logs quickslike`.
