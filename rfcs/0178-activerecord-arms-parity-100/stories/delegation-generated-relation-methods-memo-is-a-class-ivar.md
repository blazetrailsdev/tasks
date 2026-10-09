---
title: "activerecord: seat generated_relation_methods' memo as the class's own ivar, not a module WeakMap"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8721
claim: "2026-10-09T18:39:41Z"
assignee: "attribute-methods-class-attribute-names-memo-and-cold-cache-arms"
blocked-by: null
closed-reason: null
---

## Context

trails#8628 converged `DelegateCache.generatedRelationMethods`
(`packages/activerecord/src/relation/delegation.ts`) to one `??`, but the memo
still lives in the module-level `WeakMap` `_generatedRelationMethodsByModel`,
so the body reads `get(this) ?? set(this, …).get(this)!`.

Rails seats it as the class's own ivar
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:54-59`):

```ruby
def generated_relation_methods
  @generated_relation_methods ||= GeneratedRelationMethods.new.tap do |mod|
    const_set(:GeneratedRelationMethods, mod)
    private_constant :GeneratedRelationMethods
  end
end
```

A class ivar is not inherited, so a plain static field read through the
prototype chain would answer the parent's module. The memo has to be an own
property of the class asked: `rbObjIvarGet` / `rbObjIvarSet`
(`packages/ruby-compat/src/object.ts`) read and write own fields only. The
default field spelling `generatedRelationMethods` collides with the static
method of the same name, so the ivar needs an `rbDeclareIvar` mapping to a
distinct field.

`_relationDelegateCache` in the same file is the same shape for
`@relation_delegate_cache` (`delegation.rb:32-45`).

## Acceptance criteria

- [ ] `generatedRelationMethods` memoizes on the class's own ivar, with one `or` and no `WeakMap`.
- [ ] `_generatedRelationMethodsByModel` is deleted.
- [ ] A subclass still gets its own `GeneratedRelationMethods` module; `relation/delegation.test.ts` green.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no row for `relation/delegation.ts#generatedRelationMethods`.
