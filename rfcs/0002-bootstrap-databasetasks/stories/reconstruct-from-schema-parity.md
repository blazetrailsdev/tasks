---
title: "Bring reconstructFromSchema to Rails parity"
status: ready
rfc: "0002-bootstrap-databasetasks"
cluster: bootstrap
deps: []
deps-rfc: []
est-loc: 150
priority: 72
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `reconstruct_from_schema` (`database_tasks.rb:413-425`) is NOT a plain
purge+load. It runs inside `with_temporary_pool(clobber: true)` and:

- if `schema_up_to_date?` → `truncate_tables` (unless
  `SKIP_TEST_DATABASE_TRUNCATE`) — the common warm-DB fast path;
- else → `purge` + `load_schema`;
- rescue `NoDatabaseError` → `create` + `load_schema`.

The current trails `reconstructFromSchema` (`database-tasks.ts:1016`) implements
NEITHER the `schema_up_to_date?` check NOR the `truncate_tables` fast-path — it
unconditionally purges+loads, which diverges from Rails (slower; reloads schema
every worker every run).

See RFC 0002 §Design (decisions, reconstructFromSchema parity).

## Acceptance criteria

- [ ] `reconstructFromSchema` adds the `schema_up_to_date?` check
- [ ] Warm-DB path uses `truncate_tables` (honoring `SKIP_TEST_DATABASE_TRUNCATE`)
- [ ] Cold path still `purge` + `load_schema`; missing-DB rescue still
      `create` + `load_schema`
- [ ] Behavior verified against `vendor/rails` `database_tasks.rb:413-425`

## Notes

Prerequisite for the PG/MySQL path of [[rework-test-setup]] (PR 2). sqlite
`:memory:` does not rely on this (it uses `loadSchema` directly).
