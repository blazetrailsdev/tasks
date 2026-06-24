---
title: "api:drift — guard base/target extractor-version skew"
status: claimed
updated: 2026-06-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-06-24T20:36:49Z"
assignee: "drift-report-base-manifest-extractor-skew-guard"
blocked-by: null
---

## Context

The cross-version drift report (`pnpm api:drift`, scripts/api-compare/drift.ts,
PR #4014) diffs the pinned base manifest `output/rails-api.json` against a
freshly-extracted target `output/rails-api@<ref>.json`. The base is whatever
`pnpm api:compare` last produced. If the base was built by a DIFFERENT version
of `extract-ruby-api.rb` than the target, the diff conflates extractor-version
drift with real Rails drift. Observed live: after `extract-ruby-api.rb` changed
upstream (the `__FILE__ == $PROGRAM_NAME` guard PR), a re-run of the same
v8.0.2 → v8.1.3 drift moved call-set changes 545 → 1627 with no Rails change —
purely the stale base. The README tells the user to run `api:compare` first,
but nothing enforces or detects the skew.

## Acceptance criteria

- Record an extractor identity (script content hash or SCHEMA_VERSION) in both
  the base and target manifests' header.
- `api:drift` compares the two; on mismatch either auto-rebuilds the base
  (preferred) or aborts with a clear message instead of silently producing a
  conflated diff.
- Unit test for the mismatch-detection path (pure, no clone).

## Out of scope

- Changing the extractor's output shape.
