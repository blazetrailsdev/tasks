---
title: "Relocate core_ext/enumerable.rb methods into core-ext/enumerable.ts and converge sole"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines its whole `Enumerable` / `Array` / `Hash` / `Range` reopening in one file, `vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb`. trails#8271 created its TS mirror, `packages/activesupport/src/core-ext/enumerable.ts`, and moved in `SoleItemExpectedError` (`enumerable.rb:21`) and `Range#sum` (`:241-253`). Every other method from that file still lives in `packages/activesupport/src/enumerable-utils.ts`, and `parity:api` reports each one as a "move":

- `minimum` (`enumerable.rb:32`), `maximum` (`:40`), `index_by` (`:52`), `index_with` (`:75`), `many?` (`:93`), `including` (`:112`), `exclude?` (`:118`), `excluding` / `without` (`:132`), `pluck` (`:145`), `pick` (`:161`), `compact_blank` (`:184`), `in_order_of` (`:197`), `sole` (`:211`)
- `Hash#compact_blank` (`:222`), `Hash#compact_blank!` (`:232`), `Array#compact_blank!` (`:263`)

When #8271 created the file, 13 of those pairs' `scripts/api-compare/body-pins.json` pins went STALE and were dropped (`compact_blank`, `exclude?`, `excluding`, `in_order_of`, `including`, `index_by`, `index_with`, `many?`, `maximum`, `minimum`, `pick`, `pluck`, `sole`). They can be re-pinned once the pairs resolve again.

The split also leaves an import cycle: `enumerable-utils.ts` imports `SoleItemExpectedError` from `core-ext/enumerable.ts`, which imports `sum` back from `enumerable-utils.ts`. It is safe only because both reads happen at call time.

`sole` also diverges in shape. Rails is:

```ruby
def sole
  case count
  when 1   then return first
  when 0   then raise ActiveSupport::EnumerableCoreExt::SoleItemExpectedError, "no item found"
  when 2.. then raise ActiveSupport::EnumerableCoreExt::SoleItemExpectedError, "multiple items found"
  end
end
```

trails' `sole(collection, fn?)` takes an invented `fn` filter parameter that Rails does not have. #8271 converged only the error class and messages.

## Acceptance criteria

- [ ] Every `core_ext/enumerable.rb` method listed above lives in `packages/activesupport/src/core-ext/enumerable.ts`. `parity:api` reports 0 moves for `core_ext/enumerable.rb`, and `index.ts` / test imports are re-pointed.
- [ ] The `enumerable-utils.ts` <-> `core-ext/enumerable.ts` import cycle is gone.
- [ ] `sole` mirrors `enumerable.rb:211-217` (`case count`, no `fn` parameter), and its callers are updated.
- [ ] The dropped `body-pins.json` rows are re-pinned with `tsx scripts/api-compare/body-pins.ts --pin core_ext/enumerable.rb`.
