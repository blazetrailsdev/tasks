---
title: "converge-collection-proxy-scope-to-association-scope"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6492
claim: "2026-08-13T19:45:40Z"
assignee: "converge-collection-proxy-scope-to-association-scope"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the RFC 0099 explicit-host rows in
`call-args-ar-host-param-associations` (PR for that story).

Rails' `CollectionProxy#scope` is a two-line memo
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:949-951`):

```ruby
def scope
  @scope ||= @association.scope
end
```

trails' `packages/activerecord/src/associations/collection-proxy.ts:3475-3490`
instead rebuilds the relation itself: a `_isThrough` branch calling
`_buildThroughScope()`, a `hasManyScope(...)` call, a null arm that builds
`model.all()`, applies `this._assocDef.options.scope(emptyRel)` and `.none()`,
and a `_wrapAsAssociationRelation` tail. There is no memo and no delegation to
`this._association.scope()`.

The residue is one row in the RFC 0095 call-argument baseline
(`scripts/api-compare/call-mismatches-exclude/activerecord/associations/collection-proxy.json`,
`rubyName: "scope"`, `call: "scope"`, `kind: "args"`) whose reviewed reason
records that the flagged `scope(emptyRel)` is the reflection's `options.scope`
lambda — a name collision with Rails' `CollectionProxy#scope`, with the real
body divergence deferred to this story.

## Acceptance criteria

1. `CollectionProxy#scope` delegates to the owning association's `scope()` and
   memoizes it, matching collection_proxy.rb:949-951 — the relation-building
   arms move to (or are already covered by) the association's own `scope`.
2. The `collection-proxy.ts` / `scope` / `scope` `kind: "args"` baseline row is
   DELETED (only-shrink; delete by hand, never `--write`).
3. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; the
   association suites under `packages/activerecord/src/associations/` pass.
