---
title: "Check port composition points against the MRO"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5830
claim: "2026-08-01T21:46:01Z"
assignee: "composition-chain-mro-check"
blocked-by: null
closed-reason: null
---

## Context

The `static-super-linearization` story's stated motivation was that a static
MRO "lets the conformance scorer verify the hand-maintained composition
chains match Rails' MRO". PR #5817 delivers the linearization and feeds it to
the scorer, so resolved supers are now visible — but nothing actually
_checks_ the port's composition order against the MRO.

The port realizes super chains at composition points: e.g. Rails'
`Inheritance#initialize_internals_callback` is `super; ensure_proper_type`,
while the port holds only `ensureProperType.call(this)`
(`packages/activerecord/src/inheritance.ts:824`) and `base.ts:3212`/`3291`
call the contributions in order. That ordering is hand-maintained and can
silently drift from `base.rb`'s include order; today the only record is the
per-row sign-off added in `convergence-signoff.json`.

## Acceptance criteria

- A check compares the order of contributions at a port composition point
  against `Linearization.ancestry` for that method, and fails on drift.
- Applies to at least the realized chains that currently carry sign-offs.
- A test proves the check fails when a composition point is reordered.
