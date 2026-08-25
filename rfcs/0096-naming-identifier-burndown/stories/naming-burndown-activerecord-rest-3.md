---
title: "naming-burndown-activerecord-rest-3"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6366
claim: "2026-08-11T15:43:39Z"
assignee: "naming-burndown-activerecord-rest-3"
blocked-by: null
closed-reason: null
---

## Context

Continuation of `naming-burndown-activerecord-rest-2` (RFC 0096). That story's
PR converged the `connection-adapters/abstract/schema-statements.ts` bucket
(27 rows) and stopped there, since the PR also carried three RFC 0099 stories.

Run to list the remaining rows:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
pnpm parity:api:calls:args:report
```

and filter `output/call-arg-mismatches.json` to `class === "naming"` and
`package === "activerecord"`. As of the parent PR, 413 remain; the largest
buckets not already owned by a sibling story (`relation.ts` and
`connection-adapters/postgresql-adapter.ts` have their own — do not touch them
here) are:

- `tasks/database-tasks.ts` (31)
- `connection-adapters/abstract-adapter.ts` (13)
- `connection-adapters/abstract-mysql-adapter.ts` (13)
- `relation/query-methods.ts` (11)
- `connection-adapters/sqlite3-adapter.ts` (10)
- `connection-adapters/abstract/schema-creation.ts` (9)
- `schema-dumper.ts` (9)
- `associations/collection-association.ts` (8)
- `relation/batches.ts` (8)

Known non-renames, to leave alone (carried from the parent story):

- Ruby `null` / `default` are JS reserved words; `null_` / `default_` stays.
- A kwargs-BUNDLE local (trails collects Rails' separate kwargs into one
  `options` object, so the rest-destructure cannot also be called `options`) —
  e.g. `schema_statements.rb:294`'s `validate_create_table_options!(options)`.
  That is an argument-shape artifact, not a naming one.
- A chained Ruby receiver (`table_name.to_s`) describes as the inner call and
  has no TS spelling.

## Acceptance criteria

1. Every local/parameter identifier in the files listed above is renamed to the
   Rails identifier, camelCased per `docs/ruby-ts-conventions.md`.
2. No public surface changes and no behavior changes; `pnpm parity:api:extra`
   and `pnpm parity:api` unchanged.
3. `naming` row count for the package drops by the rows converged; report
   before/after in the PR body.
4. Argument-ORDER defects and invented call-site conversions are filed, not
   renamed away.
5. Split further if the diff exceeds the LOC ceiling.
