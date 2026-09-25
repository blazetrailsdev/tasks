---
title: "Association scopes take (owner) with this=relation, as instance_exec(owner, &scope)"
status: in-progress
updated: 2026-09-25
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: 9
pr: trails#8099
claim: "2026-09-25T18:11:42Z"
assignee: "generated-environments-omit-namespaced-framework-settings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8040 (converge-invented-association-scope-and-key-helpers). Rails evaluates an association scope with the relation as `self` and the owner as the only argument:

- `AssociationScope#eval_scope`: `relation.instance_exec(owner, &scope) || relation` (`activerecord/lib/active_record/associations/association_scope.rb:169-172`).
- `AssociationReflection#scope_for`: `relation.instance_exec(owner, &scope) || relation` (`activerecord/lib/active_record/reflection.rb:448-450`).
- An instance-dependent scope is `scope.arity != 0` (`associations/preloader/branch.rb:95`; `reflection.rb:633` `check_eager_loadable!` is `unless scope.arity == 0`).

trails passes the relation twice: `scope.call(relation, relation, owner)` (`associations/association-scope.ts` `evalScope`, `reflection.ts` `scopeFor`, the reflection-less arm of `associations/has-many-association.ts` `scope`). So every test-model scope is written `(q) => q.where(...)`, and instance dependence is tested as `scope.length > 1` (`reflection.ts` `checkEagerLoadableBang`, `associations/preloader/branch.ts`). `scopeFor` also keeps an `if (this._scope)` guard that Rails' body lacks.

Converged shape: `scope.call(relation, owner) || relation`, with `this` bound to the relation. Scopes are written `function (this: Relation) { return this.where(...) }`, or `(owner) => ...` for instance-dependent ones. Instance dependence is `scope.length !== 0`, as in Rails.

## Acceptance criteria

- [ ] `evalScope`, `scopeFor` and the reflection-less has_many arm call `scope.call(relation, owner) || relation`, and `scopeFor` drops the `_scope` guard.
- [ ] Instance-dependence checks use `length !== 0` / `=== 0` at the Rails sites (`reflection.rb:633`, `preloader/branch.rb:95`).
- [ ] The test models under `packages/activerecord/src/test-helpers/models/` and inline test scopes are rewritten to the relation-as-`this` shape, mirroring `activerecord/test/models/*.rb`.
