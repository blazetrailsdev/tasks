---
title: "Visitor dispatch must check respond_to?, not just table membership"
status: in-progress
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 24
pr: 5046
claim: "2026-07-21T23:56:49Z"
assignee: "arel-visit-dispatch-respond-to-check"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::Visitor#visit`
(`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:27-43`) resolves a
handler in two steps, and trails' ancestors walk drops one of the two checks.

Rails' rescue path:

```ruby
rescue NoMethodError => e
  raise e if respond_to?(dispatch_method, true)
  superklass = object.class.ancestors.find { |klass|
    respond_to?(dispatch[klass], true)
  }
  raise(TypeError, "Cannot visit #{object.class}") unless superklass
```

Both the guard and the `find` block test **`respond_to?`** — i.e. whether the
visitor actually has the named method — not merely whether the dispatch table
has an entry for the class.

Trails' `resolveDispatch` (`packages/arel/src/visitors/visitor.ts`) walks the JS
prototype chain but only checks `this.dispatch.get(parent)` for map membership.
It never checks that the resolved name names a real method on the visitor. The
`typeof fn !== "function"` check in `visit` then fires _after_ resolution and
throws `UnsupportedVisitError("Dispatch method '...' is not defined on ...")`.

Consequence: when a dispatch entry names a method that does not exist (e.g. a
subclass registers a typo'd handler name while its parent class has a working
one), Rails falls through to the ancestor's working handler and visits
successfully; trails raises instead. If no ancestor responds either, Rails
raises `TypeError, "Cannot visit X"` — trails raises `UnsupportedVisitError`.

PR #5002 converged the _no-entry_ terminal to `TypeError` (visitor.rb:38) and
deliberately left this mis-registration branch alone as out of scope. The
existing test `"distinguishes a mis-registered method from an unknown node
type"` (`packages/arel/src/visitors/visitor.test.ts`) pins the current
divergent behaviour and will need updating.

## Acceptance criteria

- [ ] `resolveDispatch` only accepts a dispatch entry whose method name
      resolves to a function on the visitor instance, mirroring
      `respond_to?(dispatch[klass], true)` (visitor.rb:36-37).
- [ ] A class whose own dispatch entry names a missing method falls through to
      an ancestor's working handler and visits successfully, as in Rails.
- [ ] When neither the class nor any ancestor has a responding handler, the
      terminal is `TypeError, "Cannot visit <Class>"` (visitor.rb:38) — not
      `UnsupportedVisitError`.
- [ ] Memoization still matches Rails: only a _successful_ ancestor resolution
      writes `dispatch[object.class] = dispatch[superklass]` (visitor.rb:39).
- [ ] `packages/arel/src/visitors/visitor.test.ts` "distinguishes a
      mis-registered method from an unknown node type" is updated to the Rails
      behaviour (or replaced by tests naming the Rails semantics).
- [ ] api:compare / test:compare delta non-negative.
