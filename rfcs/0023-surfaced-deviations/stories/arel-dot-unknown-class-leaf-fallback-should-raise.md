---
title: "arel-dot-unknown-class-leaf-fallback-should-raise"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4880
(arel-dot-am-attribute-structural-check-looser-than-rails).

Rails' `Arel::Visitors::Visitor#visit` (`visitor.rb:36-41`) dispatches on
`object.class`, and on `NoMethodError` walks `object.class.ancestors` for a
visitable superclass. When no ancestor has a `visit_` method it raises:

```ruby
raise(TypeError, "Cannot visit #{object.class}") unless superklass
```

Trails' `Dot#visit` (`packages/arel/src/visitors/dot.ts`, the final `else`)
instead renders any unknown non-Node object as a leaf via `visitString(object)`:

```ts
} else {
  // Unknown non-Node object — render as a leaf with its String form
  // so unfamiliar value classes don't crash the visitor.
  this.visitString(object);
}
```

This is a trails invention: `Dot.compile(new Money())` renders `$5` where Rails
raises `TypeError: Cannot visit Money`. PR #4880 removed a test that pinned the
leaf behaviour (rather than ratify the deviation) but did not converge it — the
fallback predates that PR and converging it changes behaviour for every
unknown value class, which is wider than #4880's Attribute-predicate scope.

Note the original intent recorded at `dot.test.ts` ("Dot must not raise
UnsupportedVisitError on a class instance the dispatch table didn't know
about") — Rails DOES raise here, just a `TypeError` rather than Arel's
`UnsupportedVisitError`. Check which error type trails should surface.

## Acceptance criteria

- [ ] Unknown non-Node objects with no visitable ancestor raise, matching
      `visitor.rb:39` (`TypeError`, message `Cannot visit <ClassName>`),
      instead of falling back to a `visitString` leaf.
- [ ] The ancestor walk itself is honoured: a subclass of a visitable class
      still routes to the superclass visitor (cf. `instanceof ModelAttribute`
      in dot.ts, which already covers the Attribute arm of this).
- [ ] Audit callers/tests that relied on the leaf fallback.
- [ ] api:compare / test:compare delta non-negative.
