---
title: "Drop the as-unknown-as-number cast in finder.test.ts now that Relation#offset accepts a string"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 15
priority: 19
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `test_finder_with_offset_string`
(vendor/rails/activerecord/test/cases/finder_test.rb:1754) is
`assert_nothing_raised { Topic.offset("3").to_a }` — `offset` accepts a
string. trails types `Relation#offset` as taking a `number`, so the ported
test in `packages/activerecord/src/finder.test.ts` (merged in #5274) has to
write `CanonicalTopic.offset("3" as unknown as number)` with a call-site
comment. The runtime path works; only the type signature diverges.

## Acceptance criteria

- `Relation#offset` (and the `offset` value in `relation/query-methods.ts`)
  accepts `number | string`, matching Rails' `offset(value)`.
- The `as unknown as number` cast and its justification comment in
  `finder.test.ts` "finder with offset string" are removed.
- Coverage that a string offset produces the same SQL as the numeric one.

## Audit 2026-10-22

**Partly landed.** trails#6602 typed `Relation#offset(value: number | string | null)`
(`packages/activerecord/src/relation.ts:1969`). What remains is the cast in
`finder.test.ts:1454` (`CanonicalTopic.offset("3" as unknown as number)`), which should be
`CanonicalTopic.offset("3").toArray()` as `finder_test.rb:1754` reads, plus the SQL
coverage criterion.
