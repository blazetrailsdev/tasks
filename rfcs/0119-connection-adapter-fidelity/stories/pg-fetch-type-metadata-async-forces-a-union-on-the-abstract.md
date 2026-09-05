---
title: "PG fetchTypeMetadata is async where Rails is sync, forcing a union return on the abstract and three super-site narrowings"
status: claimed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: "2026-09-05T21:46:49Z"
assignee: "commit-db-transaction-should-hold-its-own-internal-execute"
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter`'s `fetch_type_metadata`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1717`)
is synchronous and takes one argument. So are both overrides: MySQL's adds
`extra` (`connection_adapters/mysql/schema_statements.rb:221`) and PostgreSQL's
replaces the parameter list with `(column_name, sql_type, oid, fmod)`
(`connection_adapters/postgresql/schema_statements.rb:995`) — still returning a
`SqlTypeMetadata`, not a future.

trails' PG override is `async`, because `get_oid_type`
(`postgresql_adapter.rb:854`) became `async getOidType`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:566`):
`load_additional_types` (`postgresql_adapter.rb:856,867`) issues a query, which
Rails does synchronously and the port cannot.

PR #7481 moved both bodies onto their Rails file and had to widen the abstract
declaration to
`fetchTypeMetadata(sqlType: string | null, ..._rest: unknown[]): SqlTypeMetadata | Promise<SqlTypeMetadata>`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`)
so the async 4-argument override type-checks. The union is paid for at the three
sites that call the abstract body as Rails' `super`, each narrowing it back with
`as SqlTypeMetadata`:

- `connection-adapters/mysql/schema-statements.ts` — `fetchTypeMetadata`,
  Rails' bare `super(sql_type)` at `mysql/schema_statements.rb:222`
- `support/fake-adapter.ts`
- `connection-adapters/abstract/schema-statements-privates.trails.test.ts` (two)

Review flagged this twice on #7481. An overload set was tried and does not
resolve it: TypeScript checks an override against the WHOLE overload list, so a
4-argument async override still fails the 1-argument synchronous arm
(`TS2416: Target signature provides too few arguments. Expected 4 or more, but
got 1`), in either order and whether the overloads sit on the class or are
merged in from an interface. The one arrangement that compiles requires the PG
override to REPEAT the synchronous arm, which publishes on `PostgreSQLAdapter` a
1-argument signature its body never answers —
`pgAdapter.fetchTypeMetadata("varchar(255)")` then type-checks as
`SqlTypeMetadata` and returns a `Promise`. That is unsound, so it was rejected.

The union therefore has no receipt anywhere in the code: `no-freeform-comments`
deletes the prose that explained it, and none of `@noRailsEquivalent` /
`@missingRailsCall` / `@missingRailsArgs` covers a narrowed union return. This
story is the register entry.

## Converged shape

The union is a symptom, not the deviation. The deviation is that PG's
`fetchTypeMetadata` is async where Rails' is sync, and it is async only because
`getOidType` may load types mid-reflection. Converge by making `getOidType`
synchronous — the OIDs it needs are known before column reflection runs, so the
`load_additional_types` it triggers can be hoisted to where the port already
awaits (`reloadTypeMap` / `loadAdditionalTypes` at connection configure time,
which `pg-eager-load-additional-types-duplicates-the-rails-loader` also touches).

With `getOidType` synchronous:

- `postgresql/schema-statements.ts`'s `fetchTypeMetadata` returns `TypeMetadata`,
  matching `postgresql/schema_statements.rb:995-1005` line for line, and
  `newColumnFromField` (`rb:966`) drops its `await`.
- `abstract/schema-statements.ts`'s declaration goes back to Rails'
  `fetchTypeMetadata(sqlType: string | null): SqlTypeMetadata` — the `...rest`
  and the `Promise` arm both go.
- All three `as SqlTypeMetadata` narrowings are deleted.

## Acceptance criteria

- [ ] `abstract/schema-statements.ts`'s `fetchTypeMetadata` declares Rails'
      synchronous single-argument signature; no `...rest`, no `Promise` arm.
- [ ] No `as SqlTypeMetadata` at any `super`-emulating call site.
- [ ] `connection_adapters/postgresql/schema_statements.rb` stays 92/92 DeclOnly 0
      and `postgresql_adapter.rb` does not regress.
- [ ] No baseline row, no allowlist widening, no `@noRailsEquivalent` receipt.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:params`, `:extra:gate` green; PG
      lane green.
