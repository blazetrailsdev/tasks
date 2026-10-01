---
title: "activesupport/activerecord: Enumerable#pluck cannot send [] to a record, so records.pluck is open-coded"
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

`batch_on_unloaded_relation`'s load arm is `values = records.pluck(*cursor)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches.rb:437`). `Enumerable#pluck`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:145-152`) is
`map { |element| element[key] }`: it SENDS `[]` to each element, so over records it reads
`ActiveRecord::AttributeMethods#[]`.

trails' `pluck` (`packages/activesupport/src/enumerable-utils.ts`) reads the JS property
`element[key]`. For a record that is the generated reader, not `[]`: `record.id` on a composite-key
model answers the whole key where `record["id"]` answers the `id` column, so
`.find_each with multiple column ordering and using composite primary key`
(`batches_test.rb:1025-1039`) yields 2 of 3 books through it. The port therefore open-codes the map
at `packages/activerecord/src/relation/batches.ts` (load arm), over `record.get(key)`, the spelling
trails gives a class's `[]` (docs/ruby-ts-conventions.md § Operators):

```ts
values = records.map((record) =>
  cursor.length > 1 ? cursor.map((key) => record.get(key)) : record.get(cursor[0]),
);
```

`Relation#pluck`'s loaded arm (`relation/calculations.rb:300-301`, `calculations.ts`) and
`pick`'s open-code the same `records.pluck(*column_names)` the same way.

There is no `[]`-dispatch seam: nothing in ruby-compat sends `[]` to a receiver, so `pluck` cannot
index a record, a `Map`-backed hash, or any other class whose `[]` is ported as `get`. Teaching
activesupport's `pluck` to probe for a `get` method was tried on trails#8354 and rejected in review:
it changes behaviour for any plain object that happens to carry an unrelated `get`.

A receipt at the site is not available: the other two arms call `batch_relation.pluck(*cursor)`, so
`pluck` is not a flagged call on this pair and a `@missingRailsCall pluck` tag is STALE.

Surfaced by trails#8354.

## Acceptance criteria

- [ ] A decided seam for sending Ruby's `[]` to a receiver (records, hashes ported as `Map`, plain
      objects), cited to MRI / the Rails definers it stands in for.
- [ ] `pluck` (`enumerable.rb:145-152`) reads each element through that seam.
- [ ] `batchOnUnloadedRelation`'s load arm, `Relation#pluck`'s loaded arm and `pick`'s call `pluck`
      over the records, as `batches.rb:437` and `calculations.rb:301` do.
