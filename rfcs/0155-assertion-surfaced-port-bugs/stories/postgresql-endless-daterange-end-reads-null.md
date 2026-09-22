---
title: "postgresql-endless-daterange-end-reads-null"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `adapters/postgresql/range_test.rb` (assertions-postgresql-range-and-schema).
Rails `test_daterange_values` (`vendor/rails/activerecord/test/cases/adapters/postgresql/range_test.rb:141-147`)
asserts an endless daterange (`[2012-01-02,]`) reads back as `Date.new(2012,1,2)...Float::INFINITY`.
trails reads it back as `Range(PlainDate 2012-01-02, null, excludeEnd)` — the end is `null`, not `Infinity`.
The converged body is parked `it.skip` in `packages/activerecord/src/adapters/postgresql/range.test.ts`
("daterange values"), assertions intact.

Established: `RangeType#sanitizeBounds` (`packages/activerecord/src/connection-adapters/postgresql/oid/range.ts:105-110`)
ports Rails' `sanitize_bounds` (`activerecord/lib/active_record/connection_adapters/postgresql/oid/range.rb:81-86`),
which keeps `to == Float::INFINITY` when `INFINITE_FLOAT_RANGE.cover?(from)`. In Ruby
`(-Float::INFINITY..Float::INFINITY).cover?(Date.new(2012,1,2))` is `true` (checked with `ruby`);
in trails `INFINITE_FLOAT_RANGE.cover(Temporal.PlainDate)` is false, so `to` is nulled.
(Not yet established: whether the fix belongs in ruby-compat `Range#cover` comparison of a Float bound
against a Temporal.PlainDate, or in the port.)

## Acceptance criteria

- `it.skip` on "daterange values" in `range.test.ts` is removed and the test passes with its Rails assertions unchanged.
- A regression test fails on baseline: an endless daterange (`[2012-01-02,]`) reads back with end `Infinity`.
