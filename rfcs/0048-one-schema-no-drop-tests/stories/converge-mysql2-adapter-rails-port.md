---
title: "converge-mysql2-adapter-rails-port"
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

Faithful Rails port (RFC 0048 convergence contract). Mirror
`vendor/rails/activerecord/test/cases/adapters/mysql2/mysql2_adapter_test.rb`
(354 lines) word-for-word into
`packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts` (currently
562 lines, trails-invented describe/it names + hand-rolled assertions). Ride
canonical TEST_SCHEMA + official models/fixtures; Rails' own scratch-table
names only. No bespoke tables, no `_tableName` paint-over of a bespoke suite.

Split from converge-mysql-adapter-ddl-one-schema (the schema.test.ts portion
shipped separately under the 500-LOC ceiling).

## Acceptance criteria

- [ ] describe/it names match the Rails test method names verbatim.
- [ ] Setup/fixtures/assertions reproduce the Rails bodies, not paraphrase.
- [ ] Ride canonical TEST_SCHEMA + test-helpers/models/\* + real fixtures.
- [ ] Surfaced impl gaps: fix impl or file under 0023-surfaced-deviations
      (tracked-pending-convergence); do not bend the test.
- [ ] All-or-nothing in one PR, <500 LOC.

## RFC 0048 working notes (added 2026-07-01)

Two conventions apply when (re)writing tests under this RFC:

- **Use the fixtures helper; do not hand-call `registerModel`.** The
  Rails-faithful `fixtures()` / `setupFixtures()` surface is merged (#4345; the
  old `useHandlerFixtures` / `setupHandlerSuite` call sites were renamed to
  `fixtures` / `setupFixtures` in #4346). Declaring a fixture set now
  **auto-registers its model on resolution** (#4348,
  `fixtures-register-model-on-resolution`) — mirroring Rails `fixtures :authors`.
  So declare the fixture set and let resolution register the model; do **not**
  add manual `registerModel(...)` lines for a fixture-backed model. (Association
  targets that have no fixture set of their own may still need an explicit
  register until the autoload fallback lands.)
- **`*.trails.test.ts` holds trails-only cases.** The `<name>.test.ts` file is a
  faithful word-for-word mirror of its Rails source. Any test case with **no
  Rails counterpart** (a trails-specific extension) belongs in a sibling
  `<name>.trails.test.ts` file — keep it out of the Rails-mirrored `.test.ts` so
  `test:compare` maps cleanly.
