---
title: "bird-total-count-async-after-initialize"
status: done
updated: 2026-11-20
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10438
claim: "2026-11-20T19:27:38Z"
assignee: "bird-total-count-async-after-initialize"
blocked-by: null
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

## Re-cut 2026-11-25 against RFC 0087 "Amendment 2026-11-25"

Supersedes the acceptance criteria above.

- [ ] Every awaited construction path in the amendment's point 2 runs `_runInitializeCallbacks` through `deferringToAssignment` even when no attribute was captured, and awaits it before returning.
- [ ] `bird.ts` awaits `Bird.count()` in its `after_initialize`; a bare `new Bird` with `enableCount` raises, receipted `PERMANENT`.
- [ ] "first or initialize with block" un-skipped with Rails' assertions.
