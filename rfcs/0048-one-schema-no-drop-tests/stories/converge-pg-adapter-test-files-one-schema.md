---
title: "converge-pg-adapter-test-files-one-schema"
status: done
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4359
claim: "2026-07-01T01:24:47Z"
assignee: "converge-pg-adapter-test-files-one-schema"
blocked-by: null
---

## Context

Follow-up to `converge-pg-adapter-ddl-one-schema` (RFC 0048). That story's PR
converged only `packages/activerecord/src/adapters/postgresql/active-schema.test.ts`
to a faithful word-for-word port of
`vendor/rails/activerecord/test/cases/adapters/postgresql/active_schema_test.rb`
(stub-mode `captureSql` SQL-string assertions; `sql-capture.ts` extended to stub
the bare-driver `exec`; PG addIndex/removeIndex now raise `ArgumentError` for an
unknown algorithm). The remaining three files in that story are each large,
all-or-nothing per-file ports that exceed the 500-LOC ceiling and must each land
as their own PR. They were NOT touched.

Per the RFC 0048 Convergence contract: port the named Rails file word-for-word
(same describe/it names, same assertions), ride canonical `TEST_SCHEMA` +
official models + real fixtures, no `_tableName` hacks, fix impl (or file a
`0023-surfaced-deviations` story) rather than bending the test.

## Acceptance criteria

- [ ] `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts`
      (currently ~842 LOC, bespoke) → faithful port of
      `vendor/rails/activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb`
      (exists, ~31KB). Likely needs splitting into several PRs by sub-cluster
      under 500 LOC; each file/section converts all-or-nothing.
- [ ] `packages/activerecord/src/connection-adapters/postgresql-adapter.test.ts`
      (currently ~1271 LOC) → NO 1:1 Rails source
      (`vendor/rails/.../connection_adapters/postgresql_adapter_test.rb` does not
      exist). Per contract it is a bespoke suite: delete it and port the real
      Rails test cases that cover the behavior, or fold coverage into the
      adapters/postgresql port above.
- [ ] `packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts`
      (~996 LOC) is a trails-only extension — keep as-is unless a case duplicates
      a Rails case being ported; do not invent a Rails source for it.
- [ ] Each PR from main, non-overlapping files, 500-LOC ceiling, draft.

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
