---
title: "Unify direct-adapter and handler fixture paths under fixtures()"
status: draft
updated: 2026-06-29
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

# Unify the direct-adapter and handler fixture paths under `fixtures`

Part 3 of 4 converging the AR fixtures helper to the Rails surface (RFC 0048
capstone). **No 0019 gate.** **This is a path unification, NOT a mechanical
rename** — `useFixtures` already exists as the legacy direct-adapter
`defineSchema(getAdapter(), …)` path, which is exactly the path this RFC retires.
The substantive work is collapsing two code paths into one and deleting the loser.

## Context

Two parallel fixture-wiring styles exist:

- **Legacy direct-adapter**: `useFixtures(..., () => getAdapter(), { schema })`
  (test-helpers/use-fixtures.ts) — stands up tables via `defineSchema(getAdapter(),
…)` per file.
- **Handler-resolved**: `useHandlerFixtures` + `setupHandlerSuite`
  (test-helpers/setup-handler-suite.ts:6-11) — bootstraps `Base.connectionHandler`
  and goes through the real connection-pool path. Its own docstring says it
  "Mirrors Rails' setup_fixtures/teardown_fixtures."

Rails uses "handler" ONLY for ConnectionAdapters::ConnectionHandler (pooling),
never on the fixtures API. The "handler" qualifier here encodes trails-internal
migration state (which connection path), not a Rails concept. Rails' surface is
`fixtures :authors, :posts`.

## Acceptance criteria

- [ ] The handler-resolved path becomes the single fixture path; the legacy
      direct-adapter `useFixtures` path is DELETED (this is the substantive change,
      not the rename).
- [ ] Public surface renamed to the Rails target: the declaration helper is
      `fixtures({ authors, posts })` (single committed name — not `useFixtures`);
      `setupHandlerSuite` → `setupFixtures`. All call sites migrated.
- [ ] "handler" retained ONLY where it mirrors Rails' ConnectionHandler
      (Base.connectionHandler, base.ts:820, and pool code).
- [ ] test:compare does not regress; no test names change.

## Notes

- Call this out in the PR as a real merge + deletion, not the mechanical-rename
  exception. Sweep across all fixture-backed test files — will exceed 500 LOC, so
  split into non-overlapping PRs from main (rename batches by directory), each
  standing alone; do NOT stack.
- Declaration name is committed: `fixtures({ ... })`, mirroring Rails'
  `fixtures :authors`.
