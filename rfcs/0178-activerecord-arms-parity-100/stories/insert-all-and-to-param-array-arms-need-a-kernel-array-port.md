---
title: "activerecord: port Kernel#Array and converge the insert-all / to_param arms that open-code it"
status: draft
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-g-p-part-1`. Every row below invents an
`if` only because Ruby's `Kernel#Array` (`vendor/ruby/v3.3.11/object.c:3791` `rb_Array`: `rb_check_array_type`,
then `rb_check_to_array`, else a one-element array) has no trails port, so each call site open-codes
`Array.isArray(x) ? x : [x]`. `scripts/api-compare/call-args.ts` `KERNEL_CONVERSION_METHODS` already folds the
leading capital, so the port is spelled `array(...)` and lives in `packages/ruby-compat/src/array.ts` beside
`rbCheckArrayType`, with a `@noRailsEquivalent PERMANENT` receipt.

Rows (`pnpm parity:api:arms:report --package=activerecord --direction=invented`):

- `insert-all.ts#returning` — `+if +if` — `insert_all.rb:252-266` (`Array(insert_all.returning).map`, `model.attribute_alias?`; the port also reads `attributeAliases` and strips a Symbol colon)
- `insert-all.ts#resolveAttributeAliases` — `+if +if` — `insert_all.rb:119-128` (`Array(@update_only).map … if @update_only`, same for `@unique_by`)
- `insert-all.ts#configureOnDuplicateUpdateLogic` — `+if` — `insert_all.rb:134-149` (`@updatable_columns = Array(update_only)`)
- `insert-all.ts#findUniqueIndexFor` — `+if` x6 — `insert_all.rb:155-172`. Beyond `Array(name_or_columns)` / `Array(i.columns)`, the port invents an `instanceof IndexDefinition` early return, re-wraps a found index in a new `IndexDefinition`, compares by `join(",")` where Rails uses `==`, and builds its own error display string.
- `insert-all.ts#uniqueByColumns` — `+if +if` — `insert_all.rb:198-200` (`Array(unique_by&.columns)`)
- `insert-all.ts#timestampsForCreate` — `+loop` — `insert_all.rb:215-217` (`index_with`). `indexWith` returns a `Hash` (a `Map`), and `reverseMerge` (`activesupport/src/hash-utils.ts`) spreads `otherHash`, which is empty for a `Map`, so `mapKeyWithValue`'s `reverseMergeBang(attributes, timestampsForCreate())` needs the Map arm first.
- `integration.ts#toParam` — `+if` — `integration.rb:57-60` (`Array(id).join(self.class.param_delimiter)`)

## Acceptance criteria

- [ ] `array` is ported in ruby-compat from `rb_Array` with its MRI citation and a unit test.
- [ ] Each body above calls it where Rails calls `Array(...)` and matches Rails' control flow.
- [ ] The invented-direction report shows 0 rows for these seven methods.
