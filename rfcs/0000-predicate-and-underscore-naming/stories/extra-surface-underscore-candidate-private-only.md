---
title: "Offer the `_` name candidate only for Ruby-private methods"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["scripts"]
deps: ["naming-shape-labels-in-extract-ts-api"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/conventions.ts` offers every Ruby name a `_`-prefixed last candidate (documented at `docs/ruby-ts-conventions.md:69-77`). That candidate can credit an invented `_foo` that happens to match a public Ruby `foo`. Restrict it to Ruby methods private on every host, so `parity:api:extra` agrees with the `invented` label.

## Acceptance criteria

- [ ] The candidate is offered only when the paired Ruby member is private.
- [ ] Every name this exposes is converged, made TS-private or receipted in the same PR, and extra-surface marks do not rise.
- [ ] The regenerated conventions doc is updated.
