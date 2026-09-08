---
title: "journey-formatter-cache-hash-shape"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=actiondispatch --direction=missing`
reports `actiondispatch/journey/formatter.ts#nonRecursive  count  -loop -if`.
The `-loop` half was converged in the journey-arm-and-short-circuit-triage PR
(the index walk is now Rails' `while queue.any?` / `queue.shift`,
`actionpack/lib/action_dispatch/journey/formatter.rb:173-174`). The two `-if`
rows survive, and they are structural rather than a spelling difference.

Rails' route cache is a plain nested Hash: `build_cache`
(`formatter.rb:214-223`) walks `route.required_defaults` and does
`h[tuple] ||= {}` per `[key, value]` pair, then appends to
`(leaf[:___routes] ||= []) << [i, route]`. Because a node is an ordinary Hash,
`non_recursive` (`formatter.rb:169-183`) has to ask before it reads:
`routes.concat(c[:___routes]) if c.key?(:___routes)` and
`queue << c[pair] if c.key?(pair)`.

trails
(`packages/actionpack/src/action-dispatch/journey/formatter.ts`, `buildCache` /
`nonRecursive`) uses a `CacheNode` record instead —
`{ children: Map<string, CacheNode>; routes: [number, Route][] }` with a
`pairKey(k, v)` string key. A node always carries a `routes` array and the child
lookup is a `Map.get`, so both `key?` guards have nothing to guard and vanish.
That is a Rails data shape the port replaced, not a TypeScript shortcoming, and
it also accounts for the two `-or` short-circuit rows on `buildCache` (the two
`||=`).

`CacheNode` and `pairKey` are trails inventions with no Rails counterpart.

## Acceptance criteria

- `buildCache` builds Rails' nested-Hash shape — a pair-keyed map whose route
  bucket is the `:___routes` slot — rather than a `CacheNode` record, so
  `non_recursive`'s two `key?` guards have something to guard.
- `nonRecursive` mirrors `formatter.rb:169-183` branch for branch, including
  both `if c.key?(...)` guards.
- `CacheNode` and `pairKey` are gone, or reduced to whatever Rails' Hash-of-pairs
  key actually needs; no new invented surface replaces them.
- `pnpm parity:api:arms:report --package=actiondispatch` no longer lists
  `journey/formatter.ts#nonRecursive`, and the two `buildCache` `-or` rows are
  read and either converged or given a written verdict.
- `pnpm parity:api --package actiondispatch` shows no regression on any axis;
  `pnpm parity:api:calls`, `:calls:args` and `:extra:gate` stay green.
- `pnpm vitest run packages/actionpack/src/action-dispatch/journey` passes.
