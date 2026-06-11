---
title: "where() nested-hash keyed by camelCase association name doesn't resolve to table"
status: done
updated: 2026-06-11
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 80
priority: 18
pr: 3124
claim: "2026-06-11T16:56:18Z"
assignee: "where-nested-hash-assoc-name-table-resolution"
blocked-by: null
---

## Context

`where({ ejHabtmCategories: { ... } })` (nested hash keyed by a camelCase
_association name_ that differs from the underlying table name) emits the
association name as the SQL table identifier, producing "no such column" errors.

Rails resolves this via `lookup_table_klass_from_join_dependencies` passed as a
block to `build_from_hash` in `ActiveRecord::PredicateBuilder`. The trails
`buildFromHash` (`relation/query-methods.ts:786`) does not pass the join
dependency resolver, so the association-name key is used verbatim.

This affects all association types (not HABTM-specific). Surfaced while migrating
`has-and-belongs-to-many-associations.test.ts` to canonical fixtures.

## Acceptance criteria

- [ ] `where({ assocCamelName: { col: val } })` resolves the table via join
      dependencies when the association name differs from the table name
- [ ] Mirrors Rails `PredicateBuilder#build_from_hash` join-dep resolver block
- [ ] No regression on existing `where` behaviour
- [ ] `api:compare` delta non-negative
