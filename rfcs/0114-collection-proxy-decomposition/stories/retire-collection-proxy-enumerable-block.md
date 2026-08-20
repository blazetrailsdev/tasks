---
title: "Retire CollectionProxy's Enumerable block onto RECORD_DELEGATES (relation/delegation.rb:99-102)"
status: in-progress
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6759
claim: "2026-08-20T02:52:30Z"
assignee: "retire-collection-proxy-enumerable-block"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/collection-proxy.ts:383-497` hand-writes
an array-likeness block over `this._target` — **62 code lines** across
`length` (`:383`), `[Symbol.iterator]` (`:393`), `at` (`:397`), `map` (`:401`),
`filter` (`:406-414`), `forEach` (`:415`), `some` (`:419`), `every`
(`:427-440`), `any` (`:441`), `slice` (`:463`), `reduce` (`:467-475`),
`indexOf` (`:476`), `flatMap` (`:480`), `keys` (`:484`) and `entries` (`:493`).

Rails writes none of them on `CollectionProxy`. They come from
`include Enumerable`
(`vendor/rails/activerecord/lib/active_record/relation.rb:67`) plus
`delegate ... to: :records`
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:99-102`),
resolved through `records` — which on a proxy is `load_target`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1024-1026`).

RFC 0107 already built the mechanism and retired the identical block from
`relation.ts` (stories `give-relation-enumerable-surface-one-mechanism` and
`resolve-relation-enumerable-delegation-surface`, both done):
`RECORD_DELEGATES` (`packages/activerecord/src/relation/delegation.ts:917`),
the `DelegationMethods` mixin, and `delegateRecordMethodSync` (`:1009`) — which
exists _specifically_ to give a loaded `CollectionProxy` the synchronous path
(see the comment at `delegation.ts:915`). The proxy was never migrated onto it.

Cost of not migrating: `pnpm parity:api:extra --package activerecord` scores
`associations/collection-proxy.ts` at 6 novel names, and **four of them**
(`every`, `flatMap`, `reduce`, `some`) are in this block; `any`, `at`, `map`,
`filter`, `forEach`, `keys`, `entries`, `indexOf` and `slice` are counted moved.

## Converged shape

Delete the block. Route each name through `RECORD_DELEGATES` /
`delegateRecordMethodSync`, extending `RECORD_DELEGATES` where a name is
genuinely missing from it (that file is the one place the `to: :records` list
lives). `[Symbol.iterator]` keeps its `@noRailsEquivalent PERMANENT` tag —
JS iteration protocol has no Ruby counterpart — but it iterates the delegated
records, not a private field.

`[Symbol.asyncIterator]` (`collection-proxy.ts:2707`) is NOT in scope: its
`@noRailsEquivalent PERMANENT` receipt stands.

## Acceptance criteria

- `collection-proxy.ts:383-497` is gone; every listed name resolves through
  `relation/delegation.ts`.
- `pnpm parity:api:extra --package activerecord` reports **2 or fewer** novel
  names for `associations/collection-proxy.ts` (down from 6), and no new
  allowlist row or `@noRailsEquivalent` tag is added.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` add zero baseline
  rows for this file (it has none today, and must keep none).
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
- Existing suites pass unchanged, including
  `packages/activerecord/src/associations/collection-proxy.test.ts` and
  `collection-association-reader-proxy.trails.test.ts`. No test renamed.
