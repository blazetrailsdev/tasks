---
title: "naming-burndown-activerecord-rest-2"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6356
claim: "2026-08-11T13:26:07Z"
assignee: "naming-burndown-activerecord-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Continuation of `naming-burndown-activerecord-rest` (RFC 0096). That story's PR
converged 48 `naming` call-argument rows in
`packages/activerecord/src/tasks/database-tasks.ts`,
`connection-adapters/abstract-adapter.ts`,
`connection-adapters/abstract-mysql-adapter.ts`,
`connection-adapters/sqlite3-adapter.ts` and
`connection-adapters/abstract/database-statements.ts`, and stopped at the LOC
ceiling. 386 `naming` rows remain in `packages/activerecord/src/`, the largest
buckets being:

- `connection-adapters/abstract/schema-statements.ts` (27)
- `relation/query-methods.ts` (12)
- `connection-adapters/abstract/schema-creation.ts` (9)
- `schema-dumper.ts` (9)
- `associations/collection-association.ts` (8)
- `connection-adapters/abstract/database-statements.ts` (8, the ones not in
  `insert`/`update`/`delete`)
- `connection-adapters/schema-cache.ts` (8)
- `relation/batches.ts` (8)

(`relation.ts` (60) and `connection-adapters/postgresql-adapter.ts` (36) belong
to their own sibling burndown stories — do not touch them here.)

List the rows with:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
pnpm parity:api:calls:args:report
```

and filter `output/call-arg-mismatches.json` to `class === "naming"`.

Known non-renames observed while landing the first PR, to leave alone:

- Ruby `null` / `default` are JS reserved words; the settled trails spelling is
  `null_` / `default_` and the row stays.
- Ruby `args.last` inside a `register_type` block (abstract_adapter.rb:872,921)
  has no local to rename — the TS block takes a typed `sqlType` param.
- `AbstractMysqlAdapter#case_sensitive_comparison` passes
  `attribute.quotedNode(value)` where Rails passes `value` — an argument-shape
  defect, not a naming one (AC4). File it against the RFC owning that file.

## Acceptance criteria

1. Every local/parameter identifier in the files listed above is renamed to the
   Rails identifier, camelCased per `docs/ruby-ts-conventions.md`.
2. No public surface changes and no behavior changes; `pnpm parity:api:extra`
   and `pnpm parity:api` unchanged.
3. `naming` row count for the package drops by the rows converged; report
   before/after in the PR body.
4. Argument-ORDER defects and invented call-site conversions are filed, not
   renamed away.
5. Split further if the diff exceeds the LOC ceiling; do not touch `relation.ts`
   or `postgresql-adapter.ts`.
