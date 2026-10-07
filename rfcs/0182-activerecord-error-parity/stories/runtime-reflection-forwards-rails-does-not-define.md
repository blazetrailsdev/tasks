---
title: "activerecord: delete the RuntimeReflection forwards Rails does not define"
status: draft
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `RuntimeReflection` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:1258-1279`) delegates only `:scope, :type, :constraints, :join_foreign_key` to `@reflection` and defines `klass`, `aliased_table`, `join_primary_key` and `all_includes`. Everything else it answers comes from `AbstractReflection`.

trails' `RuntimeReflection` (`packages/activerecord/src/reflection.ts`, class at the `RuntimeReflection` name) still carries members Rails does not define there: `isThroughReflection`, `isCollection`, `isPolymorphic`, `scopeFor`, the `chain` getter and the `sourceReflection` getter, each forwarding to `this._reflection`. The sibling `className` / `name` / `pluralName` / `options` forwards were deleted with no caller found (a throwing probe across `packages/activerecord/src/associations/**` and `reflection.test.ts` stayed green).

The one construction site is `AssociationScope#get_chain` (`associations/association_scope.rb:107-117`, trails `associations/association-scope.ts` `getChain`).

## Acceptance criteria

- [ ] Each remaining forward is probed for callers (a throwing getter across the association suites), and every caller found is converged onto the reader Rails uses at that site.
- [ ] The forwards Rails does not define are deleted, so `RuntimeReflection` holds the four delegates and four methods of `reflection.rb:1258-1279` and nothing else.
- [ ] Association, through, polymorphic and disable-joins suites stay green; `pnpm parity:api:extra:gate` stays green.
