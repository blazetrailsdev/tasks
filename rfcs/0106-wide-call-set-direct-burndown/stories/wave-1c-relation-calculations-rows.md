---
title: "Wave 1c: relation.ts — the 29 rows Rails defines in relation/calculations.rb"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6564
claim: "2026-08-15T13:45:02Z"
assignee: "wave-1c-relation-calculations-rows"
blocked-by: null
closed-reason: null
---

## Context

Slice 3 of the `relation.ts` burndown opened by `wave-1-relation-ts` (PR #6558).
This story owns the **29 rows whose method Rails defines in
`relation/calculations.rb`** but which trails defines inline in the
`relation.ts` megafile (so the extractor correctly attributes them there — see the attribution
measurement in PR #6558).

Measured 2026-08-15 from
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
at `kind: "set"`.

Methods in this slice (29 rows):

    execute_grouped_calculation (14), execute_simple_calculation (3),
    ids (4 -> now fewer, re-measure), type_cast_pluck_values (2),
    lookup_cast_type_from_join_dependencies (2), select_for_count (2),
    all_attributes?, pick, type_for

`execute_grouped_calculation` alone is 14 rows — the densest single method left
in the file. Rails' body is `calculations.rb:439-520`; read it whole before
touching the TS, because the TS version is a restructured port rather than a
line-by-line one.

## Known behavioural gap in this cluster

`#skip_query_cache! for a simple calculation` and
`#skip_query_cache! for a grouped calculation`
(`vendor/rails/activerecord/test/cases/calculations_test.rb:1720-1746`) exist in
`packages/activerecord/src/calculations.test.ts` as name-only placeholders
asserting nothing. #6558 wired `skipQueryCacheIfNecessary` into the load and
pluck paths and gave those two tests their real Rails assertions; the
calculation arms were left because `executeSimpleCalculation` /
`executeGroupedCalculation` do not route through it. Rails wraps at
`calculations.rb:471` and `calculations.rb:521`. Converging the
`skip_query_cache_if_necessary` rows in this slice should come with those two
placeholders replaced by the verbatim Rails assertions, which fail today.

## Acceptance criteria

- [ ] Every row converged against the Ruby body, not inferred from the name.
- [ ] The two `#skip_query_cache!` calculation placeholders carry their Rails
      assertions (`Account.cache` + `assert_queries_count(1)` / `(2)`), and fail
      on the pre-change tree.
- [ ] Rows deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PG, MySQL/MariaDB green.
