---
title: "pg-exec-remaining-callers-and-deletion"
status: done
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7644
claim: "2026-09-09T13:39:48Z"
assignee: "pg-exec-remaining-callers-and-deletion"
blocked-by: null
closed-reason: null
---

## Context

Second and final half of `pg-exec-is-a-trails-only-raw-query-path`. That story's
PR converted the four largest caller files (332 sites: `uuid.test.ts`,
`schema.test.ts`, `postgresql-adapter.trails.test.ts`, `geometric.test.ts`) from
`adapter.exec(...)` to `adapter.execute(...)`; the remainder did not fit under
the 700 LOC ceiling.

`PostgreSQLAdapter#exec` (search `async exec(` in
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`) has no
counterpart in
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`
or `postgresql/database_statements.rb`. `execute`
(`abstract/database_statements.rb:161`) is the Rails spelling and routes through
`performQuery` / `rawExecute`, so it picks up logging, query-cache bookkeeping,
`preprocessQuery`'s comment transformers and exception translation — all skipped
by the raw `exec` path.

Remaining call sites (~191), all under
`packages/activerecord/src/`:

- `connection-adapters/postgresql/schema-statements.ts:1197,1207` — the only two
  non-test callers (`this.exec(...)` in `createRangeType` / `dropRangeType`).
- `adapters/postgresql/postgresql-adapter.test.ts` (26),
  `connection-adapters/postgresql/schema-statements.trails.test.ts` (24),
  `enum.test.ts` (17), `rename-table.test.ts` (13), `datatype.test.ts` (13),
  `timestamp.test.ts` (10), `integer.test.ts` (9), `change-schema.test.ts` (9),
  `quoting.test.ts` (7), `foreign-table.test.ts` (7), `explain.test.ts` (7),
  `bit-string.test.ts` (7), `array.test.ts` (7), `utils.test.ts` (6),
  `full-text.test.ts` (6), `range.test.ts` (4),
  `postgresql-adapter-perform-query.trails.test.ts` (4),
  `transaction.test.ts` (3), `interval.test.ts` (3), `infinity.test.ts` (3),
  `date.test.ts` (3), `statement-pool.trails.test.ts` (2),
  `case-insensitive.test.ts` (2), `virtual-column.test.ts` (1).

Every remaining call passes a single statement — a scan of the balanced
argument of each `.exec(` found no embedded `;` — so unlike the SQLite half this
is a straight rename with no per-statement loop splitting. `execute`'s signature
is `execute(sql, name?, kwargs?)`; `exec`'s callers all pass sql only.

Once no callers remain, delete `PostgreSQLAdapter#exec` itself.

## Acceptance criteria

- [ ] No `PostgreSQLAdapter#exec` — the method is deleted and every caller uses
      `execute`, or carries a `@noRailsEquivalent` receipt naming a need
      `execute` cannot serve.
- [ ] `pnpm parity:api:extra --package activerecord` novel count strictly drops,
      and `pnpm parity:api:extra:tighten` narrows the mark.
- [ ] PostgreSQL lanes green.
