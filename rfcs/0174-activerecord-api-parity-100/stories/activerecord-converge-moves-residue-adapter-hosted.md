---
title: "activerecord: burn parity:api:moves' adapter-hosted relocations (318 methods) to zero"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps: ["moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:moves` reports **947** activerecord methods "matched via include chain but living in the
wrong file" (`scripts/api-compare/moves.ts`). Most are module members reported against an including
host — e.g. `relation/query-methods.ts → relation.ts (125)` is `QueryMethods` correctly living in
`query-methods.ts` — which is the measurement fault
`moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced` (RFC 0127) fixes; RFC 0127's
`gate-the-wrong-file-moves-population` then ratchets it. This story owns the adapter-hosted pairs (318 methods):

- `connection-adapters/abstract/schema-statements.ts` → `connection-adapters/abstract-adapter.ts` (84)
- `connection-adapters/postgresql/schema-statements.ts` → `connection-adapters/postgresql-adapter.ts` (73)
- `connection-adapters/abstract/database-statements.ts` → `connection-adapters/abstract-adapter.ts` (68)
- `connection-adapters/postgresql-adapter.ts` → `connection-adapters/postgresql/schema-statements.ts` (17)
- `connection-adapters/mysql/schema-statements.ts` → `connection-adapters/abstract-mysql-adapter.ts` (14)
- `connection-adapters/postgresql/database-statements.ts` → `connection-adapters/postgresql-adapter.ts` (13)
- `connection-adapters/sqlite3/database-statements.ts` → `connection-adapters/sqlite3-adapter.ts` (11)
- `connection-adapters/postgresql/quoting.ts` → `connection-adapters/postgresql-adapter.ts` (9)
- `connection-adapters/abstract/database-limits.ts` → `connection-adapters/abstract-adapter.ts` (5)
- `connection-adapters/abstract/query-cache.ts` → `connection-adapters/abstract-adapter.ts` (5)
- `connection-adapters/abstract/savepoints.ts` → `connection-adapters/abstract-adapter.ts` (4)
- `connection-adapters/mysql/database-statements.ts` → `connection-adapters/abstract-mysql-adapter.ts` (3)
- `connection-adapters/sqlite3/schema-statements.ts` → `connection-adapters/sqlite3-adapter.ts` (3)
- `migration/join-table.ts` → `connection-adapters/abstract/schema-statements.ts` (2)
- `connection-adapters/abstract-mysql-adapter.ts` → `connection-adapters/mysql/schema-statements.ts` (2)
- `connection-adapters/sqlite3-adapter.ts` → `connection-adapters/sqlite3/schema-statements.ts` (2)
- `connection-adapters/abstract-adapter.ts` → `connection-adapters/abstract/database-statements.ts` (1)
- `connection-adapters/column.ts` → `connection-adapters/deduplicable.ts` (1)
- `connection-adapters/mysql2/database-statements.ts` → `connection-adapters/mysql2-adapter.ts` (1)

## Acceptance criteria

- [ ] After the RFC 0127 fix, every row in these pairs that `pnpm parity:api:moves` still reports is relocated to the file mirroring its defining `.rb`, or split into its own story when a pair exceeds this story.
- [ ] `pnpm parity:api:moves` reports 0 activerecord rows for these pairs.

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
