---
title: "Port RangeHandler::RangeWithBinds so range_handler.rb stops at 3/9, and retire the missingRailsCall receipt it forced"
status: done
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: 3
pr: 7456
claim: "2026-09-03T19:46:04Z"
assignee: "move-postgresql-schema-statement-privates-to-their-rails-file"
blocked-by: null
closed-reason: null
---

## Context

Measured on `origin/main` `8f2de0daf` after a clean `pnpm build`, with
`API_COMPARE_FORCE=1 pnpm parity:api --package activerecord`:

```text
relation/predicate_builder/range_handler.rb  ->  .../range-handler.ts   3   6   9   33%
```

The worst-scoring file in the package, and the six are one Ruby line:

```ruby
class RangeHandler # :nodoc:
  RangeWithBinds = Struct.new(:begin, :end, :exclude_end?)
```

(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder/range_handler.rb:6`).
`Struct.new` generates a reader and a writer per member, and
`extract-ruby-api.rb` credits all six: `begin`, `begin=`, `end`, `end=`,
`exclude_end?`, `exclude_end?=`.

trails has no `RangeWithBinds` at all. `RangeHandler#call`
(`packages/activerecord/src/relation/predicate-builder/range-handler.ts:16-20`)
passes a bare object literal into `attribute.between` instead:

```ts
return attribute.between({ begin: beginBind, end: endBind, excludeEnd: value.excludeEnd });
```

and carries a `/** @missingRailsCall new — PERMANENT */` receipt on `call` to
account for the `RangeWithBinds.new` that Rails makes and trails does not.
This is bucket C — behavior the port does not have — not a placement or
visibility miss.

## Converged shape

Port `RangeWithBinds` as a real named entity in
`packages/activerecord/src/relation/predicate-builder/range-handler.ts`,
nested under `RangeHandler` as Rails nests it, with the reader/writer pair per
member that `Struct.new` generates. Per `docs/ruby-ts-conventions.md` the six
names are `begin` / `setBegin`, `end` / `setEnd`, `isExcludeEnd` /
`setExcludeEnd`. `call` then constructs one and hands it to
`attribute.between`, which retires the `@missingRailsCall new — PERMANENT`
receipt on `call` rather than leaving a stale one.

The consumer side matters: whatever in `arel` reads `between`'s argument today
reads the object literal's `begin` / `end` / `excludeEnd` keys, and must be
converged onto the ported entity's readers in the same change — grep
`attribute.between` and `Nodes.Between` before starting. Rails' own consumer
(`Arel::Nodes::Between` / the `Range`-shaped duck) reads exactly these three,
so the ported shape is the one arel should want.

## Acceptance criteria

- `relation/predicate_builder/range_handler.rb` reads **9/9** with
  `DeclOnly 0`.
- `RangeWithBinds` is a real entity with real bodies — no `declare`, no
  bodyless signature, no interface-only shape.
- The `@missingRailsCall new — PERMANENT` receipt on `RangeHandler#call` is
  deleted, not re-spelled, because the call now happens.
- Range predicate behavior is unchanged: the `between` / range-predicate suites
  and `pnpm parity:api:calls`, `:calls:args`, `:params` stay green, on every
  adapter lane.
- No baseline row, no allowlist widening, no `@noRailsEquivalent` receipt;
  `pnpm parity:api:extra:gate` stays green.
