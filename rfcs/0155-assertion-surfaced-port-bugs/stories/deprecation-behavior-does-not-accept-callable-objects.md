---
title: "deprecation-behavior-does-not-accept-callable-objects"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

`Deprecation::Behavior#behavior=`
(`vendor/rails/activesupport/lib/active_support/deprecation/behaviors.rb:98-104`)
maps each entry through `arity_coerce`, which accepts anything responding to
`call` — `deprecation_test.rb:141-152` sets the behavior to plain objects with a
singleton `call` and expects them to fire.

trails' `arityCoerce` (`packages/activesupport/src/deprecation.ts:71-90`)
rejects a non-`function` outright with
`":<inspect> is not a valid deprecation behavior."`, so a callable object never
runs.

## Parked test

`packages/activesupport/src/deprecation.test.ts` › `behavior callbacks with
callable objects`, `it.skip` with the converged body and a `BLOCKED:
deprecation-behavior-does-not-accept-callable-objects` line.

## Acceptance criteria

- [ ] `arityCoerce` accepts an object with a `call` method, reading its arity
      from that method, as `arity_coerce` does.
- [ ] `behavior callbacks with callable objects` runs unskipped and green with
      its converged body unchanged.
