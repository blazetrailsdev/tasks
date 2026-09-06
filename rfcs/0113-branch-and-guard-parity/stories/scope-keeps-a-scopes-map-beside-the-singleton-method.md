---
title: "scope keeps a _scopes Map beside the singleton method Rails defines"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 53
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Scoping::Named::ClassMethods#scope`
(`vendor/rails/activerecord/lib/active_record/scoping/named.rb:154-189`) ends
with three statements after its two arms:

```ruby
  singleton_class.send(:ruby2_keywords, name)
  generate_relation_method(name)
end
```

`generate_relation_method` (`relation/delegation.rb:52`) is what makes the scope
reachable from a Relation; `method_missing` (`relation/delegation.rb:118-134`)
calls the same thing lazily and then runs
`scoping { model.public_send(method, ...) }`. There is exactly ONE store: the
singleton method on the model class.

`packages/activerecord/src/scoping/named.ts` (as of PR #7389) has the two arms,
but keeps a SECOND store beside the singleton method — a `_scopes` Map on the
model class, written by the module-private `singletonClassDefineMethod` and read
by `relation/delegation.ts`'s `wrapWithScopeProxy` (`get` and `has` traps) and
by `associations.ts`. `Base._scopes` is public surface Rails does not have, and
`scope` never calls the port's own `generateRelationMethod`
(`relation/delegation.ts:294`), which is the real counterpart of
`generate_relation_method`.

PR #7389 retired the sibling `_scopeExtensions` map by routing extensions
through `extending`, and converged the arms; the `_scopes` half was left because
retiring it is a separate, larger change and the story
(`scope-drops-the-to-proc-and-extending-arms`) marked it optional. Reviewer
agreed it was out of that PR's scope.

One earlier attempt is worth recording so it is not repeated blind: wiring the
proxy branch to `classMethodDelegator(prop)` sets `currentScope` to the
CollectionProxy, and `Association#scope`
(`packages/activerecord/src/associations/association.ts:156-158`) then takes its
`currentScope.proxyAssociation === this` arm and calls `currentScope.spawn()`,
which re-enters `CollectionProxy#scope` — infinite recursion, seen across nine
`named-scoping.test.ts` tests. The shape that worked was invoking the singleton
method with a receiver whose `all()` returns the relation.

## Converged shape

`scope` calls `generateRelationMethod(modelClass, name, ...)` — the port's
`generate_relation_method` — and the `_scopes` Map plus its two proxy traps are
deleted, so the singleton method on the class is the only store. `associations.ts`'s
`_scopes.has(prop)` check becomes whatever `model.respond_to?(method)` maps to.

## Acceptance criteria

- [ ] `Base._scopes` is gone; no parallel scope registry remains.
- [ ] `scope` reaches Relations through `generateRelationMethod`, per
      `named.rb:188`.
- [ ] `packages/activerecord/src/scoping/`, `null-relation.test.ts`,
      `associations/` and `relation/` stay green — in particular the nine
      `named-scoping.test.ts` tests named above.
- [ ] `pnpm parity:api:extra:gate` shows activerecord's `novel`/`total` DOWN,
      never up.
