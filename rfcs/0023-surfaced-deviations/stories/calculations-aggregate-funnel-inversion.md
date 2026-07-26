---
title: "Invert the aggregate funnel so execute_simple/grouped_calculation are the real bodies"
status: draft
updated: 2026-07-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging cross-helper `model` reads (PR #5371, story
`converge-relation-cross-helper-model-reads`).

Rails funnels every aggregate through `calculate` →
`execute_simple_calculation` / `execute_grouped_calculation`
(vendor/rails/activerecord/lib/active_record/relation/calculations.rb:469 and
:514): `sum`, `average`, `minimum`, `maximum` and `count` all reach the DB via
those two private methods, which own the `model.with_connection` /
`model.name` / `model.adapter_class` reads.

trails inverts the funnel. `sum`/`average`/`minimum`/`maximum` call the
trails-invented `singleAggregate` helper directly, the grouped arms call
`groupedAggregate`, and the Rails-named `executeSimpleCalculation` /
`executeGroupedCalculation` are thin delegating wrappers reached only from
`performCalculation`. The Rails bodies are therefore empty of the reads Rails
puts in them — both wide-ratchet `model` entries are excluded on exactly that
basis (packages/activerecord/src/relation/calculations.ts).

Consequence: the two Rails-named methods are not the real code path, so any
behaviour a reader expects to find there (query-cache skipping, the
`where_clause.contradiction?` empty-result shortcut, `@async` FutureResult
wrapping) has to be looked for elsewhere, and drift between the wrapper and
the helper is invisible to the parity tooling.

## Acceptance criteria

- Invert the funnel: `singleAggregate`/`groupedAggregate` become the bodies of
  `executeSimpleCalculation`/`executeGroupedCalculation`, and the public
  aggregate arms (`sum`/`average`/`minimum`/`maximum`/grouped `count`) reach
  the DB through them the way Rails' `calculate` does — or record why the
  inversion must stay.
- If converged, the two wide-ratchet `model` exclusions in
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/calculations.json`
  are deleted and `pnpm api:calls:wide` stays green with a baseline that does
  not grow.
- Existing calculations tests stay green; no test renames.
