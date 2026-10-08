---
title: "activerecord: Relation includes an Enumerable derived from its async each, so CollectionProxy drops its [Symbol.iterator]"
status: in-progress
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8695
claim: "2026-10-08T20:49:01Z"
assignee: "adapter-facts-section-does-not-cover-verify-or-mismatched-foreign-key"
blocked-by: null
closed-reason: null
---

## Context

Split out of `association-symbol-iterators-come-from-ruby-compat-enumerable`, which converged the
`JoinPart` half (`include(JoinPart, Enumerable)`, `join_part.rb:13`) and could not converge this one.

`packages/activerecord/src/associations/collection-proxy.ts` `CollectionProxy` hand-writes
`[Symbol.iterator]` over `this.target` and carries `@noRailsEquivalent CONVERGEABLE` onto this story.
Rails' is `CollectionProxy < Relation` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_proxy.rb:31`),
`Relation` is `include Enumerable` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:67`), and `each` reaches the
records through `records`, which is `load_target` on a proxy (`collection_proxy.rb:1024-1026`).

`include(Relation, Enumerable)` (ruby-compat's `Enumerable`, `packages/ruby-compat/src/enumerable.ts`)
was tried and reverted, for two measured reasons:

- ruby-compat's `Enumerable` installs `map`, `findAll`, `select`, `first`, `isAny`, `isInclude` and
  `[Symbol.iterator]`, each derived from a synchronous `each`. `Relation#each`
  (`packages/activerecord/src/relation/delegation.ts` `Delegation#each`, through `withRecords`) is
  synchronous only for a loaded relation and returns a promise otherwise, so on an unloaded relation
  every derived member sees no element and answers empty.
- `map` and `findAll` are answered today by `CLASS_SPECIFIC_RELATION_HANDLER`'s `ENUMERABLE_METHODS`
  table (`packages/activerecord/src/relation.ts`), which awaits `records()`. The trap returns a
  prototype member first, so the included synchronous `map` / `findAll` shadow it:
  `await Post.where(...).map(fn)` on an unloaded relation becomes `[]`.

The proxy's own iterator also yields an unloaded proxy's in-memory target (built records on a new
owner), which an `each`-derived iterator would not: `load_target` is synchronous in Rails for an
owner with nothing to find and asynchronous wholesale in trails.

`batch-enumerator-enumerable-over-an-async-each` is the sibling story for the same question on
`BatchEnumerator`: an Enumerable derived from an async `each`.

## Acceptance criteria

- [ ] `Relation` includes an Enumerable, mirroring `relation.rb:67`, whose members are derived from `Relation#each` and stay correct for an unloaded relation; `ENUMERABLE_METHODS`' `map` / `findAll` rows are answered by it and not shadowed.
- [ ] `CollectionProxy`'s own `[Symbol.iterator]` and its receipt are deleted; `for…of` / spread over a loaded proxy, and over an unloaded proxy whose owner has nothing to find, still iterate its records.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` green.
