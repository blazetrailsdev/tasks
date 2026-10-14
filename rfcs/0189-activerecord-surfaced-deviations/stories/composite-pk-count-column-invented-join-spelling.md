---
title: "composite-pk-count-column-invented-join-spelling"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Duplicate: the invented `aggregateTarget` columnName.join(",") helper (origin/main relation/calculations.ts:734, called :895) is owned by the newer, sharper story calculations-inlines-type-caster-try-and-drops-aggregate-target in this RFC, whose AC deletes it.'
---

## Context

Surfaced while porting `perform_calculation` in #5897
(`converge-calculation-and-batch-dispatch-shim-bodies`).

Rails' `perform_calculation` sets `column_name = primary_key`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:434-458`)
and hands the value straight to `aggregate_column`
(`calculations.rb:414-423`), which stringifies whatever it receives. For a
composite primary key that means an Array reaches Arel and is emitted via
Ruby's `Array#to_s` — i.e. Rails itself emits broken SQL here, the same class of
issue recorded for composite-PK ordering.

trails cannot pass an array down that path (`aggregateColumn` takes
`string | Nodes.Node`), so #5897 added a narrowing helper, `aggregateTarget` in
`packages/activerecord/src/relation/calculations.ts`, which picks
`columnName.join(",")` for the composite case. That join is a trails invention:
it produces `COUNT(a,b)` where Rails produces `COUNT(["a", "b"])`. Both are
invalid SQL, but they are _differently_ invalid, and the helper currently
documents the choice rather than resolving it.

Note this is only reachable once `count` is routed through
`performCalculation` — see `converge-count-onto-calculate-perform-calculation`,
which owns that wiring. This story is the composite-PK arm of that work and
should be scheduled with or after it.

## Acceptance criteria

- The composite-PK count column either mirrors Rails' emitted spelling exactly,
  or raises a typed error at the point trails knows the shape is unsupported —
  not a silently-invented join.
- The choice is justified at the call site with the Rails `file:line`.
- `aggregateTarget`'s doc comment matches what the code actually does.
- `pnpm parity:api` and `pnpm parity:test` deltas are non-negative.
