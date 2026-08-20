# Phase D — Custom Domains / Subdomains: Implementation Plan

**Status:** Not started. This document is the plan to implement it later — see `INSTANCE_ARCHITECTURE_PLAN.md` §10 for where this fits among the other phases (A, B, C, E are done; this is the one remaining piece).

**Why this is separate from everything else:** Phases A and E were application code and infrastructure-as-config, testable entirely on this machine. Phase D is fundamentally different — it's DNS and hosting-provider configuration, which by definition requires a real domain name and can't be meaningfully simulated on `localhost`. That's why it got skipped over when we did architecture work — there was nothing to build or test locally. This doc exists so the actual implementation, whenever it happens, doesn't have to be re-derived from scratch.

---

## 1. What this actually is

Recall the architecture (§4 of `INSTANCE_ARCHITECTURE_PLAN.md`): each customer instance is a **separate deployment** — its own Fly apps (`newgl-api`, `newgl-ai`), its own frontend deployment (Vercel, or self-hosted). Phase D is about giving each of those separate deployments a human-friendly URL, e.g. `grupocastillo.newgl.com` instead of `newgl-api-grupocastillo.fly.dev` / `grupocastillo-quickslike.vercel.app`.

**Important nuance:** this is *not* one shared app inspecting a subdomain and routing internally (a single wildcard `*.newgl.com` pointed at one server that branches on `Host` header). That model would only make sense under the old shared-multi-tenant-SaaS architecture we moved away from. Under the instance model, **each subdomain needs its own DNS record pointing at that specific instance's specific deployment** — there is no shared router to inspect anything.

---

## 2. The two independent pieces

A custom domain touches two unrelated systems, both of which need configuring per instance:

1. **The frontend** (quickslike) — needs the subdomain to point at that instance's Vercel project (or wherever the frontend is hosted, if self-hosted per Phase E).
2. **The backend** (`newgl-api`) — if you want `api.grupocastillo.newgl.com` or similar rather than exposing the raw `.fly.dev` URL, this needs a Fly custom domain too. This is optional in a way the frontend domain isn't — end users only ever see the frontend URL; the API URL is just consumed by quickslike's own code (`NEXT_PUBLIC_API_URL`).

**Recommendation: start with only the frontend domain.** Give `grupocastillo.newgl.com` to quickslike/Vercel, leave `newgl-api` on its plain `.fly.dev` URL. Users never see the API URL directly, so there's no product reason to prettify it, and it's one less moving piece to configure per instance.

---

## 3. Manual steps (do this first, for instance #1)

### 3a. Pick and own a parent domain

You need a domain you control (e.g., `newgl.com`) with DNS management access, at whatever registrar/DNS provider you choose (Cloudflare, Namecheap, Route53, etc. — any provider that lets you add CNAME records via a dashboard and, later, an API).

### 3b. Add the domain to the Vercel project

```bash
vercel domains add grupocastillo.newgl.com
```
(or via the Vercel dashboard: Project → Settings → Domains → Add). Vercel will show you a DNS record to create — typically a `CNAME` pointing `grupocastillo` to `cname.vercel-dns.com`.

### 3c. Create the DNS record

At your DNS provider, add:
```
Type:  CNAME
Name:  grupocastillo
Value: cname.vercel-dns.com
```
Propagation is usually fast (minutes), sometimes up to a few hours depending on the provider and TTL.

### 3d. Verify

Vercel auto-provisions a TLS certificate once the CNAME resolves correctly — check the Vercel dashboard's Domains page for a green "Valid Configuration" status. Then visit `https://grupocastillo.newgl.com` directly to confirm it serves the app.

### 3e. Set the Supabase auth redirect URL

Same gotcha as the very first production deploy (see `INSTANCE_PROVISIONING_RUNBOOK.md` step 8) — add `https://grupocastillo.newgl.com/auth/callback` to that instance's Supabase project's Authentication → URL Configuration redirect allow-list. Easy to forget since it's a different system entirely from DNS/Vercel.

### 3f. (Optional) Custom domain for `newgl-api` too

Only if you decide you want it (see §2's recommendation against, for v1):
```bash
fly certs add api.grupocastillo.newgl.com -a <newgl-api-app-name>
fly certs show api.grupocastillo.newgl.com -a <newgl-api-app-name>
```
This prints the DNS record Fly needs (usually a CNAME to the app's `.fly.dev` hostname). Add it at your DNS provider, then:
```bash
fly certs check api.grupocastillo.newgl.com -a <newgl-api-app-name>
```
Once valid, update quickslike's `NEXT_PUBLIC_API_URL` to the new custom API domain and redeploy.

---

## 4. What's genuinely new work here (not just following the manual steps above)

1. **A repeatable "add domain to instance" step in the provisioning runbook.** Once this is done manually for a second and third instance, fold it into `INSTANCE_PROVISIONING_RUNBOOK.md` as an additional numbered step, same pattern as Phase B.
2. **DNS automation**, if the volume of new instances ever justifies it. Every major DNS provider has an API (Cloudflare's is commonly used and well-documented) — a script could take an instance name and provider slug and create the CNAME automatically, removing the manual dashboard step. **Not worth building until you've done this by hand at least 2-3 times** — premature automation here risks building the wrong abstraction before you know the real pattern of how instances actually get named/requested.
3. **A decision on wildcard vs. per-subdomain provisioning**, if you ever want customers to pick their own subdomain *before* you've manually set up DNS for them (i.e., true self-service). This would need either: (a) a wildcard DNS record plus a routing layer that doesn't exist in the current architecture and would need designing, or (b) API-driven per-subdomain DNS record creation triggered by whatever "create my instance" flow eventually exists. Recommend punting this decision until Phase B's provisioning automation (stage B/C) is further along — it's premature to design routing for a self-service flow that doesn't exist yet.

---

## 5. Testing this later (once a real domain is available)

There is no meaningful local/`localhost` test for this phase — DNS and TLS certificate provisioning are the entire point, and both require a real, publicly resolvable domain. When this is actually implemented:

1. Confirm `dig grupocastillo.newgl.com` (or `nslookup`) resolves to Vercel's infrastructure.
2. Confirm `https://grupocastillo.newgl.com` loads with a valid TLS cert (green padlock, no browser warning).
3. Sign up/log in through the custom domain specifically — this is what actually exercises the Supabase redirect URL config from step 3e; a login that works on the `.vercel.app` URL but fails on the custom domain almost always means that step was skipped.
4. If a custom API domain was also set up (§3f), confirm quickslike's network requests are actually going to the new API domain (browser dev tools → Network tab), not silently still hitting the old `.fly.dev` URL from a stale build.

---

## 6. Open questions for whenever this gets picked up

1. **Which domain and DNS provider?** Needs to be decided/purchased before any of this is actionable.
2. **Does `newgl-api` get a custom domain too, or stay on `.fly.dev` indefinitely** (§2's recommendation)?
3. **At what point does DNS automation (§4.2) become worth building** — is there a rough number of instances where doing this by hand becomes the bottleneck?
