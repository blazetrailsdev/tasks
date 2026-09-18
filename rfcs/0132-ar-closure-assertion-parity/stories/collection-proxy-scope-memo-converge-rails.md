---
title: "CollectionProxy#scope memoization converges on Rails reset_scope semantics"
status: draft
updated: 2026-09-18
rfc: "0132-ar-closure-assertion-parity"
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

`CollectionProxy#scope` (packages/activerecord/src/associations/collection-proxy.ts:425-430) memoizes `this._scope ??= assoc.scope()`. Rails' CollectionProxy (vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb, `scope`/`reset_scope` at ~:1110-1130) rebuilds from `@association.scope` per call and only `reset_scope` clears its `@scope`. Found in trails#7864: a cached proxy keeps a stale default-scope predicate when `Bulb.unscoped { car.bulbs.count }` runs inside an afterCreate hook (see fix-scope-registry-stale-in-after-create-callback). Dropping the memo naively reds collection-proxy.trails.test.ts "bang builders delegate to scope" and "orderBang delegates to scope", which rely on scope() identity.

## Acceptance criteria

- scope caching mirrors Rails' `@scope` / `reset_scope` semantics.
- The two collection-proxy.trails tests stay green; the `it.fails` test in has-many-associations.test.ts ("build and create from association should respect passed attributes over default scope") can drop `.fails`.
