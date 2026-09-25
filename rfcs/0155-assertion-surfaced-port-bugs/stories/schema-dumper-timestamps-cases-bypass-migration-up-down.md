---
title: "SchemaDumperTest timestamps cases call createTable directly instead of a Migration with up/down"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8112
claim: "2026-09-25T22:02:05Z"
assignee: "assertions-has-many-associations-remainder-13"
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trails#8073 (`migration-compatibility-v6-1-for-pre-rails-7-dump-tests`).

Rails' `SchemaDumperTest` datetime cases (`vendor/rails/activerecord/test/cases/schema_dumper_test.rb:617-672`,
`:735-825`; for example `test_schema_dump_with_correct_timestamp_types_via_create_table_and_t_column`)
build their table with `Class.new(ActiveRecord::Migration[Current]) do def up; create_table(...); end; def down; drop_table(...); end end`,
run `migration.migrate(:up)`, and in `ensure` run `migration.migrate(:down)`.

trails' ports in `packages/activerecord/src/schema-dumper.test.ts` (e.g. "schema dump with correct
timestamp types via create table and t column", "schema dump with timestamptz datetime format",
"schema dump when changing datetime type for an existing app", and the add-column variants) call
`(await Base.leaseConnection()).createTable("timestamps", { force: true }, ...)` directly and never
drop. trails#8073 had to add a per-test `afterEach` that drops `timestamps` so the
`Migration[6.1]` cases don't hit "relation already exists".

## Converged shape

Each case defines an anonymous `Migration.get(Current.VERSION)` subclass with `up`/`down`, calls
`migrate("up")`, and runs `migrate("down")` in `finally`, as the Rails `ensure` does. The
`timestamps` drop in `afterEach` is then removed.

## Acceptance criteria

- [ ] Every `timestamps` case in `schema-dumper.test.ts` builds through a migration with `down` in `finally`.
- [ ] The `afterEach` `dropTable("timestamps")` is deleted, and the file passes on the postgresql lane.
