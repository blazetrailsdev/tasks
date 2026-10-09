---
title: "activerecord: JoinAssociation#readonly? and #strict_loading? take Rails' bodies"
status: ready
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`JoinAssociation#readonly?` and `#strict_loading?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency/join_association.rb:79-89`)
are each a `defined?` memo over
`reflection.scope && reflection.scope_for(base_klass.unscoped).readonly_value` (`strict_loading_value`).

`packages/activerecord/src/associations/join-dependency/join-association.ts` routes both through an
invented `_scopeRelation()` helper that guards `typeof refl.scopeFor`, wraps the call in a
`try` / `catch` returning `null`, and optional-chains `unscoped`. `isStrictLoading` additionally ORs in
`reflection.strictLoading`, which Rails does not read here. Both coerce with `!!`, so the value Rails
returns (the scope's value, or the falsy `reflection.scope`) is flattened to a boolean.

Seen while converging `joinConstraints` in trails#8479; left out for the LOC ceiling.

## Acceptance criteria

- [ ] `isReadonly` / `isStrictLoading` are Rails' two lines each: the memo guard, then
      `reflection.scope && reflection.scopeFor(baseKlass.unscoped()).readonlyValue` (`strictLoadingValue`).
- [ ] `_scopeRelation` is deleted; no `try` / `catch`, no `typeof` guard, no `reflection.strictLoading` read.
- [ ] `strict-loading.test.ts`, `readonly.test.ts` and `associations/eager.test.ts` pass.
