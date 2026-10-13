---
title: "postgresql adapter test: scope the example table with DdlHelper#with_example_table (~100 LOC)"
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8853
claim: "2026-10-13T12:12:25Z"
assignee: "activerecord-relocate-ts-only-tests-root-part-6"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8325. `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts`
has a file-local `withExampleTable(adapter, fn, definition)` with its own argument order and its
own `CREATE TABLE` / `DROP TABLE IF EXISTS ... CASCADE`, where Rails'
`vendor/rails/v8.0.2/activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb:13` is
`include DdlHelper` and `:763-765` is
`with_example_table(definition = "id serial primary key, number integer, data character varying(255)", &block)`
delegating to `DdlHelper#with_example_table`
(`vendor/rails/v8.0.2/activerecord/test/support/ddl_helper.rb:4-9`). `DdlHelper` is ported at
`packages/activerecord/src/support/ddl-helper.ts`.

The sqlite3 half of the original story (`sqlite3-adapter.test.ts`'s `createExampleTable()` and its
blanket `afterEach` drop list) is split out to
`sqlite3-adapter-test-with-example-table-blocks-part-2`: wrapping its 24 test bodies in blocks did
not fit one PR beside this half.

## Acceptance criteria

- [ ] `postgresql-adapter.test.ts` drops its local helper for the ported `DdlHelper` one, with
      Rails' argument order and default definition.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
