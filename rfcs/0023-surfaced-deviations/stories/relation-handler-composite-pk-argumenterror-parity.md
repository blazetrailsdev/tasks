---
title: "RelationHandler composite-PK subquery throws generic Error, not Rails ArgumentError"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 40
pr: 3884
claim: "2026-06-22T14:43:58Z"
assignee: "relation-handler-composite-pk-argumenterror-parity"
blocked-by: null
---

## Context

`RelationHandler.injectPrimaryKeySelect`
(`packages/activerecord/src/relation/predicate-builder/relation-handler.ts:51-53`)
throws a generic `Error` for a composite-PK subquery value, where Rails raises
`ArgumentError`:

```rb
# vendor/rails/.../predicate_builder/relation_handler.rb:13-14
if model.composite_primary_key?
  raise ArgumentError, "Cannot map composite primary key #{model.primary_key} to #{attribute.name}"
```

Two deviations:

- Error class: trails throws `Error`, Rails raises `ArgumentError`.
- Message interpolation: trails uses `pk.join(", ")`; Rails interpolates
  `model.primary_key` (the array's default `to_s`, e.g. `["shop_id", "id"]`),
  yielding a different string.

Surfaced (non-blocking) during review of PR #3844, which was scoped strictly to
removing the stricter-than-Rails single-column guard and left this pre-existing
composite-PK path untouched.

## Acceptance criteria

- [ ] Composite-PK subquery value raises `ArgumentError` (matching Rails), not a
      generic `Error`.
- [ ] Message string matches Rails' `model.primary_key` interpolation exactly.
- [ ] Mirror the corresponding Rails behavior with a test (no test renames).
- [ ] `test:compare` / `api:compare` delta >= 0.

## Rails source

- `vendor/rails/activerecord/lib/active_record/relation/predicate_builder/relation_handler.rb:13-14`
