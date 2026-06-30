---
title: "converge-migrator-one-schema"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split from `converge-migrator-stmtcache-adapter-one-schema` (RFC 0048): that
story bundled three files; the statement-cache file shipped on its own (it is a
faithful 11-test port of `vendor/rails/activerecord/test/cases/statement_cache_test.rb`).
This story carries the remaining migrator file under the same binding
**Convergence contract** in the RFC 0048 README (faithful word-for-word Rails
port, not a rename).

`packages/activerecord/src/migrator.test.ts` (~1025 LOC of bespoke trails tests)
must be rewritten to mirror `vendor/rails/activerecord/test/cases/migrator_test.rb`
word-for-word: same `describe`/`it` names, same setup/scratch tables (Rails uses
`horses`/`testings`/`reminders`, never canonical names as scratch), same
assertions. Ride canonical `TEST_SCHEMA` + official `test-helpers/models/*` +
real fixtures; no bespoke tables, no invented columns, no `_tableName` hack.

## Acceptance criteria

- [ ] `migrator.test.ts` mirrors `migrator_test.rb` test-by-test (names verbatim).
- [ ] Canonical schema only; add to `TEST_SCHEMA` if schema.rb has something it lacks.
- [ ] Surfaced impl gaps → fix impl or file under `0023-surfaced-deviations`
      (tracked-pending-convergence); do not bend the test. Temporary
      `test:compare` regression acceptable — record the un-skip.
- [ ] 500-LOC ceiling; single PR from main; all-or-nothing per file.
