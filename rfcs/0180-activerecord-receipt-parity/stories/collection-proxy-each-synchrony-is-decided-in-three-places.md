---
title: "activerecord: whether a relation's each is synchronous is decided in withRecords, the relation handler and Association#loadTarget"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8695, which included `Enumerable` on `Relation` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:67`) and deleted `CollectionProxy`'s own `[Symbol.iterator]`.

Rails' `Delegation` delegates `each` to `records` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb`), and a proxy's `records` is `load_target` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_proxy.rb:1024-1026`), which is synchronous. trails carries three pieces of machinery in its place:

- `withRecords` (`packages/activerecord/src/relation/delegation.ts`) calls `host.records()` for a host that is not loaded and then re-reads the loaded state, so a proxy whose association has nothing to find answers synchronously. `CollectionProxy#records` is `async` and cannot return the array itself, because `Relation#records` is typed `Promise<T[]>` and five callers chain `.then` on it (`relation.ts` handler twice, `relation/delegation.ts`, `relation/query-methods.ts`, `relation/calculations.ts`).
- `isEachSynchronous` (`packages/activerecord/src/relation.ts`) makes the relation Proxy handler hide `[Symbol.iterator]` (`get` and `has`) until `each` can answer synchronously. It reads the protected `Association#isFindTarget` and `isStaleTarget` through an `any`-typed receiver, and repeats the load condition of `Association#loadTarget` (`packages/activerecord/src/associations/association.ts`).
- The loaded predicate `isLoaded && !isScheduled && !_loadResult` is written twice: `isRecordsLoaded` in `relation.ts` and `loaded()` in `withRecords`.

The hiding exists because vitest's `toBe` / `toEqual` read `Symbol.iterator` off both operands, and an iterator that called `each` on an unloaded relation started a query from inside an assertion.

One behaviour changed: an unloaded proxy on a persisted owner is not iterable, where before trails#8695 `for…of` yielded its in-memory target. Rails' `each` loads there.

## Acceptance criteria

- [ ] One predicate decides both whether `each` answers synchronously and whether `[Symbol.iterator]` is visible; `withRecords` and the relation handler read it, and it is not restated.
- [ ] The handler does not reach a protected `Association` member through `any`; the association answers the question through a typed member, or `records` on a proxy answers `load_target` directly.
- [ ] `withRecords` has no re-check after `records()`.
- [ ] `collection-proxy.trails.test.ts` "iterates the built records of a new owner" and "is not iterable, and starts no load" stay green, and a vitest `toBe` between two unloaded relations starts no query.
