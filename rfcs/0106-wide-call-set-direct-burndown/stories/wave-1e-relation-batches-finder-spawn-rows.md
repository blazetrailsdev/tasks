---
title: "Wave 1e: relation.ts — the 20 batches/finder/delegation/spawn rows"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6566
claim: "2026-08-15T14:45:06Z"
assignee: "wave-1e-relation-batches-finder-spawn-rows"
blocked-by: null
closed-reason: null
---

## Context

Final slice of the `relation.ts` burndown opened by `wave-1-relation-ts`
(PR #6558). This story owns the **20 rows whose method Rails defines in
`relation/batches.rb`, `relation/finder_methods.rb`, `relation/delegation.rb`
and `relation/spawn_methods.rb`** but which trails defines inline in
`relation.ts`.

Measured 2026-08-15 from
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
at `kind: "set"`.

| Rails home                   | rows | methods                                                                                                                                          |
| ---------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `relation/batches.rb`        | 9    | `batch_on_unloaded_relation` (3), `in_batches` (2), `find_each`, `find_in_batches`, `record_cursor_values`, `ensure_valid_options_for_batching!` |
| `relation/finder_methods.rb` | 5    | `apply_join_dependency` (4), `exists?`                                                                                                           |
| `relation/delegation.rb`     | 3    | `create`                                                                                                                                         |
| `relation/spawn_methods.rb`  | 3    | `only` (2), `except`                                                                                                                             |

`except` and `only` are homonym-risk names: measured 2026-08-08, `except` is 7
of 11 `Relation#except`, so the contamination is real but per-name. Join to the
Ruby call site via `scripts/api-compare/output/rails-api.json` and split by
receiver before writing any shared reason — never act on a call name alone
(`compare.ts:177-188`).

## Known behavioural gap in this cluster

`#skip_query_cache! with a preload`
(`vendor/rails/activerecord/test/cases/relations_test.rb:2424-2438`) exists in
`packages/activerecord/src/relations.test.ts` as a name-only placeholder
asserting nothing. #6558 wired `skipQueryCacheIfNecessary` into the load and
pluck paths and gave the other three `#skip_query_cache!` tests their real Rails
assertions; the preload arm was left because `preloadAssociations` does not route
through it. Rails wraps it inside `exec_queries` (`relation.rb:1404, 1415`).
Converging that should come with the placeholder replaced by the verbatim Rails
assertion (`assert_queries_count(2)` / `(4)`), which fails today.

## Acceptance criteria

- [ ] Every row converged against the Ruby body, with the `file:line` cited.
- [ ] The `#skip_query_cache! with a preload` placeholder carries its Rails
      assertions and fails on the pre-change tree.
- [ ] Rows deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PG, MySQL/MariaDB green.
