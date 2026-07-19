---
title: "Fix schema-dumper.trails.test.ts PG flake (schema_migrations dup-key + dump timeout)"
status: draft
updated: 2026-07-19
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/schema-dumper.trails.test.ts`
(`SchemaDumperAdapterTest`) flakes on the PG lane under 8-fork parallelism with
two distinct symptoms:

- `duplicate key value violates unique constraint "schema_migrations_pkey"`
  (`Key (version)=(20240101000000) already exists`) — a prior test's
  schema_migrations version row survives in the shared worker DB (truncate skips
  schema_migrations by design), so the dumpWithVersion insert collides. This is
  a real shared-state bug, not a timeout.
- `Test timed out in 5000ms` — full-DB schema dump under fork load, same root
  cause as the comment.test dump-timeout flake and as #4976
  (`postgresql/schema.test.ts > dumping schemas`).

Seen green on re-run for PR #4543.

## Acceptance criteria

- [ ] dumpWithVersion no longer collides on a surviving schema_migrations row
      (clean the version row, or use a per-test unique version).
- [ ] The dump-heavy cases carry an explicit timeout above the 5s default.
- [ ] Both fixed in one pass — they co-occur in the same file.
- [ ] Do NOT rename tests (test:compare matching).
