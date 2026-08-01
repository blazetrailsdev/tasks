---
title: "Pin that a composite FK survives removeColumn of one member column"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5813
claim: "2026-08-01T18:39:00Z"
assignee: "sqlite-composite-fk-survives-remove-column-untested"
blocked-by: null
closed-reason: null
---

## Context

`removeColumn` / `removeColumns` delete the foreign keys they orphan via
`deleteForeignKeysForColumns` (`connection-adapters/sqlite3-adapter.ts`), which
mirrors Rails' `definition.foreign_keys.delete_if` lines
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:349-363`).

Rails compares the whole value — `fk.column == column_name.to_s` and
`column_names.include?(fk.column)` — and reflects a composite FK's columns as an
Array (`sqlite3_adapter.rb:442-447`), which trails mirrors
(`foreignKeys()`: `column = fromCols.length === 1 ? fromCols[0] : fromCols`).
So a composite FK never matches either check and Rails leaves it in place.

That behavior was corrected during #5528 review (an earlier revision split
arrays and comma-joined strings and matched individual members, deleting
composite FKs Rails preserves). Nothing asserts it: the only coverage is
`migration/references-foreign-key.test.ts` "removing column removes foreign key",
which is single-column. The composite direction — a composite FK _surviving_
`removeColumn` of one member — is untested in either direction.

Prefer mirroring an existing Rails test over inventing a fixture; check
`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb` and the
`CompositeForeignKey` cases first, and use canonical tables only (CLAUDE.md).
If no Rails test covers it, the trails-only assertion belongs in a
`.trails.test.ts` sibling.

## Acceptance criteria

- [ ] A test pins that a composite foreign key survives `removeColumn` of one
      of its member columns, matching Rails' whole-value `delete_if`.
- [ ] The test fails against a revision whose helper matches FK members
      individually.
- [ ] Canonical tables/models only — no bespoke schema.
- [ ] Green on all three adapters.
