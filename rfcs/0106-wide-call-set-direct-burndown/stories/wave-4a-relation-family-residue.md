---
title: "Wave 4a: the relation-family residue (94 rows)"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: ["activerecord"]
deps:
  - ruby-empty-predicate-has-no-ts-call-spelling
  - compute-cache-version-makes-rails-calls
  - converge-execute-grouped-calculation-body-to-rails-source-order
deps-rfc: []
est-loc: 600
pr: 6721
claim: "2026-08-18T20:46:48Z"
assignee: "wave-4a-relation-family-residue"
blocked-by: null
closed-reason: null
---

# Wave 4a: the relation-family residue (94 rows)

## Context

Waves 1-3 of this RFC are all `done`, so per the Rollout section Wave 4 is now
due: "the rest of the head and then the <=3-row tail". Re-measured against
`origin/main` on 2026-08-17 over `scripts/api-compare/call-mismatches-exclude/**`
at `kind: "set"`, restricted to `activerecord` / `arel` / `activesupport`:

**900 rows across 213 files** (down from the RFC's 1,134 / 217 baseline of
2026-08-14) — activerecord 739, activesupport 161, arel 0.

Wave 4 is filed as one story per file cluster so the slices stay
non-overlapping and standalone from `main`, the way waves 1-3 were.

### The slice

94 rows across 12 shards, only 6 of them in <=3-row files — this is the densest
remaining cluster and the direct continuation of waves 1 and 2, whose PRs
(#6558, #6584, #6563, #6564, #6566, #6587, #6603) left a residue rather than
reaching zero:

    relation/query-methods.json            20
    relation.json                          17
    relation/calculations.json             14
    relation/delegation.json                9
    relation/finder-methods.json            9
    relation/batches.json                   5
    relation/batches/batch-enumerator.json  5
    relation/merger.json                    5
    relation/where-clause.json              4
    relation/predicate-builder.json         3
    plus 3 x 1-row predicate-builder/* shards

Four already-filed stories carve out part of this and are NOT in scope here —
do them first or coordinate: `ruby-empty-predicate-has-no-ts-call-spelling`
(the `empty?` class), `compute-cache-version-makes-rails-calls`,
`relation-arel-build-arel-routing`, and
`converge-execute-grouped-calculation-body-to-rails-source-order`.

Known residue that is extractor attribution, not divergence: 4 of relation.ts's
17 rows (`first -> find_nth`, `first -> find_nth_with_limit`,
`last -> find_last`, `last -> limit`) are `Relation::ExplainProxy#first/#last`
colliding with the homonymous `Relation#first/#last` because the extractor keys
a row by `<tsFile, rubyName>`. Those retire when the extractor disambiguates
nested classes (RFC 0107), not here — confirm the current disposition before
spending effort on them. This is direct evidence for the RFC's Open Question 1
and should be reported as part of this story.

The class rules from the RFC apply unchanged. In particular the frequency head
is still enumerable/predicate-shaped — re-measured in-scope call-name counts are
`first` 41, `new` 38, `empty?` 32, `fetch` 27, `any?` 25, `merge` 19, `map` 16,
`include?` 16 — so **a class-wide action requires a receiver split**: join to the
Ruby call site via `output/rails-api.json` and split by receiver before writing a
shared reason or a bulk conversion. `compare.ts:177-188` documents why these
names are deliberately not suppressed.

## Acceptance criteria

- [ ] Every row in the listed shards is either converged (the TS body makes the
      call Rails makes, verified against the Rails source line) or leaves as a
      reviewed one-line per-site reason / a `@missingRailsCall` tag at the call
      site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` before
      trusting any NEW row (see `call-mismatches-partial-regen-invents-phantom-rows`).
- [ ] Split across more than one PR if the LOC ceiling demands it — ship the
      first slice and file the rest rather than exceeding the ceiling.
