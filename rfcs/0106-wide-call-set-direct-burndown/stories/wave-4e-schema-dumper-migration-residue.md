---
title: "wave-4e-schema-dumper-migration-residue"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6689
claim: "2026-08-18T12:07:58Z"
assignee: "wave-4e-schema-dumper-migration-residue"
blocked-by: null
closed-reason: null
---

# Wave 4e residue: schema-dumper, migration, command-recorder, schema (38 rows)

## Context

`wave-4e-schema-migration-tasks-residue` shipped the `tasks/*` half of its
slice (28 rows across `tasks/database-tasks.json`,
`tasks/mysql-database-tasks.json`, `tasks/postgresql-database-tasks.json`) and
stopped there for the LOC ceiling. The remaining shards from that story's
measurement are untouched:

    schema-dumper.json               19
    migration.json                   14
    migration/command-recorder.json   4
    schema.json                       1

`schema-dumper.ts` and `migration.ts` are nominally RFC 0051's territory — the
one delegated RFC that is actually shipping. Coordinate with its open stories
rather than colliding, and prefer converging here only where 0051 has no live
story on the same body.

The class rules from RFC 0106 apply unchanged: a class-wide action requires a
receiver split — join to the Ruby call site via `output/rails-api.json` and
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
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` before
      trusting any NEW row.
