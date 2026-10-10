---
title: "activerecord: prepended module methods take Rails' parameter lists, reaching super through the ancestry instead of a super_ parameter"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every activerecord arity mismatch `pnpm parity:api` reports (23 after trails#8493) is one shape: a
module method handed to ruby-compat's wrapping `prepend()` (`packages/ruby-compat/src/prepend.ts`)
takes the next method as an explicit first parameter, so its signature is `(super_, …)` against
Rails' list. Ruby's `Module#prepend` (`vendor/ruby/v3.3.11/eval.c:1196`) splices the module into the
ancestry and the body calls bare `super`.

Rows, from `scripts/api-compare/output/arity-mismatches.json`:

- `encryption/extended-deterministic-queries.ts` `where` / `isExists` / `scopeForCreate` / `serialize`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:99-150`)
- `encryption/extended-deterministic-uniqueness-validator.ts` `validateEach`
  (`extended_deterministic_uniqueness_validator.rb:11-24`)
- `core.ts`, `inheritance.ts`, `locking/optimistic.ts`, `timestamp.ts`, `associations.ts` `initializeDup`;
  `inheritance.ts` `initializeClone`
- `persistence.ts`, `timestamp.ts`, `associations.ts`, `autosave-association.ts`, `transactions.ts`,
  `touch-later.ts`, `attribute-methods/dirty.ts` `initInternals`
- `attribute-methods/dirty.ts` `reload`, `callbacks.ts` `incrementBang`
- `connection-adapters/abstract/query-cache.ts` `selectAll` / `checkoutAndVerify`,
  `connection-adapters/mysql2/database-statements.ts` `selectAll`

ruby-compat already has the converged mechanism for an included module: a live `Module` whose
method reaches the next link with `mod.superMethod(this, "name")`
(`packages/ruby-compat/src/include.ts`, used by `CoreQueries.ClassMethods#findBy` in
`extended-deterministic-queries.ts`). `Module#prependFeatures` copies the carrier onto
`base.prototype` and leaves no link beneath it, so `superMethod` cannot reach the class's own method
from a prepended module.

## Acceptance criteria

- [ ] `Module#prependFeatures` splices a link so a prepended module's method reaches the class's
      own method through `superMethod`, as Ruby's `super` does.
- [ ] The modules above are prepended as `Module`s whose methods take Rails' parameter lists, with
      no `super_` parameter.
- [ ] `parity:api` reports 0 activerecord arity mismatches of this shape, and `prepend.ts`'s wrapping
      helper is deleted once it has no caller.
