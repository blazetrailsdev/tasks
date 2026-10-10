---
title: "activerecord: the remaining super_ parameters (QueryCache#select_all, initialize_clone, Associations, Dirty#reload, increment!) move onto prepend links"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps:
  - activerecord-super-first-parameters-onto-super-method
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-prepended-super-first-parameters-onto-super-method`,
which landed the prepend link: `Module#prependFeatures`
(`packages/ruby-compat/src/include.ts`) now moves the class's own methods of
the module's names to an origin and splices the module between the class and
that origin, as `rb_prepend_module` does (`vendor/ruby/v3.3.11/class.c:1430`),
so `superMethod` resumes at the class's own method. That story converged
`QueryCache::ConnectionPoolConfiguration#checkout_and_verify`
(`connection_adapters/abstract/query_cache.rb:132-136`) and
`EncryptedUniquenessValidator#validate_each`
(`encryption/extended_deterministic_uniqueness_validator.rb:10-24`).

The rest could not ship with it, because the files are rewritten by the open
PR for `activerecord-super-first-parameters-onto-super-method` (trails#8764:
`associations.ts`, `inheritance.ts`, `core.ts`, `base.ts`, `timestamp.ts`,
`attribute-methods/dirty.ts`, `mysql2-adapter.ts`). Still threading `super_`:

- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts`
  `selectAll(super_, arel, name, binds, opts)` (`query_cache.rb:236-253`),
  wrapped by `prepend(AbstractAdapter.prototype, { selectAll })` in
  `abstract-adapter.ts`. Its `super` is `DatabaseStatements#select_all`, which
  `abstract/database-statements.ts` exports as a plain object flat-copied onto
  `AbstractAdapter.prototype`, so a `Module` link for `QueryCache` included
  beside it sits above the copy and is shadowed. `DatabaseStatements` has to be
  a `Module` (or included as a link) first.
- `packages/activerecord/src/inheritance.ts` `initializeClone(super_, other)`
  (`inheritance.rb:234-237`), a `ClassMethods` member wrapped by
  `prepend(Base, { initializeClone })` in `base.ts`. ruby-compat's `Kernel`
  defines `initializeDup` but no `initializeClone`
  (`vendor/ruby/v3.3.11/object.c:4383`), so `superMethod` has no root to end in.
- `packages/activerecord/src/associations.ts`: `Associations` is a class of
  statics with no instance-side module, so the `SuperMethods` link carrying
  `init_internals` / `initialize_dup` (`associations.rb:75`) is included from a
  `static [included]` hook Rails does not have (added by trails#8764, receipted
  `@noRailsEquivalent CONVERGEABLE`; repoint that receipt at this story).
- `attribute-methods/dirty.ts` `reload` (`attribute_methods/dirty.rb:51-58`),
  `callbacks.ts` `incrementBang` (`callbacks.rb:419-421`), `timestamp.ts`
  `_createRecord`.
- Outside the parent's list, same shape: `trailties/job-runtime.ts`
  `instrument(super_, operation, payload, block)`. It becomes a `Module`
  prepended through `@blazetrails/ruby-compat/include`'s `prepend`, the way
  `ConnectionPoolConfiguration` and encryption's prepended modules now are.

A class method that calls `super.name()` and is moved to the origin would
re-enter the prepended module (its `[[HomeObject]]` is still the class's
prototype). None of the two converged sites does; check each new site.

## Acceptance criteria

- [ ] `QueryCache#selectAll`, `initializeClone`, `Dirty#reload`,
      `Callbacks#incrementBang` and `Timestamp#_createRecord` take Rails'
      parameter lists and call `superMethod`.
- [ ] `Associations`' instance methods are included through the module itself
      and the `static [included]` receipt is deleted.
- [ ] `pnpm parity:api --arity` lists no activerecord row outside
      `migration/compatibility.ts` whose TS signature opens with `super_`.
