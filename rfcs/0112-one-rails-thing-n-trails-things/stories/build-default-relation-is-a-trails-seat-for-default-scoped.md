---
title: "Base._buildDefaultRelation is a trails seat for Rails' default_scoped"
status: done
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6853
claim: "2026-08-22T11:20:34Z"
assignee: "ci-lint-scope-misses-cross-file-type-driven-breaks"
blocked-by: null
closed-reason: null
---

# `Base._buildDefaultRelation` is a trails seat for `default_scoped`

## Context

Rails' `Scoping::Named::ClassMethods#default_scoped`
(`activerecord/lib/active_record/scoping/named.rb:45-52`) is:

```ruby
def default_scoped(scope = relation, all_queries: nil)
  build_default_scope(scope, all_queries: all_queries) || scope
end
```

trails spells it `Base._buildDefaultRelation(allQueries?)`
(`packages/activerecord/src/base.ts:2196-2205`), a `private static` with no Ruby
counterpart. PR #6852 converged its _body_ onto Rails' — it now builds its base
from `this.relation()`, so the STI condition is on the base before
`build_default_scope` merges and before the recursion guard arms — but the name
and the seat are still trails'.

There is also a `defaultScoped` on `Base` already (called at base.ts:2367), so
this is the "one Rails thing, two trails things" shape RFC 0112 tracks: Rails'
one method is split into a public `defaultScoped` and a private
`_buildDefaultRelation` that holds its body.

`_buildUnscopedRelation`, the sibling invention, was retired onto
`Core#relation` by #6852 — this is the last one in that cluster.

## Converged shape

One `defaultScoped(scope = this.relation(), { allQueries })` at the Rails name
carrying Rails' one-line body, with `_buildDefaultRelation` gone and every
caller reading it. Note Rails' `scope` is a **default argument**, evaluated at
call time — `relation()` must not be hoisted out of it, since #6852 established
that the evaluation ORDER (base relation built before `build_default_scope`
arms the recursion guard) is load-bearing.

## Acceptance criteria

- [ ] `_buildDefaultRelation` is gone; `defaultScoped` carries named.rb:45-52's
      body at the Rails name, with Rails' parameter names and defaults.
- [ ] `relation()` is still evaluated before `buildDefaultScope`, with a test
      pinning it (an STI subclass with a default scope keeps its type condition).
- [ ] `parity:api:extra --package activerecord` loses a novel name on `base.ts`.
- [ ] `parity:api:calls` green; STI + default-scope suites pass on all three
      adapters.
