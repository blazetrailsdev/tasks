---
title: "activerecord: PostgreSQL::SchemaDumper reads @connection without an any-typed accessor and existence guards"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8390 (the `ca-drivers` receipt audit), which converged the `any?` guards in these
bodies and left the reads in front of them alone.

`PostgreSQL::SchemaDumper` reads its connection directly
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_dumper.rb`):
`@connection.extensions` (`:9`), `@connection.enum_types` (`:20`), `@connection.schema_names` (`:32`),
`@connection.exclusion_constraints(table)` (`:43`), `@connection.unique_constraints(table)` (`:65`).

`packages/activerecord/src/connection-adapters/postgresql/schema-dumper.ts` goes through a private
`pgAdapter(): any` and guards every read on the method existing: `if (!adapter?.extensions) return`,
`adapter?.exclusionConstraints ? await adapter.exclusionConstraints(table) : []`, and the same in
`types`, `schemas`, `uniqueConstraintsInCreate` and `tableOptions`. Rails has no such guards and no
accessor; a PostgreSQL dumper is only built for a PostgreSQL connection
(`postgresql/schema_statements.rb` `create_schema_dumper`). The `any` also turns every one of those reads
off for the type checker.

## Acceptance criteria

- [ ] The bodies read the connection the way the abstract dumper's ported bodies do, typed as the
      PostgreSQL adapter, with no `any` and no method-existence guards.
- [ ] `pgAdapter` is deleted.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:extra:gate` green; the PostgreSQL schema-dumper tests
      pass on the PostgreSQL lane.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/postgresql/schema-dumper.trails.test.ts
```
