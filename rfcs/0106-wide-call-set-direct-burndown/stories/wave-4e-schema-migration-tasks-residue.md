---
title: "Wave 4e: schema-dumper, migration and database-tasks"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 500
priority: 10
pr: 6664
claim: "2026-08-17T18:48:11Z"
assignee: "activesupport-empty-predicate-call-rows"
blocked-by: null
closed-reason: null
---

# Wave 4e: schema-dumper, migration and database-tasks (66 rows)

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

66 rows across 7 shards, and almost none of it is tail — 65 of the 66 rows sit
in files with 4+ rows, so this is the densest-per-file cluster left:

    schema-dumper.json                     19
    tasks/database-tasks.json              19
    migration.json                         14
    tasks/postgresql-database-tasks.json     5
    migration/command-recorder.json          4
    tasks/mysql-database-tasks.json          4
    schema.json                              1

`schema-dumper.ts` and `migration.ts` are nominally RFC 0051's territory — the
one delegated RFC that is actually shipping (measured at 289 done / 30 open).
Coordinate with its open stories rather than colliding, and prefer converging
here only where 0051 has no live story on the same body.

`tasks/*-database-tasks.ts` (28 rows across three shards) has no other owner and
is the clearest standalone half of this slice — a good first PR.

The class rules from the RFC apply unchanged: **a class-wide action requires a
receiver split** — join to the Ruby call site via `output/rails-api.json` and
split by receiver before writing a shared reason or a bulk conversion.

## Acceptance criteria

- [ ] Every row in the listed shards is either converged (the TS body makes the
      call Rails makes, verified against the Rails source line) or leaves as a
      reviewed one-line per-site reason / a `@missingRailsCall` tag at the call
      site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — schema dumping and
      database tasks are the most adapter-divergent bodies in the RFC.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` before
      trusting any NEW row (see `call-mismatches-partial-regen-invents-phantom-rows`).
- [ ] Split across more than one PR if the LOC ceiling demands it — ship the
      first slice and file the rest rather than exceeding the ceiling.
