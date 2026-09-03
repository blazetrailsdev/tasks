---
title: "Drop the invented perform prefix from relation/spawn-methods.ts and relation/calculations.ts so spawn, merge and the five aggregates credit"
status: done
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 180
priority: 2
pr: 7417
claim: "2026-09-02T23:07:26Z"
assignee: "rename-finder-methods-to-rails-names"
blocked-by: null
closed-reason: null
---

## Context

The sibling of `rename-finder-methods-to-rails-names`, in the two other
relation mixin files that carry the same invented `perform` prefix. Different
files, so the two stories do not conflict.

**`relation/spawn-methods.ts`** — `spawn` and `merge` are exported as
`performSpawn` (`:15`) and `performMerge` (`:19`), and only the object-literal
keys carry the Rails names (`:64-70`). Rails defines them as plain methods in
`vendor/rails/activerecord/lib/active_record/relation/spawn_methods.rb:9` and
`:33`, and `Relation` includes the module, so both report missing on
`relation.rb`. The proof the rename is sufficient is in the same map:
`mergeBang` (`:42`), `except` (`:55`) and `only` (`:59`) carry Rails names and
credit today.

**`relation/calculations.ts`** — `count`, `average`, `minimum`, `maximum` and
`sum` are exported as `performCount` (`:237`) and siblings, wrapped at the map
as `count: inQueryConnection(performCount)` (`:593-601`). Rails:
`vendor/rails/activerecord/lib/active_record/relation/calculations.rb`. The
wrapper is not the blocker — `calculate` and `pluck` go through the same
`inQueryConnection` / `withDeferredDistinctPkPredicates` wrappers (`:603-604`)
and credit fine, because their exported functions carry the Rails names. Only
the prefix is.

7 methods, and 7 fewer novel names for `parity:api:extra`.

## Acceptance criteria

- `performSpawn`, `performMerge` and the five `perform*` calculation exports are
  renamed to the names `docs/ruby-ts-conventions.md` produces; the maps keep
  their wrappers and their keys become shorthand where no wrapper applies.
- activerecord `relation/calculations.rb` reaches **35/35**.
- `spawn` and `merge` credit on `relation.rb` as moves to
  `relation/spawn-methods.ts`; `relation.rb` rises by 2.
- Package total rises by 7 relative to whatever it is when this lands.
- `pnpm parity:api:extra --package activerecord` reports at least 7 fewer novel
  names; the mark is lowered with `:tighten`, never raised.
- `pnpm parity:api:calls`, `:calls:args` and `:params` clean, no new baseline
  row.

## Definition of done

Keeping a `perform*` alias beside the Rails name does not close this story; that leaves the invented name in the measured surface.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:extra --package activerecord
pnpm parity:api:extra:gate
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
```

A pure rename must leave all three ratchets green with no new baseline row. If
`parity:api:extra:gate` goes red because the mark now sits above the
measurement, lower it with `pnpm parity:api:extra:tighten` — never raise it.
