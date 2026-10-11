---
title: "parameters-keys-is-a-getter-ruby-compat-keys-does-not-dispatch"
status: in-progress
updated: 2026-10-11
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8786
claim: "2026-10-11T18:04:13Z"
assignee: "parameters-keys-is-a-getter-ruby-compat-keys-does-not-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8786. `Association#initialize_attributes`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb`, the
`except_from_scope_attributes.keys.map(&:to_s)` line) calls `keys` on whatever the caller passed to
`build` / `create`, which may be an `ActionController::Parameters`.

trails' `initializeAttributes` (`packages/activerecord/src/associations/association.ts`) spells that
`keys(exceptFromScopeAttributes as Record<string, unknown>)` with ruby-compat's `keys`
(`packages/ruby-compat/src/hash.ts`). That helper dispatches to a `keys()` **method** through
`ownMethod`, and falls back to `Object.keys`. `ActionController::Parameters` in trails declares
`get keys(): string[]` (`packages/actionpack/src/action-controller/metal/strong-parameters.ts:301`),
a getter, so the helper does not dispatch to it and reads the instance's own enumerable properties
instead of the parameter names. The `ProtectedParams` test stub
(`packages/activerecord/src/support/stubs/strong-parameters.ts`) has a `keys()` method, so the
activerecord tests do not see it. `PermittedAttributes`
(`packages/activemodel/src/forbidden-attributes-protection.ts`) declares neither, which is why the
call site carries a cast.

## Acceptance criteria

- [ ] `Parameters#keys` and ruby-compat's `keys` agree: either `keys` is a method on `Parameters`
      (Rails `Parameters#keys` is a delegated Hash method, not an attr_reader), or the helper
      dispatches to it.
- [ ] `PermittedAttributes` declares what `initialize_attributes` reads, and `initializeAttributes`
      calls `keys(exceptFromScopeAttributes)` with no cast.
- [ ] A test builds through a collection association with a permitted real
      `ActionController::Parameters` whose keys overlap the association scope's `scope_for_create`,
      and the passed value wins.
