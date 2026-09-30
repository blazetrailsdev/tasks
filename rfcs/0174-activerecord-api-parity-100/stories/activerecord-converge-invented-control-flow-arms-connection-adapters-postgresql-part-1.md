---
title: "activerecord: remove or credit the 80 invented branches in connection-adapters-postgresql part 1"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-connection-adapters-part-1"]
deps-rfc: []
est-loc: 560
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=invented` — branches the TS body takes
that Rails' does not. RFC 0113 measured the `if` token ~70% non-real at repo scale (type narrowing,
`?.`, argument normalisation), so each row is either a real invented guard to delete (CLAUDE.md
§ "No extra abstraction", § "Control flow") or an extractor false positive to fix with a test:

- `connection-adapters/postgresql/column.ts#sqlType` — `+if`
- `connection-adapters/postgresql/database-statements.ts#isWriteQuery` — `+if +throw`
- `connection-adapters/postgresql/database-statements.ts#execInsert` — `+if +if`
- `connection-adapters/postgresql/database-statements.ts#beginDbTransaction` — `+try +rescue +if +throw`
- `connection-adapters/postgresql/database-statements.ts#beginIsolatedDbTransaction` — `+try +rescue +if +throw`
- `connection-adapters/postgresql/database-statements.ts#commitDbTransaction` — `+try +rescue +if +throw`
- `connection-adapters/postgresql/database-statements.ts#execRollbackDbTransaction` — `+try`
- `connection-adapters/postgresql/database-statements.ts#buildExplainClause` — `+if`
- `connection-adapters/postgresql/database-statements.ts#performQuery` — `+loop +if +if`
- `connection-adapters/postgresql/oid/array.ts#deserialize` — `+if`
- `connection-adapters/postgresql/oid/array.ts#cast` — `+if +throw`
- `connection-adapters/postgresql/oid/array.ts#typeCastArray` — `+if +if`
- `connection-adapters/postgresql/oid/bit.ts#castValue` — `+if`
- `connection-adapters/postgresql/oid/bit.ts#serialize` — `+if +if`
- `connection-adapters/postgresql/oid/bytea.ts#deserialize` — `+if`
- `connection-adapters/postgresql/oid/cidr.ts#castValue` — `+throw`
- `connection-adapters/postgresql/oid/date-time.ts#castValue` — `+if +if`
- `connection-adapters/postgresql/oid/date.ts#castValue` — `+if +if`
- `connection-adapters/postgresql/oid/hstore.ts#deserialize` — `+if`
- `connection-adapters/postgresql/oid/hstore.ts#serialize` — `+if`
- `connection-adapters/postgresql/oid/hstore.ts#isChangedInPlace` — `+if +if`
- `connection-adapters/postgresql/oid/interval.ts#castValue` — `+if +if`
- `connection-adapters/postgresql/oid/interval.ts#serialize` — `+if +if`
- `connection-adapters/postgresql/oid/interval.ts#typeCastForSchema` — `+if`
- `connection-adapters/postgresql/oid/legacy-point.ts#numberForPoint` — `+if`
- `connection-adapters/postgresql/oid/macaddr.ts#isChanged` — `+if +if`
- `connection-adapters/postgresql/oid/macaddr.ts#isChangedInPlace` — `+if +if`
- `connection-adapters/postgresql/oid/money.ts#castValue` — `+if`
- `connection-adapters/postgresql/oid/point.ts#cast` — `+throw +if`
- `connection-adapters/postgresql/oid/point.ts#serialize` — `+throw +if`
- `connection-adapters/postgresql/oid/point.ts#numberForPoint` — `+if`
- `connection-adapters/postgresql/oid/range.ts#extractBounds` — `+if +if`
- `connection-adapters/postgresql/oid/range.ts#isInfinity` — `+if`
- `connection-adapters/postgresql/oid/type-map-initializer.ts#run` — `+loop`
- `connection-adapters/postgresql/oid/xml.ts#serialize` — `+if +if`
- `connection-adapters/postgresql/quoting.ts#unescapeBytea` — `+loop +if +if +if +if`
- `connection-adapters/postgresql/quoting.ts#checkIntInRange` — `+if`
- `connection-adapters/postgresql/quoting.ts#quote` — `+if`
- `connection-adapters/postgresql/quoting.ts#typeCast` — `+if`
- `connection-adapters/postgresql/quoting.ts#lookupCastTypeFromColumn` — `+throw`
- `connection-adapters/postgresql/quoting.ts#quoteColumnName` — `+if`
- `connection-adapters/postgresql/quoting.ts#quoteTableName` — `+if`
- `connection-adapters/postgresql/referential-integrity.ts#disableReferentialIntegrity` — `+throw +if +throw`
- `connection-adapters/postgresql/schema-creation.ts#visitAlterTable` — `+loop +loop`
- `connection-adapters/postgresql/schema-creation.ts#visitExclusionConstraintDefinition` — `+if`
- `connection-adapters/postgresql/schema-creation.ts#addColumnOptionsBang` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
