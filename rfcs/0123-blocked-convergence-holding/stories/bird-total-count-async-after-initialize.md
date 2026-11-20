---
title: "bird-total-count-async-after-initialize"
status: blocked
updated: 2026-09-24
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-09-24T18:14:09Z"
assignee: "attribute-assignment-argument-error-names-js-number-not-integer"
blocked-by: "Rails bird.rb:22-24 runs Bird.count inside after_initialize; trails runs the initialize chain strict-sync from the constructor (core.ts:676, base.ts:1727/1828, runCallbacks strict:'sync') and Relation#count is an awaited query, so no synchronous count exists to assign total_count before firstOrInitialize returns. Needs an awaitable new/initialize path (RFC 0087 one-surface-always-awaited), not a model-side fix."
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` (RFC 0132). The parked test is **"first or initialize with block"** in `packages/activerecord/test/cases/relations.test.ts`.

- Rails: `vendor/rails/v8.0.2/activerecord/test/models/bird.rb:22-24`. When `enable_count` is set, `after_initialize` sets `total_count` from `Bird.count`.
- trails: the test model `bird.ts` fires `Bird.count()` unawaited, so `totalCount` is still 0 when the test reads it. That also breaks the RFC 0234 promise rule.
- The `after_initialize` chain runs synchronously from the constructor (`runCallbacks` strict sync), and `count` is an awaited query.

## Ruling

Ruled by the operator on 2026-11-20 (async create paths only): `new Klass` stays synchronous (RFC 0087). The awaited entry points Rails reaches through `new` (`create`, `create!`, `first_or_initialize`, `find_or_initialize_by`, association `build`/`create`) run the query-bearing part awaited, right after construction and before returning, at the position Rails runs it. A bare `new Klass(...)` keeps the synchronous refusal, receipted `PERMANENT` against packages/activerecord/CLAUDE.md § "A record is built with `new Klass` only". Parking the work until save stays banned. This story is an entry dependency of `entry-check-data-layer-parity-is-closed-on-8-0-2` (RFC 0191).

## Acceptance criteria

- Awaited construction paths (`firstOrInitialize`, `findOrInitializeBy`, `create`, `createBang`, association `build`/`create`) await any promise an `after_initialize` callback returns before they return the record. A synchronous `new Klass` still runs callbacks strictly synchronously. Before the change, a callback that returns a promise there raises; it is never dropped.
- `bird.ts` mirrors `bird.rb`: `after_initialize` assigns `totalCount` from `await Bird.count()` with no `void`/unawaited promise.
- "first or initialize with block" is un-skipped and passes with its Rails assertions unchanged.
- The bare-`new` arm is receipted `PERMANENT` at the refusal site.
