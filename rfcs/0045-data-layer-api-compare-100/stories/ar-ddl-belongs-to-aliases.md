---
title: "ar-ddl-belongs-to-aliases"
status: ready
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: ar-adapter
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails exposes `belongs_to`/`add_belongs_to`/`remove_belongs_to` as aliases of
`references`/`add_reference`/`remove_reference` across the migration/schema DDL
surface (`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:133`
`alias :add_belongs_to :add_reference`, `:269` `invert_add_belongs_to`). The
alias name is missing wherever the `reference` form is ported:

- `migration/command-recorder.ts` (38/42): `add_belongs_to`,
  `remove_belongs_to`, `invert_add_belongs_to`, `invert_remove_belongs_to`.
- `connection-adapters/abstract/schema-definitions.ts`: `belongs_to`,
  `remove_belongs_to` (and `validated?`).
- `connection-adapters/abstract/schema-statements.ts`: `add_belongs_to`,
  `remove_belongs_to`.
- `connection-adapters/abstract-adapter.ts`: `add_belongs_to`,
  `remove_belongs_to`.
- `connection-adapters/sqlite3-adapter.ts`: `add_belongs_to`,
  `column_definitions`.
- `migration.ts`: `current` (Migration.current_version helper).

The `belongs_to` aliases are mechanical (delegate to the ported `reference`
method). `validated?` (CheckConstraint), `column_definitions` (sqlite3 schema
introspection), and `migration.ts#current` are small real methods.

## Acceptance criteria

- `belongs_to`/`add_belongs_to`/`remove_belongs_to`/`invert_*_belongs_to`
  exposed as aliases of the ported `reference` methods on each host, OR a
  `SKIP_GROUPS` entry with reason if trails standardizes on `reference` only.
- `validated?`, `column_definitions`, `migration.ts#current` ported or
  skip-listed with reason.
- `pnpm api:compare --package activerecord` shows command-recorder.ts,
  schema-definitions.ts, schema-statements.ts, abstract-adapter.ts,
  sqlite3-adapter.ts, migration.ts at 100%.
