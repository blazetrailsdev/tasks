---
title: "Delegation: cache delegated class methods via generate_relation_method (delegation.rb:127-129)"
status: ready
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `Delegation::ClassSpecificRelation#method_missing`
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:127-129`)
caches a delegated method after first use:

    elsif !Delegation.uncacheable_methods.include?(method)
      model.generate_relation_method(method)
    end

i.e. when a delegated method is neither banned (delegate_base_methods) nor in
`uncacheable_methods`, Rails generates a real method on the per-class
`GeneratedRelationMethods` module so subsequent calls skip `method_missing`.

trails has the machinery — `GeneratedRelationMethods`, `DelegateCache`,
`generateRelationMethod`, `uncacheableMethods` in
`packages/activerecord/src/relation/delegation.ts` — but the proxy delegation
paths (`wrapWithScopeProxy` in delegation.ts and `wrapCollectionProxy` in
`associations.ts`) never call `generateRelationMethod` on the
class-method-delegation branch. So every delegated class-method call re-runs the
full proxy `get` trap (deviation from Rails' cache-after-first-call behavior).
Functionally equivalent results, but a structural/perf deviation.

## Acceptance criteria

- [ ] On the class-method delegation branch in both `wrapWithScopeProxy` and
      `wrapCollectionProxy`, after the guard passes and when the method is not in
      `uncacheableMethods`, register it via `generateRelationMethod` (mirroring
      `delegation.rb:127-129`).
- [ ] Subsequent calls resolve through the generated method rather than the
      proxy miss path.
- [ ] No behavior change for uncacheable methods (`to_a`/`records`/`inspect`).
