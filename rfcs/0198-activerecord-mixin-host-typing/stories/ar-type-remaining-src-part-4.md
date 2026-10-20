---
title: "ar-type-remaining-src-part-4: base include-list hosts, static accessors, and the unshipped strip pass"
status: in-progress
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9151
claim: "2026-10-20T19:49:38Z"
assignee: "ar-type-remaining-src-part-4"
blocked-by: null
closed-reason: null
---

## Context

`ar-type-remaining-src-part-3` (trails#9144) took the cast-count gate from 518 to 473. A further pass was prepared locally but not shipped before merge. It reached 429 (−44 more) with `pnpm typecheck` green. Every change is type-only:

- **Mechanical `as any` strip.** Removed `(x as any)` and `x as any` where the plain expression already type-checks. Mostly `connection-adapters/postgresql-adapter.ts` (13 lines), plus one line each in `primary-key.ts`, `abstract-adapter.ts`, `abstract-mysql-adapter.ts`, `insert-all.ts`, `locking/optimistic.ts`, `nested-attributes.ts`, `reflection.ts`, `relation/merger.ts` and `scoping/named.ts`. Re-derive these by stripping, running typecheck and reverting the lines that fail.
- **`this: any` → `this: typeof Base` / `this: Base`** on mixin functions where Base already carries the members. That covers 22 sites across `callbacks.ts`, `scoping/default.ts`, `relation/delegation.ts`, `encryption/extended-deterministic-queries.ts`, `enum.ts` and others. `relation/batches.ts` `recordCursorValues` has to stay `any`, because a Relation is its receiver.
- **`autosave-association.ts`.** `defineNonCyclicMethod`, `addAutosaveAssociationCallbacks` and `defineAutosaveValidationCallbacks` take `this: typeof Base`. Their generated bodies take `this: Base`, and `_alreadyCalled` is typed as `Record<string, boolean>`. This matches `autosave_association.rb` `define_non_cyclic_method`.
- **`core.ts`.** `findBy` reads `this.attributeAliases` and `this.where` once `CoreHost` declares `attributeAliases?` and `where(...)`.
- **`database-statements.ts`.** `resetTransaction` drops `const self = this as any`. `new TransactionManager(this)` still needs a cast, because `DatabaseStatementsHost` is not a `TransactionConnection`.

Still open after that pass:

- **`base.ts:2376-2456` include-list `.call(this as any, …)`, 9 lines.** Base lacks the host members `allTimestampAttributesInModel` (instance-wired at `timestamp.ts:236`; Rails `timestamp.rb:155`), `_touchAttrNames` and `_skipDirtyTracking`. `InstanceCounterHost` (`counter-cache.ts:142`) wants `constructor: typeof Base`. Declaring the members on the `Base` interface breaks `touch-later.test.ts` `TouchLaterHost` assignability, so the touch-later tests need canonical receivers.
- **Static accessors that cannot declare `this`.** These are `inheritance.ts:138-149` `abstractClass`, `locking/optimistic.ts:91-99` `lockingColumn`, `signed-id.ts:26-46` `signedIdVerifier`, and `core.ts:215-227` `arelTable` / `predicateBuilder`. They need the ivar declared on the host class.

## Acceptance criteria

- [ ] Re-apply the strip and `this: any` passes above. The cast-count gate falls by at least 40 lines from its value at the start of this story.
- [ ] Remove the base.ts include-list casts by declaring the host members on `Base` and fixing the touch-later test receivers.
- [ ] Typing only. `pnpm typecheck`, `parity:api:extra:gate` and `parity:api:calls` stay green.
