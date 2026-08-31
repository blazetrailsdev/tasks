---
title: "Port activemodel's three remaining type/date, type/time and type/date_time cases"
status: done
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activemodel"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6988
claim: "2026-08-31T15:55:17Z"
assignee: "port-activemodel-type-temporal-cases"
blocked-by: null
closed-reason: null
---

## Context

activemodel is at 960/963 (99.7%) with 0 skipped, and has held at 3 remaining
since 2026-07-29 (the forecast doc's tail evidence: ~1 test per 5 weeks). The
three are one each in:

- `vendor/rails/activemodel/test/cases/type/date_test.rb`
- `vendor/rails/activemodel/test/cases/type/time_test.rb`
- `vendor/rails/activemodel/test/cases/type/date_time_test.rb`

against `packages/activemodel/src/type/{date,time,date-time}.test.ts` over
`packages/activemodel/src/type/`. These are temporal-cast cases, so RFC 0088
(`date-gem-port`) is the neighbouring surface — its
`activemodel-types-construct-through-date-package` and
`activemodel-time-readers-take-rational-sec-fraction-value` stories touch the
same files. Check whether either has landed before starting, and coordinate
rather than conflicting.

Get the exact three names with
`pnpm parity:test -- --package activemodel --missing`.

## Acceptance criteria

- All three tests exist with Rails names verbatim and pass on all lanes.
- `pnpm parity:test -- --package activemodel` reads 100% with `skipped = 0`.
- The temporal behavior comes through `@blazetrails/date` where the Rails code
  goes through Ruby's `Date`/`Time`, matching RFC 0088's direction — no
  bespoke parsing added to activemodel.
