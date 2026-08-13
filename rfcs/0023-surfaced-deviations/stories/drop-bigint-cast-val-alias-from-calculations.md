---
title: 'Drop the "val" CAST-anchor alias from the calculation projections'
status: draft
updated: 2026-08-13
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`execute_simple_calculation` projects the bare aggregate —
`relation.select_values = [select_value]`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:484`).

trails' `executeSimpleCalculation`
(`packages/activerecord/src/relation/calculations.ts`) adds an `.as("val")`
alias on one path only: when the aggregate is over a bigint column on SQLite,
the compiled SQL is wrapped as
`SELECT CAST("val" AS TEXT) AS "val" FROM (<inner>) AS "_bigint_agg"`
(`wrapBigintAgg`), and `"val"` is the anchor that wrapper reads back. SQLite
returns a lossy JS number for a bigint aggregate because SUM/MIN/MAX over a
computed column has no declared type, so `_maybeEnableSafeIntegers` never fires.

The grouped arms carry the same wrapper (with their own aliases).

## Converged shape

Get the bigint aggregate back as a string without a projection alias Rails does
not have — e.g. drive the cast from the driver/type layer (declare the result
type for the aggregate column so safe-integers engages), or move the CAST into
the projected expression so the outer SELECT wrapper disappears entirely. Either
way `select_values` becomes exactly `[select_value]`.

## Acceptance criteria

- [ ] No `.as("val")` (or grouped equivalent) added purely to anchor a CAST
      wrapper.
- [ ] SQLite bigint sum/min/max still return exact values (the bigint tests in
      `calculations.test.ts` / `calculations.trails.test.ts` stay green).
