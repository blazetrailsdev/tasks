---
title: "Polymorphic-through with composite owner PK convergence"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: "2026-06-19T00:52:18Z"
assignee: "polymorphic-through-composite-owner-convergence"
blocked-by: null
---

## Context

Surfaced while clearing the trails-specific bodies from the first
`AssociationsTest` describe in `packages/activerecord/src/associations.test.ts`
(RFC 0019 `assoc-associations-test-wave-final-drop-exclude`). The bespoke test
`polymorphic-through with composite owner primary key requires explicit
single-column primaryKey` ratified a trails _limitation_, so it was removed
rather than converted (deviation policy: always converge, never ratify).

trails' through-scope builder (the `_throughOwnerPolymorphic` path in
packages/activerecord/src/associations.ts) requires an explicit single-column
`primaryKey:` option on a polymorphic-through whose owner has a composite primary
key, and rejects (with `ConfigurationError`) both the no-`primaryKey` and the
array-`primaryKey` forms — because the polymorphic join schema
(`<as>_id`/`<as>_type`) carries only a _scalar_ owner identifier. This is a
trails limitation around polymorphic + composite owner keys; there is no Rails
counterpart asserting this requirement.

## Acceptance criteria

- [ ] Converge polymorphic-through behavior for composite-owner-PK models to
      Rails: derive the polymorphic owner key without demanding an explicit
      single-column `primaryKey:`, or document/match Rails' actual constraint.
- [ ] Add Rails-faithful coverage on canonical models for the polymorphic-through + composite-owner scenario.
- [ ] test:compare delta non-negative.
