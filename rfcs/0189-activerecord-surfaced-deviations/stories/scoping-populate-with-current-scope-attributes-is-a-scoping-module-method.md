---
title: "activerecord: Scoping#populate_with_current_scope_attributes is flat-copied onto Base and called through .call, not a Scoping module method"
status: ready
updated: 2026-10-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8778, which made `ActiveRecord::Scoping` a `Module` that
`Base` includes (`base.rb:304`) and put `initialize_internals_callback` on it.

`Scoping#populate_with_current_scope_attributes`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping.rb:44-52`) is an
instance method of the module, reached by a bare self-call from
`initialize_internals_callback` (`scoping.rb:54-57`), and reads
`self.class.scope_attributes`.

`packages/activerecord/src/scoping.ts` differs:

- `populateWithCurrentScopeAttributes` is not defined on the `Scoping` module.
  `base.ts` flat-copies it onto `Base.prototype` with
  `include(Base, { populateWithCurrentScopeAttributes: ... })`, and
  `initializeInternalsCallback` calls it as
  `populateWithCurrentScopeAttributes.call(this)` where Rails has a self-call.
- It reads the class's attributes as `scopeAttributes.call(klass)` behind a
  `this.constructor as any` cast, where Rails calls
  `self.class.scope_attributes`; `ScopingHost` does not declare
  `scopeAttributes` on the constructor.

## Converged shape

`Scoping.defineMethod("populateWithCurrentScopeAttributes", ...)` beside the
callback, the flat copy in `base.ts` deleted, the callback calling
`this.populateWithCurrentScopeAttributes()`, and the body reading
`this.constructor.scopeAttributes()` through a typed host.

## Acceptance criteria

- [ ] `populateWithCurrentScopeAttributes` is a method of the `Scoping` module
      and `base.ts` no longer copies it onto `Base.prototype`.
- [ ] `initializeInternalsCallback` calls it on `this`, and the body has no
      `as any` cast.
- [ ] `scoping/*.test.ts`, `base.trails.test.ts` and
      `cold-model-construction.trails.test.ts` stay green.
