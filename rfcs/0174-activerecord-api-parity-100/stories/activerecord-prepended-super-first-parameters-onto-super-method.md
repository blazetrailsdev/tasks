---
title: "activerecord: prepended and class-level super_ parameters need a prepend link before they can take Rails' parameter list"
status: in-progress
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8765
claim: "2026-10-10T19:39:39Z"
assignee: "activerecord-prepended-super-first-parameters-onto-super-method"
blocked-by: null
closed-reason: null
---

## Context

`activerecord-super-first-parameters-onto-super-method` converged the
`init_internals` / `initialize_dup` links and Mysql2's `select_all` onto
`Module#superMethod`. Five `super_`-threading signatures in activerecord were
left, each blocked on something `superMethod` cannot reach today.

`Module#superMethod` (`packages/ruby-compat/src/include.ts`) resumes the lookup
at the link `appendFeatures` / `extendObject` spliced for the module. Two
shapes have no such link:

- **A prepended module.** `Module#prependFeatures` copies the module's
  descriptors onto `base.prototype`, replacing the class's own method, so there
  is no link and nothing left beneath it. MRI's `rb_prepend_module`
  (`vendor/ruby/v3.3.11/class.c:1430`) moves the class's method table to an
  origin iclass and splices the module ahead of it.
  - `packages/activerecord/src/connection-adapters/abstract/query-cache.ts`
    `ConnectionPoolConfiguration#checkoutAndVerify(super_, connection)`,
    prepended in `connection-pool.ts` over `ConnectionPool`'s own
    `checkoutAndVerify` (`connection_adapters/abstract/query_cache.rb:132-136`,
    `connection_pool.rb` `prepend QueryCache::ConnectionPoolConfiguration`).
  - `packages/activerecord/src/encryption/extended-deterministic-uniqueness-validator.ts`
    `EncryptedUniquenessValidator#validateEach(super_, record, attribute, value)`
    (`encryption/extended_deterministic_uniqueness_validator.rb:10-24`,
    `UniquenessValidator.prepend`).
- **A plain-object module.** `include(klass, { ... })` flat-copies onto
  `klass.prototype`, so a `Module` link included beside it sits above the copy
  and is shadowed.
  - `query-cache.ts` `selectAll(super_, arel, name, binds, opts)`
    (`query_cache.rb:236-253`): its `super` is `DatabaseStatements#select_all`,
    which `abstract/database-statements.ts` exports as a plain object
    flat-copied onto `AbstractAdapter.prototype`.

Two more are class-level or need a root:

- `packages/activerecord/src/inheritance.ts`
  `initializeClone(super_, other)` (`inheritance.rb:234-237`) is a
  `ClassMethods` member, and ruby-compat's `Kernel` defines `initializeDup`
  but no `initializeClone` (`vendor/ruby/v3.3.11/object.c:4383`).
- `packages/activerecord/src/associations.ts` has no instance-side module:
  `Associations` is a class of statics, so the `SuperMethods` link carrying
  `init_internals` / `initialize_dup` (`associations.rb:75`) is included from
  a `static [included]` hook Rails does not have, receipted
  `@noRailsEquivalent CONVERGEABLE` against this story.

Also still threading `super_` and not listed by the parent story:
`attribute-methods/dirty.ts` `reload`, `callbacks.ts` `incrementBang`,
`timestamp.ts` `_createRecord`.

## Acceptance criteria

- [ ] `Module#prependFeatures` splices a link `superMethod` resolves through,
      with the class's own method reachable beneath it.
- [ ] `checkoutAndVerify`, `validateEach`, `QueryCache#selectAll` and
      `initializeClone` take Rails' parameter lists and call `superMethod`.
- [ ] `Associations`' instance methods are included through the module itself
      and the `static [included]` receipt is deleted.
- [ ] `pnpm parity:api --arity` lists no activerecord row whose TS signature
      opens with `super_`.
