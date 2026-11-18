---
title: "extractor: a Module assigned as a property, or including inside its block, has no visible methods"
status: done
updated: 2026-11-18
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10240
claim: "2026-11-17T13:21:36Z"
assignee: "burn-down-the-declaration-only-population-remaining"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8415, which taught `scripts/api-compare/extract-ts-api.ts`
(`harvestModuleInstanceMethods`) to record the methods of an exported `Module` instance in two shapes:
`export const X = new Module().include({ ... })` and
`export const X = new Module((mod) => { mod.defineMethod("m", fn) })`.

Two shapes of the same thing are still invisible:

- A `Module` assigned as a property of another module:
  `CoreQueries.ClassMethods = new Module((mod) => mod.defineMethod("findBy", findBy))`
  (`packages/activerecord/src/encryption/extended-deterministic-queries.ts`), mirroring
  `ActiveRecord::Encryption::ExtendedDeterministicQueries::CoreQueries::ClassMethods`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb`).
  The walker only visits exported variable statements.
- `include` called inside the constructor block:
  `export const ThroughAssociation = new Module((mod) => mod.include({ ... }))`
  (`packages/activerecord/src/associations/through-association.ts`). The block walk reads
  `defineMethod` calls only.

Both score today only because the same bodies are also exported as top-level functions, which is the
split the original story removed for `DefaultImplementation`.

## Acceptance criteria

- [ ] `harvestModuleInstanceMethods` (or its caller) records a `Module` assigned to a property of an exported module, keyed as the nested module, with a test.
- [ ] The block walk records `mod.include({ ... })` literals as well as `defineMethod`, with a test.
- [ ] `pnpm parity:api` method counts do not drop for any package; `pnpm parity:api:extra:gate` stays green, with any newly visible ruby-compat member receipted rather than the mark raised.
