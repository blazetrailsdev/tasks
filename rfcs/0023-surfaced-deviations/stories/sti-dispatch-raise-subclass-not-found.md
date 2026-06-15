---
title: "STI dispatch at new() returns null instead of raising SubclassNotFound for out-of-hierarchy type"
status: in-progress
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3404
claim: "2026-06-15T19:54:05Z"
assignee: "sti-dispatch-raise-subclass-not-found"
blocked-by: null
---

## Context

Surfaced by `f9g2-sti-dispatch-at-new` (PR #3195). Rails'
`Inheritance::ClassMethods#new` resolves the type value via `find_sti_class`,
which raises `ActiveRecord::SubclassNotFound` when the value names a class that
isn't a subclass of the receiver (e.g. `Client.new(type: "Firm")`).

trails' `subclassFromAttributesForNew` (`inheritance.ts`) instead resolves
through `findStiClassInHierarchy` — a registry-safe walk of the receiver's own
subtree — and returns `null` (build the receiver as-is) on a non-match, never
raising. This was deliberate: the global `modelRegistry` resolves bare class
names ambiguously across test files (multiple `Firm`/`Client` classes), so the
constant-lookup path that would raise is exactly the ambiguous path we avoid.

The cost is a fidelity gap: an invalid STI type at `new` is silently ignored
rather than raising. Converging requires a namespace-safe model resolution
mechanism so an out-of-hierarchy-but-known type can be distinguished from an
unknown one and raise correctly.

## Acceptance criteria

- [x] `Company.new(type: "<not-a-subclass>")` raises `SubclassNotFound`,
      matching Rails, without reintroducing cross-test-file registry ambiguity.
- [x] `findStiClassInHierarchy` / `subclassFromAttributesForNew` keep the
      registry-safe resolution for valid in-hierarchy types.
- [x] Existing STI-at-new tests stay green.
