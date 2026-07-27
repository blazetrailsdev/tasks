---
title: "api:build rollout step 1: migrate arel wide-baseline reasons into @missingRailsCall JSDoc"
status: draft
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5229 landed `pnpm api:build` (`scripts/api-compare/build.ts`), the reconcile-only slice of `docs/infrastructure/api-build-stub-generation-plan.md`. Rollout step 1 in that doc: run the reconcile on arel (smallest wide baseline) and commit the generated `@missingRailsCall` tags, migrating curated `reason` text out of `scripts/api-compare/call-mismatches-wide-exclude/arel/*.json` into the JSDoc. A dry run during #5229 showed 15 arel files change; one (`packages/arel/src/insert-manager.ts`) is already committed as the worked example. Run `pnpm api:compare --wide-calls` first (the tool refuses partial-scope artifacts via `missingScope`).

## Acceptance criteria

- `pnpm api:build --package arel` output committed; second run is a no-op (0 files).
- Any `harvested`/`unmatched` stdout lines from the run are triaged in the PR body.
- Tree typechecks; arel tests untouched/passing.
