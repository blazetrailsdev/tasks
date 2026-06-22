---
title: "3-arg visitAddForeignKey in pg/mysql schema-creation still defaults raw fk_rails name"
status: ready
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The 3-arg `visitAddForeignKey(fromTable, toTable, options)` overrides in
packages/activerecord/src/connection-adapters/postgresql/schema-creation.ts:154
and mysql/schema-creation.ts:180 still default the constraint name to the raw
`fk_rails_<table>_<column>` instead of the Rails SHA256 identifier
(`fk_rails_<first-10-hex-of-SHA256(table_col_fk)>`). PR #3795 fixed the real
addForeignKey + abstract foreignKeyOptions paths but left these parallel
visitors. They appear to be a legacy/duplicate path (the real flow uses the
ForeignKeyDefinition-form visitAddForeignKey with a pre-computed name); only
one PG test (schema-creation.test.ts NOT VALID) exercises the 3-arg form and it
does not assert the name.

## Acceptance criteria

- [ ] Determine whether the 3-arg `visitAddForeignKey` overrides are reachable
      from any real add_foreign_key flow.
- [ ] If reachable: default name via `foreignKeyName` (SHA256), matching Rails
      and PR #3795. If dead: remove the duplicate overrides.
- [ ] No test-name changes.
