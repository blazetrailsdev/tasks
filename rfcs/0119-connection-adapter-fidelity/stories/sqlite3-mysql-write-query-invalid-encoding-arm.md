---
title: "sqlite3-mysql-write-query-invalid-encoding-arm"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7565
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `write_query?` carries an invalid-encoding fallback arm in every adapter
that defines it:

```ruby
def write_query?(sql) # :nodoc:
  !READ_QUERY.match?(sql)
rescue ArgumentError # Invalid encoding
  !READ_QUERY.match?(sql.b)
end
```

- `activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:12-16`
- `activerecord/lib/active_record/connection_adapters/mysql/database_statements.rb:17-21`

trails' ports drop the `rescue` arm entirely:

- `packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`
  (`isWriteQuery` — `return !READ_QUERY.test(sql);`)
- `packages/activerecord/src/connection-adapters/mysql/database-statements.ts`
  (same shape)

The PostgreSQL twin of this gap is already tracked as
`postgresql-write-query-invalid-encoding-arm` (same RFC); this story is the
sqlite3 + mysql half. Surfaced in review of #7563, which converged both files
onto `AbstractAdapter.buildReadQueryRegexp` but deliberately left the arm alone
as out of scope.

`RegExp.prototype.test` does not throw on any JS string, so there is no direct
analogue of Ruby's `ArgumentError`. Resolve it the same way
`postgresql-write-query-invalid-encoding-arm` resolves — either port a faithful
equivalent or record a `@noRailsEquivalent` / `@missingRailsCall` receipt at
each call site — so the three adapters agree.

## Acceptance criteria

- sqlite3 and mysql `isWriteQuery` either port Rails' fallback arm or carry a
  receipt at the call site citing the Rails `file:line` above.
- The resolution matches whatever `postgresql-write-query-invalid-encoding-arm`
  lands, so all three adapters read the same.
- `pnpm parity:api:calls` / `:args` show no new rows; the three AR adapter lanes
  stay green.
