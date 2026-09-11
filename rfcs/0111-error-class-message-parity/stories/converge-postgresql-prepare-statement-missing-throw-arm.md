---
title: "converge-postgresql-prepare-statement-missing-throw-arm"
status: draft
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
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

Split from `converge-the-three-remaining-adapter-tree-missing-throw-arms`, which
converged the mysql2 `performQuery` and sqlite3 constructor rows. One row stays
at its mark in `scripts/api-compare/arm-throw-mark.json`:
`connection-adapters/postgresql-adapter.ts#prepareStatement`.

Rails `activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:920-934`:

```ruby
def prepare_statement(sql, binds, conn)
  sql_key = sql_key(sql)
  unless @statements.key? sql_key
    nextkey = @statements.next_key
    begin
      conn.prepare nextkey, sql
    rescue => e
      raise translate_exception_class(e, sql, binds)
    end
    conn.get_last_result
    @statements[sql_key] = nextkey
  end
  @statements[sql_key]
end
```

trails' `prepareStatement` only allocates the key; node-pg (8.20) has no
public prepare-only call. It sends Parse lazily inside `client.query({ name,
text, values })`, and tracks parsed names in `connection.parsedStatements`
(`pg/lib/client.js:478`, `pg/lib/query.js:156,186`). Converging needs an
explicit Parse+Sync. The candidate is a node-pg Submittable (an object with
`submit(connection)`, the public extension point pg-cursor uses) that sends
`connection.parse({ name, text })` + `sync()`, rejects on `errorMessage` so the
body can `throw this.translateExceptionClass(e, sql, binds)`, and records
`connection.parsedStatements[name] = text` so the later named query skips a
second Parse.

## Acceptance criteria

- [ ] `prepareStatement` issues the Parse itself and raises
      `translateExceptionClass(e, sql, binds)` at Rails' site; the
      `@missingRailsCall translate_exception_class` tag is removed.
- [ ] The `postgresql-adapter.ts` arm-throw row is retired with
      `pnpm parity:api:arms:throws:tighten`.
- [ ] A test that fails on baseline: a bad prepare raises StatementInvalid
      from `prepareStatement` and leaves no `@statements` entry (Rails
      `test_raise_wrapped_exception_on_bad_prepare`, `postgresql/schema_test.rb:204`).
