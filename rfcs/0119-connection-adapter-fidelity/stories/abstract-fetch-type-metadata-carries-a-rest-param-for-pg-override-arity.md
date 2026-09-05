---
title: "abstract-fetch-type-metadata-carries-a-rest-param-for-pg-override-arity"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter#fetch_type_metadata` takes one argument
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1717`),
MySQL's override adds `extra` (`mysql/schema_statements.rb:221`), and
PostgreSQL's REPLACES the parameter list with
`(column_name, sql_type, oid, fmod)` (`postgresql/schema_statements.rb:995`).
Ruby does not check override arity; TypeScript does.

`pg-fetch-type-metadata-async-forces-a-union-on-the-abstract` removed the
`SqlTypeMetadata | Promise<SqlTypeMetadata>` union and all three
`as SqlTypeMetadata` narrowings by making `getOidType` synchronous, but could
not remove the other half of that declaration — the `..._rest: unknown[]` on
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`:

```ts
fetchTypeMetadata(sqlType: string | null, ..._rest: unknown[]): SqlTypeMetadata
```

Dropping it was tried on that branch and fails, on both the PG class member and
the merged interface:

```text
TS2416: Property 'fetchTypeMetadata' in type 'SchemaStatements' is not
assignable to the same property in base type 'SchemaStatements'.
  Target signature provides too few arguments. Expected 4 or more, but got 1.
```

An overload set does not resolve it either — that was established in the parent
story: TypeScript checks an override against the WHOLE overload list, and the
one arrangement that compiles makes `PostgreSQLAdapter` publish a 1-argument
signature its body never answers.

No JSDoc tag covers a widened parameter list: `@noRailsEquivalent` is for extra
surface, `@missingRailsCall` for an omitted call, `@missingRailsArgs` for a
call site's argument shape. So the residual has no receipt in the code, and its
register was the parent story, which is now closed. This story is its
successor.

## Acceptance criteria

- [ ] `abstract/schema-statements.ts`'s `fetchTypeMetadata` declares Rails'
      single-argument signature with no `...rest`, and the PG and MySQL
      overrides still type-check — or
- [ ] the deviation is established as a genuine TypeScript shortcoming with a
      sanctioned receipt shape, and that shape is applied here (which likely
      means a new tag, since none of the three existing ones fits an
      override-arity widening).
- [ ] No baseline row, no allowlist widening.
- [ ] `pnpm parity:api:params` and `pnpm parity:api:calls:args` stay green.
