---
title: "ruby-compat: rbObjMethod / Method#owner / rbObjIsKindOf cost 0.5 µs per new through scope_attributes?"
status: draft
updated: 2026-10-08
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8673, which ported `scope_attributes?`'s `respond_to?(:default_scope)` arm
(`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping/default.rb:55-57`) as the owner test
`!rbObjIsKindOf(ActiveRecord.Base, rbObjMethod(this, "defaultScope").owner())` in
`packages/activerecord/src/scoping/default.ts#isScopeAttributes`.

`isScopeAttributes` runs on every `new` (`packages/activerecord/src/core.ts:922,944`, and
`populateWithCurrentScopeAttributes` in `scoping.ts`). For a model with no current scope and no
default scopes, the common case, all three arms are evaluated. Measured on the built package
(200k iterations, best of 5) it costs about 0.7 µs per call, of which `currentScope` is 0.2 µs. The
helper it replaced was a bare prototype walk.

Rails pays one `respond_to?` here, a method-cache hit. The remaining cost in trails is in
ruby-compat, not in the body: `rbObjMethod` allocates a `Method` and reads two property
descriptors per chain link (`packages/ruby-compat/src/method.ts`), `Method#owner` walks the chain a
second time through `methodOwner` (`packages/ruby-compat/src/include.ts`), and `rbObjIsKindOf` walks
the receiver's static chain.

## Acceptance criteria

- [ ] `isScopeAttributes` on a model with no current scope and no default scopes is measured before
      and after, with the numbers in the PR body.
- [ ] The cost comes down in ruby-compat (`rbObjMethod` / `Method#owner` / `rbObjIsKindOf`), so the
      `isScopeAttributes` and `buildDefaultScope` bodies keep the shape of `scoping/default.rb:56`
      and `:149`. No memo or helper is added to `scoping/default.ts`.
- [ ] `packages/ruby-compat/src/method.trails.test.ts` and
      `packages/activerecord/src/scoping/default-scoping.trails.test.ts` stay green.
