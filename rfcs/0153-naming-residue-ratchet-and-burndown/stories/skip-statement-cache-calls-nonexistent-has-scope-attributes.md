---
title: "Association#isSkipStatementCache calls a nonexistent hasScopeAttributes, so the scope_attributes? arm is always false"
status: done
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 44
pr: trails#8038
claim: "2026-09-24T16:14:07Z"
assignee: "missing-rails-name-receipt-on-mixin-object-function-unmatched"
blocked-by: null
closed-reason: null
---

## Context

`Association#isSkipStatementCache` (`packages/activerecord/src/associations/association.ts:568-575`)
ports Rails' `skip_statement_cache?(scope)`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:391-396`):

```ruby
def skip_statement_cache?(scope)
  reflection.has_scope? ||
    scope.eager_loading? ||
    klass.scope_attributes? ||
    reflection.source_reflection.active_record.default_scopes.any?
end
```

The `klass.scope_attributes?` arm is ported as
`!!(this.klass as any)?.hasScopeAttributes?.()`. No model defines
`hasScopeAttributes`: the class method is `isScopeAttributes`
(`scoping.ts:125`, seated as `static isScopeAttributes` at `base.ts:1338`), so the
optional call always yields `undefined` and the arm is always false. Rails skips
the statement cache whenever a scope is active on the target class; trails
never would.

trails#8012 made `has*` a sanctioned candidate spelling of `scope_attributes?`
(`PLURAL_PREDICATE_ALIASES`, `scripts/parity/conventions.ts`), so the name gates
now pair the misspelled call with `scope_attributes?` and nothing flags it. The
other arms are duck-typed the same way (`refl.hasScope?.() ?? refl.scope`,
`refl.sourceReflection?.()?.activeRecord?.defaultScopes?.length`), where Rails
calls each method directly and ends with `default_scopes.any?`.

The method currently has no callers; the find-target body that would call it is
held in `port-base-association-find-target-body` (RFC 0123). The bug still
matters because that port will wire it up as it stands.

## Acceptance criteria

- [ ] The `scope_attributes?` arm calls `this.klass.isScopeAttributes()`
      directly: no `as any`, no optional call.
- [ ] The other arms call the Rails methods directly in Rails order:
      `reflection.hasScope()`, `scope.isEagerLoading`,
      `reflection.sourceReflection().activeRecord.defaultScopes` with an
      `any?` port. Drop the `@missingRailsCall any? — PERMANENT` tag once
      `any?` is called.
- [ ] A test fails on the current body: a scoped `klass` (inside
      `Klass.scoping`) makes `isSkipStatementCache` return true.

## Verification

- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
- `grep -rn "hasScopeAttributes" packages/activerecord/src` finds nothing.
