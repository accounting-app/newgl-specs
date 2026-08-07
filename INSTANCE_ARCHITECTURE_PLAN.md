# New GL — Per-Instance Architecture: What Changes and Why

**Status:** Proposal for discussion, not yet decided or implemented.
**Author:** Written by Claude (David's AI assistant) based on Hector's WhatsApp feedback from Aug 4–5, summarizing the intended direction and proposing a concrete implementation path.
**Audience:** David and Hector — this is meant to get both of you aligned on scope before any code changes happen.

---

## 1. The one-paragraph version

We built New GL as a classic multi-tenant SaaS: one shared production deployment (`newgl-api.fly.dev`, `newgl-ai`, and quickslike on Vercel), one shared Supabase database, and every customer isolated from every other customer by a `tenant_id` column on their rows. Hector's feedback describes a different model: **each customer (or group of customers) runs their own complete, independent copy of the stack** — their own database, their own servers, possibly their own domain, possibly even self-hosted on a machine in their own home. There is no single shared login across customers, at least not yet. Within *one* customer's deployment, though, there can be multiple companies (multiple sets of books), and — later, not now — multiple users sharing that one deployment.

The good news, covered in detail below: **this is much more a deployment/infrastructure change than a rewrite.** Most of the multi-tenancy code we already built turns out to be the right foundation for this too — it just gets *reinterpreted*, not thrown away.

---

## 2. What Hector actually said (my reading of it)

Translating and organizing his messages:

1. **"There won't be a universal login at first."** No single sign-in that spans multiple customers' data. That kind of cross-instance identity system is a "later" problem.
2. **"Each user or group of users manages an instance of the api, api-ai, and ui."** The unit of isolation is a full deployment — not a row in a shared table.
3. **Example: `grupocastillo.newgl.com`** — that subdomain is its own project, own database, own server (Fly.io, or possibly self-hosted). Not "one more tenant in our shared system."
4. **"Maybe we even run a local server at home."** Self-hosting is explicitly on the table, not just Fly.io.
5. **"For now we can leave it like this."** He's not asking us to tear anything down today — this is about not building further in the *wrong* direction (a shared, self-service, sign-up-on-our-website SaaS model).
6. **"One instance can manage several companies."** Within a single deployment, there can be multiple companies (separate books).
7. **"Each user downloads their own code and runs it locally."** Confirms this is closer to self-hosted open-source software than a hosted product everyone shares.
8. **(Day 2) "Think of it as an Instance, not an Account. One instance = one user for now; multi-user per instance is a future feature."** This is the clearest reframing: don't think "tenant = one customer among many in our database." Think "instance = one deployment, currently serving one person, capable of growing into a small team later."
9. **"Each company has its own customers, employees, vendors, contractors, etc."** Confirms "company" means a full, independent set of books — exactly what a ledger already is in our system.

---

## 3. Current architecture, honestly inventoried

So we're starting from an accurate baseline, here's exactly what exists today:

| Piece | What it does today |
|---|---|
| **Supabase Auth (one cloud project)** | Every customer signs up against the *same* Supabase project. One shared pool of users. |
| **`tenants` table** | One row per customer, in a database shared by *all* customers. |
| **`memberships` table** | Many-to-many users↔tenants. Already supports multiple users per tenant — we just never built an invite flow. |
| **`ledgers` table** | Rows are scoped by `tenant_id` and have a `name` column — the schema already supports *multiple ledgers per tenant*. In practice, every tenant only ever gets one, called `"company"` (see below). |
| **`newgl-api` middleware** (`src/http/middleware/auth.ts`) | Verifies the Supabase JWT, looks up the caller's `tenant_id` from `memberships`, and builds a `PostgresLedgerRepository` scoped to **one hardcoded ledger name** (`LEDGER_NAME` env var, defaults to `"company"`) for every request. |
| **`newgl-ai`** | Internal-only service, no public IP, shared secret auth from `newgl-api`. One deployment, serving every tenant's AI requests. |
| **Deployment** | One `newgl-api` Fly app, one `newgl-ai` Fly app, one quickslike Vercel project. All customers hit the same URLs. |
| **AI key management** | Per-tenant: bring-your-own Anthropic key, or use a shared "platform" key with a metered quota (`plans` table, `ai_usage` table). |

The important detail for this document: **`LEDGER_NAME` is a single deployment-wide environment variable, not a per-request or per-user choice.** Every tenant, no matter how many `ledgers` rows they might have, only ever gets routed to the one named `"company"`. So even though the database schema already supports multiple companies per tenant, *nothing in the app today lets a user create a second one or switch between them.*

---

## 4. The core insight: isolation moves from "rows" to "deployments"

This is the mental model shift, and it's worth stating plainly because it explains why most of the code survives:

- **Today:** one database, many tenants, isolated by a `tenant_id` column on every row (row-level multi-tenancy).
- **Proposed:** many databases, each with (for now) one tenant, isolated by being *physically separate deployments* (deployment-level multi-tenancy).

Once each customer has their own database, a `tenant_id` column stops being the thing that keeps customers apart — physical separation already does that. But the column and the concept don't become useless: they become the mechanism for the *future* "multi-user per instance" feature Hector mentioned, and — more immediately — a `tenants` row per instance is still a completely reasonable place to store instance-level settings (name, AI key config, plan info if we keep that).

Put differently: **`tenant` doesn't disappear from the schema. It just stops meaning "one of many customers sharing our database" and starts meaning "the owner account for this particular instance."** In the common case (one instance, one user), there will simply always be exactly one row in `tenants` and one row in `memberships` per deployment. The code doesn't need to know or care that this is true — it already treats "how many tenants exist" as an open question, so N=1 is just a valid, boring case it already handles.

---

## 5. Terminology mapping

| Old term / mental model | New term / mental model |
|---|---|
| Tenant (one of many customers in a shared SaaS) | Instance's owner account (still stored in `tenants`, but there's normally only one per deployment) |
| Ledger (the one, unnamed, per-tenant .bean file) | Company (a named ledger — the schema already supports this, we just need to expose it) |
| Signup (self-service, on our shared public site) | Instance provisioning (an ops step: stand up a new database + deployment for a new customer) |
| "Multi-tenant SaaS" | "Multi-instance, self-hostable software" |

---

## 6. What we remove / stop doing

Being direct about this, since you asked:

1. **Stop treating `newgl-api.fly.dev` / `newgl-ai` / the quickslike Vercel deployment as *the* production environment for every customer.** These become, at most, *one reference instance* (maybe the one you and Hector use yourselves, or a demo) — not "the app" that every future customer signs up on.
2. **Stop building — and be ready to remove — any "public self-service signup" framing.** Right now `/signup` in quickslike lets any visitor create a brand-new tenant against our shared Supabase project. That flow doesn't make sense once each customer gets their own instance with its own Supabase project; provisioning a new customer becomes an ops/deployment action (by you or Hector), not something a stranger does by filling out a form on a shared website.
3. **Re-scope (not necessarily delete) the "two signups see two separate sets of books" cross-tenant isolation tests.** Those tests (`tests/tenant-auth.test.ts`, `tests/tenant-ledgers.test.ts`) prove row-level isolation *within one shared database*. That guarantee matters less once isolation is physical. We'd keep the tests (they still validate correct behavior for the future multi-user-per-instance case) but stop treating "many tenants in one DB" as the primary production scenario.
4. **Reconsider the platform AI key / quota system.** We built BYOK vs. a shared "platform" Anthropic key with a metered monthly quota (`plans`, `ai_usage`, the 402-on-quota-exceeded flow) — that model exists because *we* were going to be the ones paying for AI usage across many customers on a shared deployment. If every customer runs their own instance, the natural default is simply: **you set your own `ANTHROPIC_API_KEY` when you deploy your instance.** The quota/metering system becomes optional — worth keeping as a courtesy feature for less technical users who don't want to get their own Anthropic key, but no longer the default, load-bearing model. *(Flagging this as a decision for you and Hector — not removing it unilaterally.)*
5. **The custom-domain/subdomain idea (`grupocastillo.newgl.com`) is new work, not a removal** — listed here because it's a piece of infrastructure we don't have today and would need to build or script (see Phase 4 below).

---

## 7. What survives completely unchanged

This is most of what we built:

- The entire Beancount-in-Postgres storage model (`ledgers`, `ledger_versions`, parse-before-persist validation, version history + restore).
- `newgl-api`'s and `newgl-ai`'s codebases, route by route — nothing here is tenant-count-specific.
- The JWT verification middleware, the `tenants`/`memberships` schema, and `POST /api/tenants/bootstrap` — all still correct for "the first (and for now, only) user of this instance sets up their account."
- All five AI features (column mapping, categorization, learned rules, the AI on/off switch) — these operate per-tenant already, and "per-tenant" now just means "for this instance's one owner."
- The CSV import wizard, the Register UI, Reports — completely deployment-topology-agnostic.

---

## 8. What's genuinely new work

1. **Multi-company support inside one instance.** The `ledgers` table already supports this (multiple named rows per `tenant_id`), and the download/upload/version-history routes are already parameterized by ledger `name`. What's missing:
   - A `GET /api/ledgers` endpoint to list all companies for the current tenant.
   - A `POST /api/ledgers` (or similar) endpoint to create a new named company/ledger.
   - Removing the hardcoded `LEDGER_NAME` env var from `auth.ts`'s middleware — replace it with a per-request "current company" resolved from a header, a URL segment, or a stored user preference.
   - A company switcher in the quickslike UI (sidebar or settings), since accounts/transactions/register/reports all need to know which company's ledger they're reading.
2. **Instance provisioning process.** Right now, "add a customer" means nothing beyond them visiting `/signup`. In the new model, it means: create a new Supabase project (or a self-hosted Postgres), run the migrations against it, deploy a `newgl-api` + `newgl-ai` Fly app pair pointed at it, deploy a quickslike instance (Vercel project or self-hosted) pointed at those, and configure DNS for their subdomain. This should eventually be scripted — a `provision-instance.sh` or similar — but can start as a documented manual checklist.
3. **Subdomain / custom domain routing**, if `grupocastillo.newgl.com`-style URLs are wanted per instance. This is mostly DNS + Vercel/Fly custom domain configuration, not application code.
4. **A decision on the AI key/quota model** (see point 4 in the removals section) — whether every instance requires its own Anthropic key, or the metered platform-key option stays available.
5. **Self-hosting documentation**, if "run it at home" is a real near-term goal — a `docker-compose.yml` bundling all three services plus a self-hosted Supabase stack, and a setup guide for someone non-technical-ish to run on their own hardware.

---

## 9. Before / after workflow

### Developer / ops workflow

**Before:**
```
1. Push code to newgl-api / newgl-ai / quickslike.
2. Deploy once (Fly + Vercel).
3. Every customer signs up on the same shared URL.
```

**After:**
```
1. Push code to newgl-api / newgl-ai / quickslike (same as before — these are still
   the three codebases; every instance runs the same code).
2. To onboard a new customer: provision a new Supabase project, deploy a new
   newgl-api + newgl-ai Fly app pair against it, deploy a new quickslike instance,
   point their subdomain at it.
3. Each instance is upgraded independently by redeploying it with the latest code
   whenever you choose to.
```

### End-user workflow

**Before:** Visit `newgl.com` (or whatever the shared production URL is) → sign up → you're a new tenant in our shared database → one company (`"company"`), created automatically → invite teammates (not built yet, but schema-ready).

**After:** Visit *your own* instance's URL (e.g. `grupocastillo.newgl.com`) → log in (this instance's own auth, unrelated to any other instance) → you land on your account, which can hold multiple companies → switch between companies from a company picker → (later) invite teammates to *this instance* only.

---

## 10. Proposed phasing

Scoped to keep each phase shippable and reversible on its own.

**Phase A — Multi-company support (no deployment changes needed)**
Build the "list companies" / "create company" endpoints, remove the hardcoded `LEDGER_NAME`, add the company switcher to quickslike. This is useful *regardless* of how the instance-vs-tenant question resolves, and it's the one piece of "new work" that's pure application code — no infrastructure decisions blocking it. Good candidate to start on immediately.

**Phase B — Formalize instance provisioning**
Write down (and then script) the exact steps to stand up a brand-new instance: Supabase project, migrations, `newgl-api`/`newgl-ai` Fly apps, quickslike deployment, env vars, DNS. Turn the checklist from this conversation's earlier debugging session (Supabase pooler config, `prepare: false`, Bun version, shared internal token, IP lock-down) into a repeatable runbook so provisioning a second instance doesn't require re-deriving all of it from scratch.

**Phase C — Decide and implement the AI key/quota model for self-hosted instances**
Needs a decision from you and Hector first (see section 6, point 4). Then: either simplify Settings > AI to assume "you provide your own key" as the default, or keep the current BYOK/platform-quota system as-is per instance.

**Phase D — Subdomain / custom domain automation**
Only if `grupocastillo.newgl.com`-style URLs are wanted soon. Otherwise, a plain Fly `.dev` / Vercel `.vercel.app` URL per instance is a fine placeholder while everything else above gets built.

**Later — Self-hosting package**
`docker-compose.yml` bundling everything (including a self-hosted Supabase), for the "run it at home" scenario. Lowest priority unless a specific customer needs it soon.

---

## 11. Open questions for Hector

1. **Auth provider per instance:** does every instance get its own Supabase cloud project (simple, proven, but means creating a Supabase account per customer), or should we look at self-hosting Supabase (or building something lighter, given "one instance = one user for now" might not need a full Auth-as-a-Service product)?
2. **AI key model:** required BYOK per instance, or keep the metered platform-key option alive per instance too?
3. **Provisioning ownership:** who actually stands up a new instance when a new customer signs on — is this something David/Hector do by hand initially, or does it need to be self-service (a script the customer runs themselves) from day one?
4. **Existing production deployment:** what happens to the current shared `newgl-api.fly.dev` / `newgl-ai` / quickslike-on-Vercel setup we just finished debugging — does it become "instance #1" (yours), get decommissioned, or stay as a demo/reference environment?

---

*This document reflects Claude's interpretation of Hector's WhatsApp messages from Aug 4–5, 2026, written for David to share and confirm alignment before any implementation work begins.*
