# New GL — Local Testing Guide

How to get all three services running on your own machine and test the app, without needing to ask for help each time.

---

## 0. What you need installed (one-time)

- **Docker Desktop** — running (local Supabase runs in Docker containers).
- **Bun** — `bun --version` should print `1.3.13` or newer.

That's it. `.env` files for all three projects already exist locally from earlier setup — you shouldn't need to create or edit them for local testing.

---

## 1. Start Docker

If Docker Desktop isn't already open:

```bash
open -a Docker
```

Wait until the whale icon in your menu bar stops animating (Docker is ready). You can confirm from the terminal:

```bash
docker info
```

If that prints info instead of an error, you're good.

---

## 2. Start local Supabase (Postgres + Auth)

```bash
cd newgl-api
bunx supabase start
```

First run takes a minute or two (pulling Docker images). Every run after that is fast. When it's done, it prints a block of local credentials — you don't need to copy anything, the `.env` files already have the local defaults baked in.

To confirm it's running any time later:

```bash
bunx supabase status
```

**Studio (a browser-based table viewer for the local database)** is at **http://127.0.0.1:54323** — useful if you want to look at the raw data (tenants, companies/ledgers, transactions) without going through the app.

---

## 3. Start the three app servers

Open three separate terminal tabs/windows, one per service:

**Terminal 1 — newgl-api (port 3001)**
```bash
cd newgl-api
bun run dev
```

**Terminal 2 — newgl-ai (port 3002)** — only needed if you're testing AI features (column mapping, categorization, the AI settings page). Skip this one if you're just testing the company switcher.
```bash
cd newgl-ai
bun run dev
```

**Terminal 3 — quickslike (port 3010)**
```bash
cd quickslike
bun run dev
```

Each one uses `bun --watch`, so they auto-restart on code changes — leave them running while you work.

### Quick health check

```bash
curl http://localhost:3001/api/health
```
Should return a JSON blob with `"status":200`. If you get a connection error, that server isn't running yet.

---

## 4. Open the app

**http://localhost:3010**

You'll land on the login screen. Since this is your own local database (not production), you need a **local account** — production logins won't work here and vice versa.

### First time: sign up

1. Click **Sign up**.
2. Any email/password works (e.g. `you@test.com` / `password123!`) — local Supabase doesn't send real confirmation emails, accounts are auto-confirmed.
3. You'll land on Home. A starter company (chart of accounts, some sample transactions) is created automatically on first login.

### Later: sign in

Same email/password you signed up with. Sessions persist across restarts of the dev servers (Postgres data isn't wiped unless you explicitly reset it — see §7).

---

## 5. What to test: the new company switcher (Phase A)

This is the feature from the latest session. Top-left of the header, next to the sidebar, there's a button showing your current company's name (defaults to `company`).

1. **Click it.** A dropdown opens showing your one company, marked "Primary."
2. **Click "New company."** An inline form appears — type a name (e.g. `Side Hustle LLC`) and hit **Create**.
3. Your new company now appears in the list, not marked active yet.
4. **Click it to switch.** The page reloads. The header now shows the new company's name.
5. **Go to Register** (left sidebar). It should be completely empty — no bank accounts, $0 balance. This is the proof the switch actually changed which set of books you're looking at, not just a label.
6. **Switch back** to `company` from the picker. Register should immediately show the original seeded accounts and transactions again.

If all six steps behave as described, Phase A is working correctly on your machine.

### Other things worth poking at while you're in there

- **Import wizard** (Register → Import button) — try a CSV, use "Suggest with AI" on the mapping step and "Suggest categories with AI" on the review step (needs newgl-ai running).
- **Settings → AI** — turn AI off, confirm the "Suggest with AI" buttons disappear from the import wizard; turn it back on.
- **Settings → Ledger** — download the `.bean` file, or look at version history.

---

## 6. Where to look when something breaks

- **Browser console / network tab** — first stop for anything that fails silently in the UI.
- **Terminal running `newgl-api`** — every request is logged; errors print a full stack trace.
- **Terminal running `newgl-ai`** — same, for AI-feature failures specifically.
- **Supabase Studio** (http://127.0.0.1:54323) → Table Editor — look directly at `tenants`, `memberships`, `ledgers` to see what the switcher is actually doing in the database.

---

## 7. Resetting to a clean slate

If your local data gets into a state you don't want (half-finished testing, weird data), you can wipe and replay every migration from scratch:

```bash
cd newgl-api
bunx supabase db reset
```

**This deletes all local data** — every user, tenant, company, transaction. It does not touch production. After running it, sign up again as a new user.

---

## 8. Stopping everything

- Stop each `bun run dev` terminal with `Ctrl+C`.
- Stop Supabase (Postgres/Auth containers): `cd newgl-api && bunx supabase stop`
- Docker Desktop can stay running or be quit — it's fine either way if nothing's using it.

---

## Current state as of this session

Right now, on this machine, Docker + local Supabase + `newgl-api` (port 3001) + quickslike (port 3010) are **already running** from testing during our last session. You can just open **http://localhost:3010** right now and try the company switcher immediately — no setup needed. `newgl-ai` (port 3002) is not currently running; start it yourself (§3) if you want to test AI features too.
