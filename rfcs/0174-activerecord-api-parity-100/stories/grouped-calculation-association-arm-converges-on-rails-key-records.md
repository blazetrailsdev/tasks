---
title: "activerecord: converge executeGroupedCalculation's association arm onto Rails' key_ids / index_by"
status: ready
updated: 2026-10-10
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

Rails does not support the composite case. Run against activerecord 8.0.2 on sqlite3 (a `Book`
with `belongs_to :order, foreign_key: [:shop_id, :order_id]` onto an `Order` with
`primary_key = [:shop_id, :id]`), `Book.group(:order).count` raises:

```text
ArgumentError: Expected corresponding value for ["shop_id", "id"] to be an Array
```

Its body takes only `group_aliases.first`, so it hands `where(["shop_id", "id"] => [scalar, …])` to
`expand_from_hash`, whose array-key arm raises (`relation/predicate_builder.rb:93-96`). The composite
support in trails is therefore invented behaviour, not a port.

A receipt at the declaration is not available: `@missingRailsCall index_by — CONVERGEABLE <this id>`
on `executeGroupedCalculation` reds `pnpm parity:api:calls` ("1 STALE @missingRailsCall tag(s) whose
call is no longer flagged") and `pnpm parity:api:receipts:gate`. This story is the register.

Surfaced by PR trails#8354, which converged the `key_types` / `hash_rows` / result loops around this
arm and left the arm itself alone.

## Acceptance criteria

- [ ] The arm is Rails' four lines: `key_ids` from `group_aliases.first`, one `where(primary_key => key_ids)`
      on `base_class`, `index_by(&:id)`, and `key = key_records[key]`.
- [ ] `group(<composite-FK belongs_to>)` raises Rails' `ArgumentError`; the trails tests above (and the two
      `group("order")` cases in `relation/cpk-eager-count-aggregate-build-joins-fold.trails.test.ts`) assert
      that, keeping their SQL-shape assertions where the grouped query still runs first.
