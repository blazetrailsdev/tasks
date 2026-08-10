---
title: "Migrator test construction sites adopt Rails' constructor signature"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: ["migrator-ctor-takes-schema-migration-and-internal-metadata"]
deps-rfc: []
est-loc: 600
priority: null
pr: 6194
claim: "2026-08-07T19:36:37Z"
assignee: "migrator-test-sites-adopt-rails-ctor-signature"
blocked-by: null
closed-reason: null
---

## Context

Split 2 of 3 from `migrator-connection-pins-adapter-at-construction` (see split
1, `migrator-ctor-takes-schema-migration-and-internal-metadata`, for the sizing
note and the Rails signature).

Roughly 100 `new Migrator(adapter, ...)` sites live in test files:
`packages/activerecord/src/migrator.test.ts`, `migrator.trails.test.ts`,
`migration.test.ts`, `migration.trails.test.ts`, `multi-db-migrator.test.ts`,
`active-record-schema.test.ts` and `packages/trailties/src/commands/db.test.ts`.

Rails' own tests build the bookkeeping objects in `setup` and pass them —
`vendor/rails/activerecord/test/cases/migrator_test.rb:53,61,68` use
`@schema_migration` / `@internal_metadata`, and
`multi_db_migrator_test.rb:142,149` use the per-database `_a` / `_b` pairs
against `ARUnit2Model`. trails' `multi-db-migrator.test.ts:47-53` already
constructs `smA` / `smB`, so that file is closest to the Rails shape.

## Converged shape

Every test construction site uses Rails' signature, mirroring how the
corresponding Rails test builds it. No test invents a bookkeeping object Rails'
counterpart does not build.

## Acceptance criteria

- [ ] No `new Migrator(...)` in the repo passes an adapter as the first argument.
- [ ] Ported test bodies match their `migrator_test.rb` /
      `multi_db_migrator_test.rb` counterparts' construction.
- [ ] Test names unchanged; `pnpm parity:test` delta non-negative.
- [ ] Migrator, migration and multi-db suites green on all three lanes.
