---
title: "activerecord: default_scope override detection reads the method owner in line; hasDefaultScopeOverride is deleted"
status: draft
updated: 2026-10-07
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

`packages/activerecord/src/scoping/default.ts` exports `hasDefaultScopeOverride(modelClass)` and a
private `defaultScopeMethod` that walks the constructor chain for an own `defaultScope` other than
the mixed-in one. Rails has neither. It asks two different questions in line:

- `build_default_scope` (`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping/default.rb:148-150`):
  `self.default_scope_override = !Base.is_a?(method(:default_scope).owner)`.
- `scope_attributes?` (`scoping/default.rb:55-57`):
  `super || default_scopes.any? || respond_to?(:default_scope)`. `default_scope` is a private class
  method in Rails, so `respond_to?` is true only for a user's public redefinition; trails has no
  run-time visibility (CLAUDE.md § "Method visibility is compile-time only"), so this arm needs an
  explicit mechanism decided for this class.

A third caller, `packages/activerecord/src/associations.ts:419-424`, open-codes
`klass.scope_attributes?` as `currentScope?.() || defaultScopes.length > 0 || hasDefaultScopeOverride(...)`
instead of calling `isScopeAttributes`.

The helper was receipted `@noRailsEquivalent PERMANENT` with no ratifying section; the audit in
`activerecord-audit-permanent-receipts-subsystems-part-2` re-tagged it
`CONVERGEABLE default-scope-override-reads-the-default-scope-method-owner`.

## Acceptance criteria

- [ ] `buildDefaultScope` computes the override in line from the owner of the class's `defaultScope`
      method (ruby-compat's `Method#owner` analogue), as `scoping/default.rb:149` does.
- [ ] `isScopeAttributes` answers its third arm without `hasDefaultScopeOverride`, by the mechanism
      chosen for `respond_to?(:default_scope)`.
- [ ] `associations.ts` calls `isScopeAttributes` where Rails calls `scope_attributes?`.
- [ ] `hasDefaultScopeOverride` and `defaultScopeMethod` are deleted with the receipt.
- [ ] `scoping/default-scoping.test.ts` and `scoping/relation-scoping.test.ts` stay green.
