---
title: "wave-2b-query-methods-calculations"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6587
claim: "2026-08-16T00:45:03Z"
assignee: "wave-2b-query-methods-calculations"
blocked-by: null
closed-reason: null
---

## Context

RFC 0106's `wave-2-relation-family` claimed three files —
`relation/query-methods.ts` (46 `kind: "set"` rows),
`relation/calculations.ts` (29) and `relation/finder-methods.ts` (19).
Its own note says "file one story per file if the first exceeds the LOC
ceiling". The wave-2 PR converged `finder-methods.ts` (19 → 11 rows: the
`loaded?` cluster now reads `Relation#isLoaded`/`records()` instead of the
`_loaded`/`_records` ivars, `construct_relation_for_exists` and
`find_some_ordered` now call `except`/`limit!`/`_select!` as Rails does, and
`ordered_relation` builds `table[column].asc` Arel nodes) and hit the LOC
ceiling there. These two files were not touched.

This story owns the remaining two files, measured 2026-08-15 over
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/`:

| File                        | Rows |
| --------------------------- | ---: |
| `relation/query-methods.ts` |   46 |
| `relation/calculations.ts`  |   29 |

## Mechanism notes

Carry over wave-2's guidance verbatim: `calculations.ts` concentrates the
enumerable/predicate class on a genuinely relation-shaped receiver
(`Relation#size` is `loaded? ? records.length : count(:all)`), so a port that
answers from a preloaded array where Rails would issue a query is a genuine
defect, not a JS idiom. Join to the Ruby call site via `output/rails-api.json`
before acting on any row.

`query-methods.ts` also overlaps RFC 0096's naming burndown (6 in-scope naming
rows) and RFC 0099's args burndown (1 row, `excluding! -> new`). Those gates
read the same shards but only their own `kind`; converge the set rows without
disturbing them, and say so in the PR body if a fix retires rows in more than
one dimension.

Wave 1's attribution finding (PR #6558) applies: `relation.ts` genuinely
defines many `relation/*.rb` methods itself, so its rows and these are
distinct rows, not double counting.

## Acceptance criteria

- [ ] Every converged row verified against the Ruby body; each
      `first`/`last`/`size`/`empty?`/`any?` row checked for whether Rails
      issues a query, and a short-circuit to a loaded array fixed, not baselined.
- [ ] Rows that cannot converge carry a reviewed one-line reason or a
      `@missingRailsCall` tag at the call site.
- [ ] Rows deleted by hand from their shards; stale marks fixed with
      `pnpm parity:api:calls:tighten <shard>`. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` green; in-scope count falls and does not rise.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Notes

75 rows across two files will not fit one PR at the LOC ceiling. Ship the
slice that fits and file the rest as its own story rather than fanning out PRs.
