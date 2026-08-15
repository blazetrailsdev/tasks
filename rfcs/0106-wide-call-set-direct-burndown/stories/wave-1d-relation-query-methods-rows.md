---
title: "Wave 1d: relation.ts — the 17 rows Rails defines in relation/query_methods.rb"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6563
claim: "2026-08-15T13:15:05Z"
assignee: "wave-1b-relation-own-file-rows-remainder"
blocked-by: null
closed-reason: null
---

## Context

Slice 4 of the `relation.ts` burndown opened by `wave-1-relation-ts` (PR #6558).
This story owns the **17 rows whose method Rails defines in
`relation/query_methods.rb`** but which trails defines inline in `relation.ts`.

Measured 2026-08-15 from
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
at `kind: "set"`.

Methods in this slice (17 rows):

    arel_column (3), arel (2), arel_column_with_table (2),
    structurally_compatible? (2), in_order_of (4), extract_associated,
    joins, left_outer_joins, table_name_matches?

Note that `relation/query-methods.ts` has its own shard with 46 rows and its own
story (`wave-2-relation-family`). These 17 are the copies that live in the
`relation.ts` megafile — check `wave-2-relation-family`'s diff before starting so
the two do not converge the same body twice or conflict on the same file.

## Homonym warning — non-negotiable in this file

`relation.ts` carries the highest homonym density in the repo. Measured
2026-08-08 over activerecord's unreviewed baseline, 7 of 95
`first`/`last`/`any?`/`size`/`include?` rows have a relation-ish receiver, but
`except` is 7 of 11 `Relation#except` and `merge!` is 3 of 4 `Relation#merge!` —
the contamination is per-name. `compare.ts:177-188` documents why these are
deliberately not suppressed. Join to the Ruby call site via
`scripts/api-compare/output/rails-api.json` and split by receiver before writing
any shared reason. `match?` has no homonym and is safe.

## Acceptance criteria

- [ ] Every row converged against the Ruby body in
      `vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`,
      with the `file:line` cited.
- [ ] No row acted on by call name alone; receiver split done for every
      homonym-risk name.
- [ ] Rows deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PG, MySQL/MariaDB green.
