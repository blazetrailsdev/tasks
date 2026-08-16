---
title: "PG prepare_statement does not translate the Parse error"
status: draft
updated: 2026-08-16
rfc: "0076-execute-primitive-convergence"
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

# PG prepare_statement does not translate the Parse error

## Context

Rails (`connection_adapters/postgresql_adapter.rb:920-933`):

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

trails (`postgresql-adapter.ts:4295+`) allocates the name and returns; node-pg
has no parse-only call (its `{ name, text }` form Parses under the name and
Executes in one roundtrip), so there is no `conn.prepare` site to wrap and
`translate_exception_class` is never called — one `kind: "set"` row in the
exclude shard after PR #6581.

This is a genuine driver-shape difference, not a preference — but the
_consequence_ is untested: a Parse failure (syntax error, unknown column) now
surfaces from `_performQuery`'s translation on first Execute instead of from
`prepare_statement`, and nothing pins that the resulting error class and message
match what Rails raises from the prepare site. The `binds` argument, which Rails
passes to `translate_exception_class`, is also unused in our signature.

## Converged shape

- Either route the first Execute's Parse failure through
  `translateExceptionClass(e, sql, binds)` at the point the statement name is
  consumed — keeping `binds` meaningful — or, if that must stay in
  `_performQuery`, prove equivalence with a test asserting the same error class
  and message Rails raises for a bad prepared statement.
- If the row survives, its exclude-shard reason must cite the covering test
  rather than only the driver difference.

## Acceptance criteria

- [ ] A failing PREPARE (syntax error; unknown column) raises the same
      ActiveRecord error class and message as Rails, asserted by test.
- [ ] `binds` is either used or removed from the signature with a cite.
- [ ] `pnpm parity:api:calls` green; row deleted, or its reason cites the test.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
