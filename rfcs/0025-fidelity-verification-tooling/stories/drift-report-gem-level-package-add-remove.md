---
title: "api:drift — surface gem-level package add/remove from upstream Gemfile"
status: blocked
updated: 2026-06-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-06-24T20:56:50Z"
assignee: "drift-report-gem-level-package-add-remove"
blocked-by: "Agent orphaned by host OOM 2026-06-24 17:47 EDT; releasing claim for re-pickup"
---

## Context

`diffManifests` (scripts/api-compare/version-diff.ts, PR #4014) only diffs
packages present in BOTH manifests; a one-sided package is skipped as an
extraction asymmetry (the base/ts manifests carry non-rails gems like rack,
globalid that the drift target doesn't extract). Consequence, documented as a
limitation in vendor/README.md: a Rails bump that adds or removes a whole gem
won't surface in the drift report until that gem is added to vendor/sources.ts.
Today the user must eyeball the upstream Gemfile diff by hand.

## Acceptance criteria

- `api:drift` surfaces gem-level add/remove for the target ref, derived from the
  upstream Gemfile/gemspec (or the rails monorepo subgem list) between base and
  target refs, into `version-drift.json` (e.g. an `addedPackages`/
  `removedPackages` section).
- Does not regress the existing one-sided-package skip for in-scope packages
  (rack/globalid must still not appear as "removed").
- Unit-tested parsing of the gem list delta.

## Out of scope

- Auto-adding discovered gems to vendor/sources.ts (a decision, not this tool).
