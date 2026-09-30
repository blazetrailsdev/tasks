---
title: "activerecord: remove or credit the 49 invented branches in connection-adapters-postgresql part 2"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-connection-adapters-part-1"]
deps-rfc: []
est-loc: 374
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

- `connection-adapters/postgresql/schema-definitions.ts#definedFor` — `+if +if +if +if +loop +if +if`
- `connection-adapters/postgresql/schema-dumper.ts#extensions` — `+if`
- `connection-adapters/postgresql/schema-dumper.ts#types` — `+if`
- `connection-adapters/postgresql/schema-dumper.ts#schemas` — `+if`
- `connection-adapters/postgresql/schema-dumper.ts#exclusionConstraintsInCreate` — `+if +if`
- `connection-adapters/postgresql/schema-dumper.ts#uniqueConstraintsInCreate` — `+if +if`
- `connection-adapters/postgresql/schema-dumper.ts#prepareColumnOptions` — `+if`
- `connection-adapters/postgresql/schema-dumper.ts#schemaType` — `+if +if +if +if`
- `connection-adapters/postgresql/schema-statements.ts#dropTable` — `+if +if +loop`
- `connection-adapters/postgresql/schema-statements.ts#indexes` — `-loop +if`
- `connection-adapters/postgresql/schema-statements.ts#schemaSearchPath` — `+if`
- `connection-adapters/postgresql/schema-statements.ts#defaultSequenceName` — `+if +throw`
- `connection-adapters/postgresql/schema-statements.ts#foreignKeys` — `+loop`
- `connection-adapters/postgresql/schema-statements.ts#uniqueConstraints` — `+loop`
- `connection-adapters/postgresql/schema-statements.ts#exclusionConstraintOptions` — `+if`
- `connection-adapters/postgresql/schema-statements.ts#removeExclusionConstraint` — `+if +if`
- `connection-adapters/postgresql/schema-statements.ts#uniqueConstraintOptions` — `+if`
- `connection-adapters/postgresql/schema-statements.ts#removeUniqueConstraint` — `+if +if`
- `connection-adapters/postgresql/schema-statements.ts#validateCheckConstraint` — `+if`
- `connection-adapters/postgresql/schema-statements.ts#quotedIncludeColumnsForIndex` — `-loop +if +if`
- `connection-adapters/postgresql/schema-statements.ts#exclusionConstraintName` — `+if`
- `connection-adapters/postgresql/schema-statements.ts#exclusionConstraintForBang` — `+if`
- `connection-adapters/postgresql/schema-statements.ts#uniqueConstraintName` — `+if +if`
- `connection-adapters/postgresql/schema-statements.ts#uniqueConstraintForBang` — `+if +if +if +if`
- `connection-adapters/postgresql/schema-statements.ts#dataSourceSql` — `+if +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:returns
```
