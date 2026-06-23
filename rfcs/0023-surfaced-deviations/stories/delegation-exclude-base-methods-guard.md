---
title: "Delegation: honor delegate_base_methods guard (don't delegate Base methods on relations)"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3987
claim: "2026-06-23T12:32:38Z"
assignee: "delegation-exclude-base-methods-guard"
blocked-by: null
---

## Context

PR #3879 added class-method delegation to `wrapWithScopeProxy`
(`packages/activerecord/src/relation/delegation.ts`), mirroring the existing
collection-proxy delegation (`packages/activerecord/src/associations.ts`
~2882-2908). Both implement Rails' `Delegation#method_missing`
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:118`):
`scoping { @klass.public_send(method, ...) }`.

Both trails proxies **omit** Rails' `DelegateCache.delegate_base_methods` guard
(`delegation.rb:122-126`), which bans delegating into `ActiveRecord::Base`
methods. As a result `relation.<anyBaseClassMethod>` is now silently
delegated-with-scoping rather than raising `NoMethodError`. The two trails
paths are consistent with each other but diverge from Rails.

## Acceptance criteria

- [x] Model the `delegate_base_methods` exclusion so plain-relation /
      collection-proxy delegation does NOT delegate methods defined on
      `ActiveRecord::Base` (matching `delegation.rb:122-126`).
- [x] Apply the guard to BOTH `wrapWithScopeProxy` and the collection-proxy
      `method_missing` path so they stay consistent.
- [x] Add a test asserting a Base-only class method called on a relation
      behaves like Rails (raises / is not silently scoped-delegated).
