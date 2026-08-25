---
title: "Wave 2: the relation family — query-methods, calculations, finder-methods (94 rows)"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: api-compare
packages: []
deps: ["wave-1-relation-ts"]
deps-rfc: []
est-loc: 350
priority: 2
pr: 6584
claim: "2026-08-15T23:15:04Z"
assignee: "wave-2-relation-family"
blocked-by: null
closed-reason: null
---

# Wave 2: the relation family — query-methods, calculations, finder-methods (94 rows)

## Context

Measured 2026-08-14 (`API_COMPARE_FORCE=1 pnpm parity:api --calls`, counted over
`scripts/api-compare/call-mismatches-exclude/**` at `kind: "set"`). Three files
in `packages/activerecord/src/relation/` carry **94 of RFC 0106's 1,134 in-scope
rows**:

| File                         | Rows |
| ---------------------------- | ---: |
| `relation/query-methods.ts`  |   46 |
| `relation/calculations.ts`   |   29 |
| `relation/finder-methods.ts` |   19 |

Together with Wave 1's `relation.ts` (117) this is 211 rows — 19% of the debt in
four files.

**Depends on Wave 1's attribution finding.** These three are exactly the modules
`relation.ts` includes, so whichever way Wave 1's own-file-vs-mixin measurement
lands, it moves rows between that file and these. Do not start this wave until
`wave-1-relation-ts` has reported; if misattribution is material, some of these
94 are the same rows counted from the other side and the real number is lower.

## Mechanism notes

`finder-methods.ts` and `calculations.ts` are where the enumerable/predicate
class concentrates on a genuinely relation-shaped receiver — `first`, `last`,
`empty?`, `any?`, `size`, `count`. These are the rows where the homonym trap is
not a trap at all but the real thing: `Relation#size` is
`loaded? ? records.length : count(:all)` and `#first`/`#last` route to
`find_nth_with_limit`/`find_last`. A port that answers from a preloaded array
where Rails would issue a query is a genuine defect, and it is what these rows
exist to catch.

So: in this wave, expect a **higher genuine-divergence rate than the 7-of-95
figure** measured across activerecord generally, and treat a row that looks like
a plain JS idiom with suspicion rather than relief. Join to the Ruby call site
via `output/rails-api.json`; check what the Rails body does with the result.

`query-methods.ts` additionally overlaps RFC 0096's naming burndown (it carries
6 in-scope naming rows) and RFC 0099's args burndown (1 row, `excluding! -> new`).
Those are different gates over the same shards, each reading only its own kind —
converge the set rows here without disturbing the others, and if a fix would
retire rows in more than one dimension, say so in the PR body so the other RFCs'
counts reconcile.

## Acceptance criteria

- [ ] Wave 1's attribution finding is read and its consequence for these three
      files is stated in the PR body before any body is edited.
- [ ] Every converged row is verified against the Ruby body — in particular,
      each `first`/`last`/`size`/`empty?`/`any?` row is checked for whether the
      Rails body issues a query, and a port that short-circuits to a loaded
      array is fixed, not baselined.
- [ ] Rows that cannot converge carry a reviewed one-line reason or a
      `@missingRailsCall` tag at the call site.
- [ ] Rows deleted by hand from their shards; stale marks fixed with
      `pnpm parity:api:calls:tighten <shard>`. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` green; in-scope count falls and does not rise.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Notes

Three files, 94 rows — file one story per file if the first exceeds the LOC
ceiling. Do not fan out PRs from this claim.
