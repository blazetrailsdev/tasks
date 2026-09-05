---
title: "converge-join-dependency-nodes-and-instantiate-from-rows"
status: draft
updated: 2026-09-05
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/join-dependency.ts` exposes two public
members Rails' `JoinDependency` does not have:

- `nodes` (`:187-195`) — flattens `joinRoot` into the join parts with a
  `tableIndex >= 0`. Rails has no `nodes`; callers walk `join_root` through
  `Enumerable#each` (`join_dependency.rb:154-160`, `join_part.rb:31-33`).
- `instantiateFromRows` (`:504-...`) — a bespoke row-hydration pass returning
  `{ parents, associations, parentKeys }`. Rails' `instantiate`
  (`join_dependency.rb:180-220`) walks `join_root` with `construct` and returns
  the parent records alone; there is no per-key association map.

Both are read by `join-dependency.ts` itself (`:421`, `:432-440`, `:520-...`),
by `each`/`[Symbol.iterator]` (`:461-470`), and by several
`*.trails.test.ts` files (`join-dependency-extra-columns`,
`join-dependency-duplicate-objects`, `join-dependency-belongs-to-dedup`,
`join-dependency-nested-hydration`, `join-dependency-quoting`,
`join-dependency-spec`, `join-dependency-through-aliasing`,
`relation/cpk-eager-pluck-cache-version-composite-fk-collection`).

RFC 0027's `converge-instantiate-construct` closed without retiring the pair;
RFC 0130's receipt pass tagged them `CONVERGEABLE <this story>`.

## Acceptance criteria

- `instantiateFromRows` is folded into an `instantiate` that mirrors
  `join_dependency.rb:180-220` — `construct` recursion over `join_root`,
  returning the parent records.
- `nodes` is gone; walkers use `joinRoot.each` / the `Enumerable` mirror, as
  Rails does.
- The trails-only tests above are rewritten against the Rails-shaped surface
  (they are `.trails.test.ts`, so no ported test name changes).
- Both `@noRailsEquivalent CONVERGEABLE` tags in `join-dependency.ts` are
  deleted and the extra-surface mark is tightened.
