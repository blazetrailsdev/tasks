---
title: "SchemaCreation#useForeignKeys should delegate to the connection predicate, not recompute it"
status: done
updated: 2026-08-08
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6258
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5542 landed `SchemaCreation#useForeignKeys()` on the abstract visitor
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:194`)
as a reimplementation of Rails' formula:

```ts
const supports = host.supportsForeignKeys?.() ?? true;
return supports && host._config?.foreignKeys !== false;
```

Review feedback on that PR (correctly) objected: Rails' `SchemaCreation`
_delegates_ `use_foreign_keys?` straight to `@conn`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:16-20`),
and the connection owns the predicate as
`supports_foreign_keys? && foreign_keys_enabled?`
(`abstract/schema_statements.rb:1545-1547`). trails already has that predicate
as `SchemaStatements#isUseForeignKeys()`
(`connection-adapters/abstract/schema-statements.ts:2075`), built on
`isForeignKeysEnabled()` (`:2500`). Duplicating the formula in the visitor can
miss an adapter override or future predicate behavior Rails would route through
the connection.

`MySQL::SchemaCreation#useForeignKeys` (`mysql/schema-creation.ts:206`) carries a
second copy of the same formula, reading `_hostAdapter._config` — it needs the
same treatment, but cannot simply inherit the base: its `this.adapter` is the
`mysqlSchemaQuoter(host)` wrapper, not the adapter, so it must delegate through
`_hostAdapter`.

The fix was written and verified locally but the PR merged before it was pushed,
so it is NOT in `main`. The working change was:

- both visitors call `isUseForeignKeys()` on the adapter when present, else on
  `adapter.schemaStatements()`, else default `true` (host-less unit-test path);
- `mysql/schema-creation.test.ts:269` ("skips FK emission when host adapter has
  foreignKeys disabled") stubs a bare `{ supportsForeignKeys, _config }` host, so
  it needs `isUseForeignKeys: () => false` added to the stub — the
  config-to-predicate mapping is already covered by the `isForeignKeysEnabled`
  cases in `abstract/schema-statements-on-adapter.test.ts:392-406`.

Verified green locally on SQLite, PostgreSQL and MySQL 8 (including
`migration/foreign-key.test.ts` and the full `connection-adapters/mysql/` and
`connection-adapters/abstract/` suites).

## Acceptance criteria

- [ ] `SchemaCreation#useForeignKeys` in `abstract/schema-creation.ts` delegates
      to the connection's `isUseForeignKeys()` rather than recomputing
      `supportsForeignKeys && _config.foreignKeys !== false`.
- [ ] `MySQL::SchemaCreation#useForeignKeys` delegates the same way through
      `_hostAdapter`; no copy of the formula remains in either visitor.
- [ ] `migration/foreign-key.test.ts` "does not create foreign keys when bypassed
      by config" still passes, and still fails if the delegation is removed.
- [ ] Green on all three adapters.
