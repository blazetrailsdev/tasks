---
title: "A static class field for tableName / primaryKey / sequenceName / inheritanceColumn / ignoredColumns shadows Base's accessor"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 150
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to trails#8921 (`abstract-class-as-a-static-field-is-inherited`). A
`static x = v` class field on a model is an own data property that shadows the
accessor `Base` declares over a per-class ivar, and is inherited by every
subclass. These `Base` statics are accessors over a Rails per-class ivar and
share the hazard:

- `tableName` — `self.table_name=` sets `@table_name` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb`, `table_name=`)
- `primaryKey` — `@primary_key` (`attribute_methods/primary_key.rb`, `primary_key=`)
- `sequenceName` — `@sequence_name` (`model_schema.rb`, `sequence_name=`)
- `inheritanceColumn` — `@inheritance_column` (`model_schema.rb`, `inheritance_column=`)
- `ignoredColumns` — `@ignored_columns` (`model_schema.rb`, `ignored_columns=`)

A setter writes more than the ivar (reset_column_information, etc.), so a field
form also skips those side effects.

## Acceptance criteria

- [ ] For each static above, `class A extends Base { static x = v }` either has its setter's effect or is refused loudly, and `class B extends A {}` does not inherit it where Rails' ivar would not be inherited.
- [ ] Tests cover the field form for each.

## Audit 2026-10-22

Overlaps `table-name-and-primary-key-are-declared-through-underscore-statics`,
which owns the documented spelling for `tableName` / `primaryKey`; this story owns the
field-form hazard for all five. `abstract-class-as-a-static-field-is-inherited`
(trails#8921) is the converged precedent.
