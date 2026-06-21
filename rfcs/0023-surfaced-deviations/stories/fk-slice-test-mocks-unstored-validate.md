---
title: "mysqlFk/sqliteFk slice-test mocks should leave :validate unstored"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: 3818
claim: "2026-06-21T18:22:42Z"
assignee: "fk-slice-test-mocks-unstored-validate"
blocked-by: null
---

## Context

PR #3813 (foreign-key-defined-for-validate-fetch-fallback) added a
`storesValidate` flag to `ForeignKeyDefinition` tracking whether `:validate`
was on the options hash (PG introspection stores it; mysql/sqlite/DSL-without-it
leave it absent), mirroring Rails `defined_for?`'s
`validate == self.options.fetch(:validate, validate)`.

The generic-key slice tests added by PR #3809
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.test.ts`,
the `mysqlFk` and `sqliteFk` mocks in
"respects adapter-specific stored option keys (mysql lacks deferrable, sqlite lacks name)")
still construct those mocks passing `true` for the `validate` positional arg,
which now yields `storesValidate === true`. Rails' mysql/sqlite `foreign_keys`
options hashes do NOT carry `:validate`, so a faithful mock should pass
`undefined` (value still defaults to true via `validate ?? true`), matching the
real introspection call sites already converged in PR #3813
(`mysql/schema-statements.ts`, `sqlite3-adapter.ts`).

Low impact: those tests assert generic-key slicing, not validate, so the
inaccurate `storesValidate` does not affect any assertion today. Tracking for
fidelity only.

## Acceptance criteria

- [ ] `mysqlFk` / `sqliteFk` mocks in the adapter-specific-stored-keys test pass
      `undefined` for `validate` (storesValidate=false), matching Rails leaving
      `:validate` absent on those adapters.
- [ ] No test-name changes; existing assertions still pass.
