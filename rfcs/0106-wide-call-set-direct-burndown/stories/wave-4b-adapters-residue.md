---
title: "Wave 4b: the adapter residue"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 700
pr: 6718
claim: "2026-08-18T19:57:44Z"
assignee: "wave-4b-adapters-residue"
blocked-by: null
closed-reason: null
---

# Wave 4b: the adapter residue (177 rows)

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

177 rows across 40 shards, 39 of them in <=3-row files. Wave 3 (PRs #6560,
6567, 6577 and 6581) converged the three named adapter files but left residue,
and the abstract layer was never in Wave 3's file list:

    connection-adapters/postgresql-adapter.json             15
    connection-adapters/sqlite3-adapter.json                15
    connection-adapters/abstract/schema-definitions.json    13
    connection-adapters/abstract-adapter.json               12
    connection-adapters/abstract/schema-statements.json     12
    connection-adapters/abstract-mysql-adapter.json         11
    connection-adapters/abstract/connection-pool.json       10
    connection-adapters/mysql/schema-dumper.json             7
    connection-adapters/schema-cache.json                    7
    connection-adapters/abstract/schema-creation.json        6
    connection-adapters/sqlite3/database-statements.json     6
    connection-adapters/abstract/transaction.json            5
    connection-adapters/mysql2-adapter.json                  5
    connection-adapters/postgresql/database-statements.json  5
    connection-adapters/statement-pool.json                  5
    connection-adapters/sqlite3/schema-statements.json       4
    + 24 shards with 1-3 rows each

Coordinate rather than collide: the `exec_insert` / `exec_delete` /
`exec_update` rows on `abstract-adapter.ts` are NOT a recorder or call-set
defect — they come from the `DatabaseStatements` defaults object in
`connection-adapters/abstract/database-statements.ts:1733/1745/1754`, and their
convergence is a behavioural execute-primitive reshape owned by RFC 0076 (see
the closed story `call-recorder-matches-bodiless-interface-declarations` for the
full measurement). Leave them to 0076 with a reviewed reason; do not reshape
`execInsert`'s return type inside this story. Same posture for `with_connection`
rows, which are RFC 0073 pool-checkout divergence.

`connection-adapters/abstract/connection-pool.json` and `statement-pool.json`
are the other likely 0073 overlap — check before converging.

The class rules from the RFC apply unchanged: **a class-wide action requires a
receiver split** — join to the Ruby call site via `output/rails-api.json` and
split by receiver before writing a shared reason or a bulk conversion.
`compare.ts:177-188` documents why the enumerable/predicate names are
deliberately not suppressed.

## Acceptance criteria

- [ ] Every row in the listed shards is either converged (the TS body makes the
      call Rails makes, verified against the Rails source line) or leaves as a
      reviewed one-line per-site reason / a `@missingRailsCall` tag at the call
      site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — this slice is the one
      where a green SQLite run is least sufficient as evidence.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` before
      trusting any NEW row (see `call-mismatches-partial-regen-invents-phantom-rows`).
- [ ] Split across more than one PR if the LOC ceiling demands it — ship the
      first slice and file the rest rather than exceeding the ceiling.
