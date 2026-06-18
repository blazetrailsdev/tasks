---
title: "Composite has_many :through with composite-PK target convergence"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while clearing the trails-specific bodies from the first
`AssociationsTest` describe in `packages/activerecord/src/associations.test.ts`
(RFC 0019 `assoc-associations-test-wave-final-drop-exclude`). The bespoke test
`composite has many through raises ConfigurationError when target model has
composite primary key` ratified a trails _limitation_, so it was removed rather
than converted (deviation policy: always converge, never ratify).

trails' through-scope builder (`_buildThroughScope` / `_pushThrough` in
packages/activerecord/src/associations.ts) raises `ConfigurationError` when a
`has_many :through` target model has a composite primary key, because the
target-side IN-subquery / join row carries only a single source FK column, so a
composite target PK is unrepresentable. This is a trails implementation
limitation: Rails supports composite-PK targets in through associations (see the
`Cpk` model graph in vendor/rails, e.g. `Cpk::Order has_many :books, through:`
with composite-key books). There is no Rails counterpart asserting this error.

## Acceptance criteria

- [ ] Support `has_many :through` where the target model has a composite primary
      key (multi-column source key in the IN-subquery / join), converging to
      Rails behavior rather than raising `ConfigurationError`.
- [ ] Add Rails-faithful coverage on canonical CPK models for a composite-PK
      through target.
- [ ] test:compare delta non-negative.
