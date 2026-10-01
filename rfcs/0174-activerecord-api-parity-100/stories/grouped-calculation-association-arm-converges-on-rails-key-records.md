---
title: "activerecord: converge executeGroupedCalculation's association arm onto Rails' key_ids / index_by"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`executeGroupedCalculation`'s `if (association)` arm
(`packages/activerecord/src/relation/calculations.ts`) is not Rails' body. Rails
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:561-565,589`):

```ruby
if association
  key_ids     = calculated_data.collect { |row| row[group_aliases.first] }
  key_records = association.klass.base_class.where(association.klass.base_class.primary_key => key_ids)
  key_records = key_records.index_by(&:id)
end
# …
key = key_records[key] if associated
```

The port instead collects EVERY group alias per row, drops tuples containing a null, always wraps
the primary key in an array, keys its lookup `Map` by a NUL-joined string (`keyOf`), reads each key
column through `_readAttribute`, falls back from `baseClass` to `klass`, and answers `?? null` for a
missing record. That shape exists to make `group(:composite_fk_belongs_to)` work
(`relation/grouped-composite-assoc-aggregate-alias.trails.test.ts`,
`relation/grouped-composite-assoc-applies-order.trails.test.ts`, and
"grouped calculation HAVING on a composite-FK belongs_to" in `calculations.trails.test.ts`), added by
`calculations-grouped-composite-fk-association` (RFC 0016) and folded by
`fold-grouped-composite-assoc-into-one-grouped-body` (RFC 0084) and
`grouped-calc-key-records-single-where` (RFC 0099).

Read literally, Rails' body takes only `group_aliases.first`, so for a composite foreign key it hands
`where(["a", "b"] => [scalar, …])` to `expand_from_hash`, whose array-key arm raises
`ArgumentError` (`relation/predicate_builder.rb:93-96`). That has NOT been run against Rails 8.0.2;
run it (`ruby` is on PATH) before deciding, because it settles whether the composite support is an
invented feature or a port of behaviour Rails reaches some other way.

Surfaced by PR trails#8354, which converged the `key_types` / `hash_rows` / result loops around this
arm and left the arm itself alone.

## Acceptance criteria

- [ ] The Rails 8.0.2 behaviour of `group(<composite-FK belongs_to>).count` is recorded here, from a run.
- [ ] The arm is Rails' four lines: `key_ids` from `group_aliases.first`, one `where(primary_key => key_ids)`
      on `base_class`, `index_by(&:id)`, and `key = key_records[key]`; any piece that cannot converge
      (a JS `Map` keys arrays by reference) is a receipt at the declaration.
- [ ] The three trails tests above are kept, rewritten to Rails' behaviour, or removed, per the run.
