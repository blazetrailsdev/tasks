---
title: "activerecord: methods that thread super_ as a first parameter take Rails' parameter list"
status: in-progress
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps:
  - activerecord-prepended-super-first-parameters-onto-super-method
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8764
claim: "2026-10-10T19:09:47Z"
assignee: "activerecord-pg-uuid-primary-key-default-lives-in-schema-creation"
blocked-by: null
closed-reason: null
---

## Context

The arity check in `scripts/api-compare/compare.ts` pooled every TS signature of a name across the
package, so a `super_`-threading port was credited by any unrelated same-named method. It now
compares a `super_`-threading signature in the matched file alone (`threadsSuper`,
`scripts/api-compare/arity.ts`), which surfaced these activerecord rows. Each carries one leading
parameter Rails does not declare, the object-literal `prepend()` shape:

- `packages/activerecord/src/core.ts` — `initInternals(super_)` (`core.rb:834`), `initializeDup(super_, other)` (`core.rb:548`).
- `packages/activerecord/src/persistence.ts` — `initInternals(super_)` (`persistence.rb:814`).
- `packages/activerecord/src/attribute-methods/dirty.ts` — `initInternals(super_)` (`attribute_methods/dirty.rb:196`).
- `packages/activerecord/src/timestamp.ts` — `initInternals(super_)` (`timestamp.rb:102`), `initializeDup(super_, other)`.
- `packages/activerecord/src/associations.ts` — `initInternals(super_)` (`associations.rb:75`), `initializeDup(super_, other)`.
- `packages/activerecord/src/autosave-association.ts` — `initInternals(super_)` (`autosave_association.rb:290`).
- `packages/activerecord/src/transactions.ts` — `initInternals(super_)` (`transactions.rb:432`).
- `packages/activerecord/src/touch-later.ts` — `initInternals(super_)` (`touch_later.rb:49`).
- `packages/activerecord/src/inheritance.ts` — `initializeDup(super_, other)`, `initializeClone(super_, other)`.
- `packages/activerecord/src/locking/optimistic.ts` — `initializeDup(super_, other)`.
- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts` — `selectAll(super_, ...)`, `checkoutAndVerify(super_, connection)`.
- `packages/activerecord/src/connection-adapters/mysql2/database-statements.ts` — `selectAll(super_, ...args)`.
- `packages/activerecord/src/encryption/extended-deterministic-uniqueness-validator.ts` — `validateEach(super_, record, attribute, value)`.

The converged shape is the one ActiveModel's methods now have (`packages/activemodel/src/dirty.ts`,
`validations.ts`, `attributes.ts`): the method takes Rails' parameter list and calls
`<Module>.superMethod(this, "<name>")!(...)`, with the module's link included in Rails' ancestry
order. `Module#superMethod` ends its search in ruby-compat's `Kernel`, so `initialize_dup` needs no
root of its own.

`base.ts:2721-2735` builds the current chain with `prepend(Base.prototype, { ... as PrependMethod })`,
outermost last, on top of ActiveModel's links. Rails' order differs: `Core#init_internals`
(`core.rb:834`) is the root and calls no `super`, and `Core#initialize_dup` calls `super` last.

## Acceptance criteria

- [ ] Each method above takes Rails' parameter list and reaches the next implementation through `superMethod`, not a threaded `super_`.
- [ ] `pnpm parity:api --arity` lists no activerecord row whose TS signature opens with `super_`.
- [ ] `dup.test.ts`, `dirty.test.ts`, `clone.test.ts`, `timestamp.test.ts`, `locking.test.ts` and the query-cache suites stay green.
