---
title: "CollectionProxy#initialize seeds Relation state Rails never has; delegate to scope instead"
status: done
updated: 2026-08-19
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6745
claim: "2026-08-19T17:00:23Z"
assignee: "collection-proxy-initialize-is-five-lines"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy#initialize` is five lines:

```ruby
def initialize(klass, association, **)   # collection_proxy.rb:32-38
  @association = association
  super klass, klass.arel_table
  extensions = association.extensions
  extend(*extensions) if extensions.any?
end
```

The proxy carries **no relation state**. Every query method it answers is
delegated to `scope` (`:949-951`, `@scope ||= @association.scope`), built
lazily and dropped by `reset_scope` (`:1112-1116`).

`packages/activerecord/src/associations/collection-proxy.ts:563-703` is
**61 code lines** doing the opposite: it eagerly builds a relation — through
`hasManyScope(...)` on the non-through arm or `_buildThroughScope()` on the
through arm — and `initializeCopy`s it onto the proxy's own inherited `Relation`
state. That decision drags in:

- `seedNone()`, which must hand-unset `_isNone` after the copy, because the
  copied flag would otherwise fire `update_all`'s `return 0 if @none`
  (`relation.rb:1013`) on the proxy itself (comment at `:612-621`)
- `_deferredFkError` (`:630`), a field holding an `ArgumentError` raised during
  construction and re-thrown at load — Rails never raises it early because it
  never builds the scope early
- the `Relation.prototype`-reaching dance at `:596-603`, needed because the
  seeding bangs would otherwise be forwarded to a `scope()` that is not
  buildable mid-construction
- `_targetModelFor` (`:512`, 14), `static create`/`_create` (`:539`/`:553`, 15),
  `_cachedNamedScopeRelation` (`:2202`, 13) and the
  `_setAssociationRelationCtor` preamble (`:24-71`, 24)

This is the keystone finding of the RFC: the seeded state is _why_ the proxy
overrides `firstBang`/`exists`/`insertAll`/`clone`/`select` — `super` has
something local to run against. Remove the seeding and those overrides become
deletable (the sibling stories
`retire-collection-proxy-bang-finder-and-first-or-overrides` and
`collection-proxy-bulk-insert-family-delegates-to-scope` depend on this one).

Related open story:
`0112-one-rails-thing-n-trails-things/collection-proxy-association-ivar-takes-rails-name`
(the `@association` naming half) and
`0075-collection-association-target-fidelity/collection-proxy-holds-association-ivar-not-per-call-lookup`.

## Converged shape

`constructor` becomes Rails' four statements: hold the association, `super(klass,
klass.arelTable)`, apply `extensions`. No `initializeCopy`, no `seedNone`, no
`_deferredFkError`. `scope()` stays the lazy `@scope ||= @association.scope`
memo it already is (`:2226`), and every query method reaches it through the
delegate table.

The FK-derivation `ArgumentError` then surfaces where Rails surfaces it — from
the scope build inside the load — with no field to stash it in.

## Acceptance criteria

- `collection-proxy.ts`'s constructor is Rails' body: association, `super`,
  extensions. Nothing else.
- `seedNone`, `_deferredFkError`, and the `Relation.prototype` reach-around no
  longer exist.
- `_cachedNamedScopeRelation` is deleted or given a Rails `file:line` citation.
- Deferred-FK behaviour is proven by a test that the error surfaces on load, not
  on construction — and that test **fails on the pre-change baseline** if the
  behaviour changes at all.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
- Full association suites pass unchanged: `has-many-associations.test.ts`,
  `has-many-through-associations.test.ts`, `habtm.test.ts`,
  `collection-proxy.test.ts`, `null-scope.trails.test.ts`,
  `extension.test.ts`. No test renamed.
- If the delegate table cannot carry a name the seeded state was serving, file
  that as its own story with the trails `file:line` before blocking — do not
  keep a partial seed.
