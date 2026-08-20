---
title: "Derive the delegate-to-scope list from the mixin objects' keys, not two hand-transcribed arrays"
status: in-progress
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6756
claim: "2026-08-20T01:52:31Z"
assignee: "derive-collection-proxy-delegate-list-from-mixin-keys"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/collection-proxy.ts:2755-2929` is
**139 code lines** expressing what Rails writes in 12:

```ruby
delegate_methods = [QueryMethods, SpawnMethods].flat_map { |klass|
  klass.public_instance_methods(false)
} - self.public_instance_methods(false) - [:select] + [
  :scoping, :values, :insert, :insert_all, :insert!, :insert_all!,
  :upsert, :upsert_all, :load_async
]
delegate(*delegate_methods, to: :scope)
```

(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`)

trails hand-transcribes the module method names:
`QUERY_METHODS_PUBLIC_INSTANCE_METHODS` (`:2755`, an 83-line string array) and
`SPAWN_METHODS_PUBLIC_INSTANCE_METHODS` (`:2841`, 7 lines), then applies the
`- self.public_instance_methods(false) - [:select]` subtraction and the extra
list faithfully at `:2849`, and defines the property descriptors at `:2880` and
`:2892`.

The subtraction and descriptor halves are correct ports. The two hand-lists are
not: they are a copy of a list the repo already holds. `SpawnMethods`
(`packages/activerecord/src/relation/spawn-methods.ts:138`) and
`QueryMethodBangs` (`packages/activerecord/src/relation/query-methods.ts:2651`)
are the exact mixin objects `include()` mixes into `Relation`
(`packages/activerecord/src/relation.ts:3624-3628`), so `Object.keys()` on them
IS `public_instance_methods(false)`.

A hand-list is also a live hazard: a query method added to a mixin is silently
not delegated by the proxy, with no gate to catch it.

## Converged shape

Derive the delegate list from the mixin objects' own keys. Today that covers
`SpawnMethods` in full and the bang half of `QueryMethods`; the non-bang
`QueryMethods` members still live on `Relation` itself and only become derivable
as RFC 0107's `fan-out-query-methods-*` stories move them into
`relation/query-methods.ts`.

So: replace `SPAWN_METHODS_PUBLIC_INSTANCE_METHODS` and the bang half of
`QUERY_METHODS_PUBLIC_INSTANCE_METHODS` with `Object.keys(...)` over the mixins,
keep the residual non-bang names as a shrinking hand-list, and add a test that
asserts the residual holds **only** names no exported mixin carries — so the
list cannot silently regrow and each 0107 fan-out story mechanically shrinks it.

Do not change the subtraction, the extra-name list, or the descriptor shapes:
those are the faithful part.

## Acceptance criteria

- `SPAWN_METHODS_PUBLIC_INSTANCE_METHODS` and
  `QUERY_METHODS_PUBLIC_INSTANCE_METHODS` are both gone, replaced by
  `Object.keys(SpawnMethods)` and `Object.keys(QueryMethodBangs)`. (Revised
  during PR #6756: the story expected a residual non-bang hand-list, on the
  premise that those members still lived on `Relation` itself. They do not —
  `QueryMethodBangs` already carries the whole module and `relation.ts` mixes it
  in with `include()`, so the non-bang half was derivable in this story too and
  no residual remains. The subtraction that DOES need naming is Ruby's `private`
  keyword, `query_methods.rb:1677` / `spawn_methods.rb:71`, which a JS object
  literal cannot express.)
- A new test in `collection-proxy.test.ts` (or a `.trails.test.ts` sibling)
  asserts no hand-transcribed name remains — every delegated name is a key of an
  exported mixin — and that no private mixin member is delegated.
- The delegated set changes only where the hand-list diverged from Rails, and
  every delta cites `query_methods.rb`. (Revised during PR #6756: the criterion
  read "byte-identical to today's", but deriving the list surfaced three
  hand-list errors, all of which converge by changing the set. Gained
  `asyncBang` — `async!` is defined at `query_methods.rb:1656`, before the
  `private` at `:1677`, so Rails delegates it. Gained `arelColumns`,
  `buildSubquery`, `buildWhereClause`, `buildHavingClause`, `leftJoins`,
  `without` and `_selectBang` for the same reason — all public in
  `query_methods.rb`, all delegated by Rails. Lost `rewhereBang` and `nullBang`:
  neither `rewhere!` nor `null!` exists in Rails or in trails, so their
  descriptors delegated to an undefined `scope` member.)
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
