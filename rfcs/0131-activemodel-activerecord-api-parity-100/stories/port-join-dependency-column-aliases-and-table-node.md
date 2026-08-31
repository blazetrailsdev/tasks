---
title: "Port Aliases#column_aliases and the Aliases::Table node seat in join_dependency"
status: draft
updated: 2026-08-31
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 220
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`associations/join_dependency.rb` sits at 24/27, missing `column_aliases`,
`node` and `node=` — none declaration-only, so all three are genuinely absent
from trails.

Rails —
`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb`:

- `Aliases#column_aliases(node)` at `:29`, `@columns_cache[node]`, read by
  `Aliases#columns` at `:25`.
- `Aliases::Table = Struct.new(:node, :columns)` at `:37`, whose Struct member
  `node` is the reader and writer the extractor reports, with its own
  `Table#column_aliases` at `:39` mapping columns to aliased attributes.

trails has no `columnAliases` anywhere in `packages/activerecord/src`, so this
is a real port, not a move: the `Aliases::Table` seat and the per-node alias
cache both need building, and `columns` needs rewriting to flat-map over them
the way Rails does rather than whatever shortcut currently stands in.

RFC 0119 already touches this file's neighbourhood
(`fidelity: adapter layout / join dependency`); this story is scoped to the
`Aliases` inner class only and must not widen into the join-dependency tree.

## Acceptance criteria

- `Aliases` gains `columnAliases(node)` over a per-node cache, and the `Table`
  seat gains its `node` reader/writer pair and its own `columnAliases`, each
  matching the Rails body line for line.
- `Aliases#columns` is the flat-map over `tables` Rails writes, not a
  reimplementation.
- activerecord `associations/join_dependency.rb` reaches **27/27**; package
  total rises by 3.
- The eager-loading and join tests pass on all adapter lanes;
  `pnpm parity:api:calls` and `:calls:args` clean.

## Definition of done

Widening into the join-dependency tree does not close this story; the scope is the `Aliases` inner class, and RFC 0119 owns its neighbourhood.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm vitest run packages/activerecord/src/associations/join-dependency.test.ts
```
