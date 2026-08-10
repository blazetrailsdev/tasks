---
title: "PG overrides widen the abstract schema-statement signatures they override"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6170
claim: "2026-08-07T12:48:31Z"
assignee: "database-tasks-config-is-a-second-store-beside-base-configurations"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working `pg-schema-statements-abstract-signature-divergences`
(PR #6164), which enumerated every member whose PG signature will not merge with
the one `AbstractSchemaStatements` inherits. Most of the 34 are legal narrowing
(`adapterName` returning `AdapterName`, `buildStatementPool` taking
`pg.Client`), but a subset is the reverse — the PG override is _looser_ than the
abstract it overrides, having been typed `string` / `Record<string, unknown>` /
`Promise<unknown>` where the base carries the real types. Those are real
divergences: the PG body then works on untyped bags where the abstract body has
`ColumnType` / `ColumnOptions`, and the looseness hides mismatches inside the
override.

Confirmed instances:

- `postgresql-adapter.ts:4352` `addColumnForAlter(tableName, columnName, type: string,
options: Record<string, unknown> = {}): Promise<unknown>` vs
  `abstract/schema-statements.ts:2392` `(…, type: ColumnType, options: ColumnOptions = {}):
Promise<string>`. Rails: `postgresql_adapter.rb`'s `add_column_for_alter`
  against `abstract/schema_statements.rb`'s — plain overrides, same arity, no
  widening.
- `postgresql-adapter.ts:4234` `addIndexOptions(tableName, columnName,
options: Record<string, unknown> = {})` vs `abstract/schema-statements.ts:1780`,
  which spells the option keys out.

The rest of the 34-name list is in PR #6164's description; walk it and separate
"PG narrows (fine)" from "PG widens (bug)" before starting.

## Converged shape

Tighten each _widened_ PG override to the abstract signature it overrides —
same parameter types, same defaults, same return type — and fix whatever the
body was relying on the looseness for. Do not touch the narrowing overrides;
those are correct and the `Pick` in
`postgresql/schema-statements-class.ts` already routes around them.

Every name that converges can also come off nothing — the merged interface uses
`Pick`, not `Omit`, so there is no allowlist to shrink; the win is that the PG
body stops handling untyped bags.

## Acceptance criteria

- [ ] `addColumnForAlter` and `addIndexOptions` on `PostgreSQLAdapter` carry the
      abstract signatures.
- [ ] The remaining widened overrides from PR #6164's 34-name list are converged
      or, where the divergence is genuine narrowing, left alone with no register
      entry needed.
- [ ] `pnpm typecheck`, `parity:api` / `parity:api:extra` deltas non-negative, PG lane
      green.
