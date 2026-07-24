---
title: "mysql dbconsole pushes config.database unconditionally (abstract_mysql_adapter.rb:80)"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced during the Ruby-truthiness audit (#5215). In `AbstractMysqlAdapter.dbconsole`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`, ~line 1347)
the database name is pushed under a bare JS guard:

```ts
if (config.database) args.push(config.database as string);
```

Rails pushes it **unconditionally** (`abstract_mysql_adapter.rb:80`):

```ruby
args << config.database
```

So a blank/empty-string database is dropped by the trails port but emitted by
Rails. This is a _missing-guard_ divergence, distinct from the Ruby-truthiness
guards fixed in #5215 (Rails has no guard here at all), which is why it was left
out of that PR's scope.

Note: `dbconsole`'s PTY exec is flagged Ruby-only in
`scripts/api-compare/unported-files.ts`; only the arg-builder is live (exercised
by `dbconsole-option-keys.test.ts`). The fix must still avoid pushing `undefined`
when `config.database` is genuinely absent (the TS arg type is a loose object,
unlike Rails' `DatabaseConfig#database`).

## Acceptance criteria

- `AbstractMysqlAdapter.dbconsole` appends `config.database` matching Rails'
  unconditional `args << config.database` (`abstract_mysql_adapter.rb:80`),
  including an empty-string database, without pushing a literal `undefined`.
- Regression test in `dbconsole-option-keys.test.ts` covering an empty-string
  database, verified to fail on the current bare-guard code.
