---
title: "loadSchemaBang drops db:test:load_schema's Schema.verbose = false"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6180
claim: "2026-08-07T16:29:49Z"
assignee: "of-kind-default-type-and-normalize-arguments"
blocked-by: null
closed-reason: null
---

## Context

`db:test:load_schema` sets `ActiveRecord::Schema.verbose = false` before every
`DatabaseTasks.load_schema` call (`vendor/rails/activerecord/lib/active_record/
railties/databases.rake:534`, and again in the per-database variant at `:560`),
so a schema load driven by the test-prep path is silent.

trails has no `Schema.verbose` at all — `packages/activerecord/src/schema.ts`
defines none, and `Migration.verbose` is the only verbosity switch in the port.
Rails has both: `ActiveRecord::Schema` inherits `Migration` but the rake tasks
address it through the `Schema` constant, and `DatabaseTasks.load_schema`
itself independently saves/restores `Migration.verbose`
(`tasks/database_tasks.rb:380,394`).

Surfaced in #6168, which ported `Migration.load_schema!` in-process onto the
code `db:test:prepare` reaches; the `Schema.verbose = false` line of that task
was the one statement with nothing to port onto.

## Converged shape

`Schema.verbose` exists on `packages/activerecord/src/schema.ts` with Rails'
semantics (`schema.rb` — `ActiveRecord::Schema < Migration`, so it is the
inherited class attribute, not a new one), and
`Migration.loadSchemaBang` (`packages/activerecord/src/migration.ts`) sets it
false around the `withTemporaryPoolForEach` load, mirroring
`databases.rake:534`.

## Acceptance criteria

- `Schema.verbose` reads/writes the same state Rails' inherited
  `Migration.verbose` cattr does — not a second, independent flag.
- `loadSchemaBang` sets it false before `DatabaseTasks.loadSchema`, matching
  `databases.rake:531-539`.
