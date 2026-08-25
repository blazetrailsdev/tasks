---
title: "SchemaCreation#useForeignKeys reimplements a delegated predicate instead of asking the connection"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6258
claim: "2026-08-08T18:44:42Z"
assignee: "mysql-half-of-connection-handler-is-connected-flake"
blocked-by: null
closed-reason: null
---

## Context

`SchemaCreation`'s `use_foreign_keys?` is one of the `delegate ... to: :@conn`
members — `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:16-21`
lists it alongside `quote_column_name`, `type_to_sql`, `options_include_default?`
and the supports\_\* predicates. The connection answers it:
`AbstractAdapter#use_foreign_keys?` is `supports_foreign_keys? &&
foreign_keys_enabled?` (`abstract_adapter.rb`), and `foreign_keys_enabled?`
reads the connection's own config.

trails' `useForeignKeys` (`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts`,
the `/** @internal */ protected useForeignKeys()` body) does not delegate — it
casts `this.adapter` to a structural shape and re-derives the answer inline:

```ts
const host = this.adapter as unknown as {
  supportsForeignKeys?: () => boolean;
  _config?: { foreignKeys?: boolean };
};
const supports = host.supportsForeignKeys?.() ?? true;
return supports && host._config?.foreignKeys !== false;
```

Two problems: the `?? true` optional-call arm invents a default Rails has no
counterpart for, and reading `_config.foreignKeys` inline duplicates
`foreign_keys_enabled?` in the visitor instead of asking the connection.

Surfaced while converging the neighbouring predicates in PR #6247, which made
the other members of that same `delegate` line delegate for real; `useForeignKeys`
was left as the one inline reimplementation on the line.

## Converged shape

`useForeignKeys()` delegates: `return this.adapter.useForeignKeys()`, with
`useForeignKeys` added to `SchemaCreationConn` (schema-creation.ts) next to the
other delegated probes. `AbstractAdapter` supplies the
`supportsForeignKeys() && foreignKeysEnabled()` body, where Rails puts it — port
that pair if the adapter side is missing it. The structural cast and the
`?? true` fallback both go.

Check the same construction sites PR #6247 touched: the three mock adapters in
`schema-statements-privates.test.ts`, `schema-cache.test.ts` and
`postgresql/schema-definitions.test.ts` will each need the new member (the PG
one is `describeIfPostgresqlAdapter`-gated, so it is skipped on a local sqlite
run and only reds on the PG lane).

## Acceptance criteria

- [ ] `SchemaCreation#useForeignKeys` delegates to the connection; no
      structural cast, no `?? true`, no inline `_config.foreignKeys` read.
- [ ] The connection's `useForeignKeys` is `supportsForeignKeys() &&
foreignKeysEnabled()`, matching `abstract_adapter.rb`.
- [ ] Green on sqlite (file lane), `sqlite3_mem`, PG and MariaDB.
