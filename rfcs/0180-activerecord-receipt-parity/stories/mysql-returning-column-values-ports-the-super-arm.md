---
title: "activerecord: MySQL returning_column_values ports the super arm"
status: done
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8485
claim: "2026-10-07T23:34:20Z"
assignee: "connection-handler-pool-manager-map-onto-concurrent-map"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit (trails#8390), next to the
`first` receipt it converged.

`MySQL::DatabaseStatements#returning_column_values`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/database_statements.rb:58-64`):

```ruby
def returning_column_values(result)
  if supports_insert_returning?
    result.rows.first
  else
    super
  end
end
```

`super` is `DatabaseStatements#returning_column_values`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:723-725`),
`[last_inserted_id(result)]`, and `last_inserted_id` is itself overridden per driver
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:23-29`
answers `@raw_connection&.last_id` when the server has no `RETURNING`).

`packages/activerecord/src/connection-adapters/mysql/database-statements.ts` `returningColumnValues`
has no `super` arm: it returns `undefined` when `supportsInsertReturning()` is false. The abstract port
(`connection-adapters/abstract/database-statements.ts` `returningColumnValues`) is
`[singleValueFromRows(result.rows)]`, which inlines the abstract `last_inserted_id` rather than
dispatching to the adapter's, so calling it from the MySQL body would not reach the mysql2 override
either. The function is also typed `this: SupportsInsertReturningHost | void` and reads the host through
`?.`, where Rails calls `supports_insert_returning?` on `self` unguarded.

Not fixed in the audit PR: the arm only runs on a MySQL server without `RETURNING`, and there was no
MySQL to run it against.

## Acceptance criteria

- [ ] `returningColumnValues` has Rails' two arms, and the `else` arm reaches the abstract body.
- [ ] The abstract body is `[this.lastInsertedId(result)]`, dispatching to the adapter's override.
- [ ] The `| void` host type and the `?.` guards are gone.
- [ ] `pnpm parity:api:calls` green with no new row; the MySQL and MariaDB insert tests pass on their lanes.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
