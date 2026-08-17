---
title: "parity:api:build rollout step 1: migrate arel wide-baseline reasons into @missingRailsCall JSDoc"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5229 landed `pnpm parity:api:build` (`scripts/api-compare/build.ts`), the reconcile-only slice of `docs/infrastructure/api-build-stub-generation-plan.md`. Rollout step 1 in that doc: run the reconcile on arel (smallest wide baseline) and commit the generated `@missingRailsCall` tags, migrating curated `reason` text out of `scripts/api-compare/call-mismatches-wide-exclude/arel/*.json` into the JSDoc. A dry run during #5229 showed 15 arel files change; one (`packages/arel/src/insert-manager.ts`) is already committed as the worked example. Run `pnpm parity:api --wide-calls` first (the tool refuses partial-scope artifacts via `missingScope`).

## Acceptance criteria

- `pnpm parity:api:build --package arel` output committed; second run is a no-op (0 files).
- Any `harvested`/`unmatched` stdout lines from the run are triaged in the PR body.
- Tree typechecks; arel tests untouched/passing.

## Mechanism retired — 2026-08-17

**The `call-mismatches-wide-exclude/` tree no longer exists** — RFC 0084 folded it
into `call-mismatches-exclude/`. Re-express against the merged tree.

## Re-verified 2026-08-17 (ready sweep)

Sequencing note: phase 1 of the same plan, and the cheapest of the four
`api-build-*` stories — arel's baseline is the smallest. Re-run the dry run
before starting; the '15 arel files change' figure predates RFC 0084's fold.
