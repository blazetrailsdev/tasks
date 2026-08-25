---
title: "Delete dropAllTables — no callers remain outside its own test"
status: closed
updated: 2026-08-09
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise invalidated: dropAllTables is no longer dead — test-setup-dy.ts:44,87 imports and calls it as the boot full-load arm for non-owned databases (the else branch of the canonical-schema-stamp fast path). Deleting it would break worker boot; the story's grep evidence predates that wiring."
---

## Context

`dropAllTables` (`packages/activerecord/src/support/drop-all-tables.ts:49`) is
dead. RFC 0060 removed the global per-test `resetTestAdapterState()` ->
`dropAllTables()` reset, and `git grep dropAllTables` now returns **only**:

- the definition (`support/drop-all-tables.ts:49`),
- its own self-coverage (`support/drop-all-tables.test.ts:74,91,117,178,183,184,197`),
- three explanatory comments (`associations.test.ts:1357`,
  `support/schema-dumping-helper.test.ts:26`,
  `support/handler-resolved-adapter.test.ts:46`).

No production or test-helper path calls it. Rails has no equivalent — its schema
is laid once per process (`vendor/rails/activerecord/test/cases/test_case.rb:298-300`)
and nothing drops every table thereafter — so there is nothing to keep for
fidelity either. It survives only because its own test file keeps it referenced,
and that test file is itself an expensive one (it drops and recreates the whole
canonical table set several times: `drop-all-tables.test.ts:178-197`).

RFC 0079's `delete-rebuild-canonical-tables` capstone mentions deleting "the
rebuild tail of drop-all-tables.test.ts" but not `dropAllTables` itself; this
story finishes the job and is independent of the shield burndown.

## Acceptance criteria

- `support/drop-all-tables.ts` and `support/drop-all-tables.test.ts` are deleted,
  or — if some shared drop primitive inside them is still needed by
  `canonical-table-rebuild.ts` — the reusable part is moved and only
  `dropAllTables` plus its self-coverage go.
- `git grep dropAllTables` returns nothing (the three stale explanatory comments
  are reworded, not left pointing at a deleted symbol).
- Any eslint rule / exclude JSON that names the file or symbol is updated.
- Coordinate with RFC 0079 `delete-rebuild-canonical-tables` if that lands first
  (it also edits `drop-all-tables.test.ts`).
- Full AR suite green on all three lanes.
