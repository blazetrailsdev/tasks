---
title: "SQLite3 configure_connection swallows pragma failures Rails lets raise"
status: draft
updated: 2026-09-10
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter#configure_connection` applies each pragma with no rescue
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:837-844`):

```ruby
DEFAULT_PRAGMAS.merge(pragmas).each do |pragma, value|
  if ::SQLite3::Pragmas.method_defined?("#{pragma}=")
    @raw_connection.public_send("#{pragma}=", value)
  else
    warn "Unknown SQLite pragma: #{pragma}"
  end
end
```

A pragma that fails to apply therefore raises out of `configure_connection` and
aborts the connection. trails instead wraps every statement in a try/catch and
downgrades the failure to a `console.warn`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, the `warn`
closure and both the sync and async `for (const [sql, label] of stmts)` loops at
the tail of `configureConnection`).

The result is that a connection whose pragmas did not take is reported as
healthy. `foreign_keys` is the sharp case: if it silently fails, referential
integrity is off for the life of that connection and nothing surfaces it.

This predates PR #7656 — that PR converged which pragmas are applied and how
their values are rendered, but deliberately left the surrounding execution
machinery alone as out of scope.

## Converged shape

Drop the try/catch and the `warn` closure; let a pragma failure propagate out of
`configureConnection` as Rails' does. The `stmts` array and its dual sync/async
tail exist because a trails driver may be async — that part stays — but neither
arm should swallow.

Note the one legitimate warning Rails does emit is the _unknown pragma_ case,
which trails already matches verbatim (`Unknown SQLite pragma: <name>`); this
story is only about failures raised by the driver when applying a known pragma.

## Acceptance criteria

- [ ] A pragma the driver rejects raises out of `configureConnection` rather
      than warning, on both the sync and async driver paths.
- [ ] `Unknown SQLite pragma: <name>` still warns and skips, per
      `sqlite3_adapter.rb:842`.
- [ ] A regression test fails on the pre-change baseline.
