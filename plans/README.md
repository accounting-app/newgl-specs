# Plans

Every planning/design doc in this repo, grouped by topic. Each subfolder covers one area of work; within a folder, docs are roughly chronological (older foundational docs first, newer follow-ups after).

## [`ui/`](./ui/) — UI design system & navigation

- [`UI_DESIGN_SYSTEM_PLAN.md`](./ui/UI_DESIGN_SYSTEM_PLAN.md) — the QuickBooks-inspired design system and "Apps" navigation overhaul: shared `ui/` component library, QBO-style navigation, toast feedback, and the full Stage 5 screen-by-screen migration sweep. **Status: complete** (Stages 1-5 plus the closing `SettingsCard` cleanup).

## [`plaingl-parity/`](./plaingl-parity/) — Matching PlainGL's accounting functionality

Read in this order:

1. [`PLAINGL_NEWGL_FEATURE_COMPARISON.md`](./plaingl-parity/PLAINGL_NEWGL_FEATURE_COMPARISON.md) — the original audit: a parity table (1:1 / Near 1:1 / Not Implemented / Skip) between PlainGL and our app.
2. [`PLAINGL_FEATURES_TO_IMPLEMENT.md`](./plaingl-parity/PLAINGL_FEATURES_TO_IMPLEMENT.md) — the build plan that turned that audit into 18 concrete, prioritized items. **Status: all 18 done.**
3. [`PLAINGL_NEWGL_GAP_ANALYSIS_2026-08-20.md`](./plaingl-parity/PLAINGL_NEWGL_GAP_ANALYSIS_2026-08-20.md) — a fresh live re-audit done after the above was completed and after the UI overhaul, with a comparative table and a suggested execution order for what's still missing (aging reports, uniform report compare/columnar, CSV-review splits, bank-rule auto-post, and a handful of smaller items). **Status: not started.**
4. [`EXPLAIN_BEANCCOUNT_FLOW_FILES.md`](./plaingl-parity/EXPLAIN_BEANCCOUNT_FLOW_FILES.md) — reference notes on how PlainGL's beancount parse/serialize/report flow works, for anyone porting a capability from its source.

## [`import-wizard/`](./import-wizard/) — Bank transaction import wizard

- [`Plan-v1.md`](./import-wizard/Plan-v1.md) — the current design/architecture plan for a 4-step import wizard (CSV/OFX/PDF/image upload → preview → account mapping → commit). **Read this one.**
- [`Plan-v0.md`](./import-wizard/Plan-v0.md) — superseded first draft, kept for history; `Plan-v1.md` resolves its open decisions (AI provider choice, OFX parser approach, account-suggestion phasing, navigation entry point).

## [`infrastructure/`](./infrastructure/) — Deployment, self-hosting, and provisioning

- [`INSTANCE_ARCHITECTURE_PLAN.md`](./infrastructure/INSTANCE_ARCHITECTURE_PLAN.md) — multi-instance/multi-tenant architecture (companies, provisioning, Phase A onward).
- [`INSTANCE_PROVISIONING_RUNBOOK.md`](./infrastructure/INSTANCE_PROVISIONING_RUNBOOK.md) — operational runbook for provisioning a new instance.
- [`PHASE_D_SUBDOMAIN_PLAN.md`](./infrastructure/PHASE_D_SUBDOMAIN_PLAN.md) — subdomain routing plan (Phase D of the instance architecture work).
- [`SELF_HOSTING_SETUP.md`](./infrastructure/SELF_HOSTING_SETUP.md) — self-hosting setup guide (see also `../self-host/`).
- [`TESTING_GUIDE.md`](./infrastructure/TESTING_GUIDE.md) — testing guide for the above.
