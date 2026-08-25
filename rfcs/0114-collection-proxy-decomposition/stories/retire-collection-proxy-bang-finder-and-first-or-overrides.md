---
title: "Delete the nine finder overrides Rails inherits unchanged (first!/last!/take!/many?/one?/exists?/first_or_*)"
status: done
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["collection-proxy-initialize-is-five-lines"]
deps-rfc: []
est-loc: 250
priority: null
pr: 6758
claim: "2026-08-20T02:22:31Z"
assignee: "collapse-collection-proxy-toarray-onto-load"
blocked-by: null
closed-reason: null
---

## Context

A Rails `CollectionProxy` answers `first!`, `last!`, `take!`, `many?`, `one?`,
`exists?`, `first_or_create`, `first_or_initialize` and `first_or_create!`
**with no override at all**. It inherits them from `Relation` /
`FinderMethods`, and they work on the target because the proxy redefines only
the two seams those bodies read: `records` is `load_target`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1024-1026`)
and `loaded?` is `@association.loaded?` (`:53-55`). The only finder members
Rails _does_ override are `find` (`:138`), `last` (`:259`), `take` (`:289`),
`find_nth_with_limit` (`:1140`) and `find_nth_from_last` (`:1145`) — each a
`load_target if find_from_target?` + `super` pair.

`packages/activerecord/src/associations/collection-proxy.ts` overrides the whole
set anyway — **77 code lines**: `firstBang` (`:1775`, 7), `lastBang` (`:1803`,
7), `takeBang` (`:1830`, 7), `many` (`:1871`, 12), `one` (`:1891`, 3), `exists`
(`:1900`, 24), `firstOrInitialize` (`:1930`, 6), `firstOrCreate` (`:1942`, 6),
`firstOrCreateBang` (`:1954`, 6). `parity:api:extra` counts every one as moved,
naming `relation/finder_methods.rb`, `relation.rb` and `querying.rb` as their
owners — the fingerprint of an override with no Rails counterpart.

The overrides exist because the trails proxy carries its own seeded `Relation`
state, so `super` runs against the wrong relation. That is the sibling story
`collection-proxy-initialize-is-five-lines`, which this one depends on: once the
proxy delegates to `scope` and reads the target through `records`/`loaded?`, the
inherited bodies are correct as written and the overrides are deletable.

Rails' own five overrides stay, in their Rails shape.

## Converged shape

Delete the nine overrides. Keep `find`, `last`, `take`, `findNthWithLimit`,
`findNthFromLast` as the `loadTarget if isFindFromTarget()` + `super` pairs
Rails writes (`:1788-1870` — verify each is exactly that shape and converge any
that is not).

## Acceptance criteria

- `firstBang`, `lastBang`, `takeBang`, `many`, `one`, `exists`,
  `firstOrInitialize`, `firstOrCreate`, `firstOrCreateBang` no longer exist in
  `collection-proxy.ts`.
- `last`, `take`, `findNthWithLimit`, `findNthFromLast` are each
  `loadTarget()`-if-`isFindFromTarget()` + `super`, matching
  `collection_proxy.rb:259/289/1140/1145`.
- `pnpm parity:api:extra --package activerecord` moved count for this file drops
  by at least 9.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
- Existing suites pass unchanged, incl. `collection-proxy.test.ts`,
  `find-from-target.trails.test.ts`,
  `assoc-has-many-collection-first-caching` coverage,
  `collection-proxy-first-no-strict-loading-cascade` coverage. No test renamed.
