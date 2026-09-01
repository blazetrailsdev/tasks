---
title: "abstract type_to_sql raises on blank type and array where Rails ignores both"
status: draft
updated: 2026-09-01
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#type_to_sql`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`)
carries two raises Rails does not have:

- `throw new Error("Column has an empty or blank type — specify a valid SQL type")`
  for a blank type string.
- `throw new Error("Array columns are only supported on PostgreSQL")` when
  `options.array` is set and the type is not `primary_key`.

Rails' body at
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1385-1417`
has neither. An unmapped type falls through to `type.to_s` (`:1415`), and
`array:` is absorbed by the signature's `**` and silently ignored — which is
precisely how `PostgreSQL::SchemaStatements#type_to_sql`'s bare `super`
(`postgresql/schema_statements.rb:859`) can forward its own `array:` kwarg
without exploding.

The array guard already forced a deviation in PR #7327: PG's `default:` arm
must call `super.typeToSql(type, { limit, precision, scale })` rather than
forwarding `options`, because forwarding would hit a guard Ruby does not
have. Removing the guard lets that call site forward the options object as
Ruby's `super` does.

## Converged shape

Delete both raises. `native === undefined` renders `String(type)`
(`:1415`); `options.array` is ignored by the base and honoured only by the
PG override's `[]` suffix (`:862`). Then simplify PG's `default:` arm back
to forwarding `options`.

Two trails-only tests pin the removed behaviour and retire with it:
`SchemaCreation#typeToSql blank type guard` in
`connection-adapters/abstract/schema-creation.trails.test.ts` and the
blank-type cases in
`connection-adapters/abstract/schema-definitions.trails.test.ts`.

## Acceptance criteria

- [ ] Neither raise remains in `SchemaStatements#type_to_sql`.
- [ ] PG's `default:` arm forwards `options` to `super`.
- [ ] The four AR adapter lanes stay green.
- [ ] `pnpm parity:api:extra --package activerecord` novel count does not rise.
