---
title: "Reset migrator/internal-metadata state per Rails so migrator + migrator.trails pass under one-schema"
status: ready
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`migrator.test.ts` and `migrator.trails.test.ts` fail under one-schema
(`AR_ONE_SCHEMA=1`) because they depend on migration bookkeeping state
(`schema_migrations`, internal metadata / environment) that the truncate-only
reset and shared canonical schema do not restore the way per-test drop/recreate
did. Verified 2026-07-01 by probing under the flag with an emptied exclude:

- `migrator.test.ts` — `AssertionError: expected [{ status: 'up' }, ...] to
deeply equal [{ status: 'down' }, ...]` (migration up/down state leaks/persists
  across tests under truncate-reset).
- `migrator.trails.test.ts:57-59` — `checkEnvironment` expected to raise
  `NoEnvironmentInSchemaError` but environment row survives the truncate reset.

Port to reset migrator/internal-metadata state per-test the way Rails' migrator
tests do (clear `schema_migrations` / internal metadata in setup), rather than
relying on table drops. Read Rails `activerecord/test/cases/migrator_test.rb` and
the internal-metadata tests first.

## Acceptance criteria

- `migrator.test.ts` and `migrator.trails.test.ts` pass under one-schema and are
  removed from `eslint/one-schema-exclude.json`.
- Migrator/internal-metadata reset mirrors Rails (no reliance on DROP TABLE).
- No test renames.
