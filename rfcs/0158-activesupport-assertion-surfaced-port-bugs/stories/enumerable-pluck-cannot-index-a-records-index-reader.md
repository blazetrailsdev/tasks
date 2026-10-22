---
title: "activerecord: Relation#pluck's loaded arm open-codes records.pluck over record.get"
status: draft
updated: 2026-10-01
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Enumerable#pluck`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:145-152`)
is `map { |element| element[key] }`: it sends `[]` to each element, so over
records it reads `ActiveRecord::AttributeMethods#[]`.

trails#8628 gave activesupport's `pluck`
(`packages/activesupport/src/enumerable-utils.ts:98-104`) that seam: it reads
each element through ruby-compat's `hashAref`. `batchOnUnloadedRelation`'s
load arm now calls it (`packages/activerecord/src/relation/batches.ts:513-515`,
`batches.rb:437`).

`Relation#pluck`'s loaded arm still open-codes the map
(`packages/activerecord/src/relation/calculations.ts:434-440`):

```ts
return records.map((record) =>
  columnNames.length > 1
    ? columnNames.map((column) => record.get(String(column)))
    : record.get(String(columnNames[0])),
);
```

where Rails is `records.pluck(*column_names)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:300-301`).
Check `pick`'s loaded arm (`calculations.rb`, `def pick`) in the same pass.

## Acceptance criteria

- [ ] `Relation#pluck`'s loaded arm calls activesupport's `pluck(records, ...columnNames)`,
      as `calculations.rb:301` does, and `pick` follows its Rails body.
- [ ] The composite-key `pluck` / `find_each` tests in `calculations.test.ts`
      and `batches.test.ts` stay green.
