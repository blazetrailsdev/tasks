---
title: "pluck-type-cast-min-expression-not-cast"
status: closed
updated: 2026-09-20
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
closed-reason: "duplicate of pluck-aggregate-expression-not-type-cast, which the merged BLOCKED: line in calculations.test.ts cites (trails#7914)"
---

## Context

Parked test: `pluck type cast` in `packages/activerecord/src/calculations.test.ts`
(`it.skip`, BLOCKED). Rails `calculations_test.rb:903-913` asserts
`relation.pluck("min(written_on)", "min(replies_count)")` equals
`[[topic.written_on, topic.replies_count]]`.

trails returns the raw string `"2003-07-16 14:28:11.223300"` for the expression
column on SQLite instead of a Time. Not investigated beyond that: how Rails casts
it (SQLite `stmt.types` is nil for expressions; check the `pluck` result-type
path in `relation/calculations.rb` `type_cast_pluck_values` and the
`column_types`/`attribute_types` lookup for `min(...)` aliases) is unestablished.

## Acceptance criteria

- The fourth assertion of `pluck type cast` passes; remove `it.skip`/BLOCKED.
