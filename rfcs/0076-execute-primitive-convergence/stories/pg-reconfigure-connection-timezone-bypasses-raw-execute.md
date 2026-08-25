---
title: "PG reconfigure_connection_timezone bypasses raw_execute"
status: draft
updated: 2026-08-16
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# PG reconfigure_connection_timezone bypasses raw_execute

## Context

Rails (`connection_adapters/postgresql_adapter.rb:999-1014`):

```ruby
def reconfigure_connection_timezone
  variables = @config.fetch(:variables, {}).stringify_keys
  return if variables["timezone"]
  if default_timezone == :utc
    raw_execute("SET SESSION timezone TO 'UTC'", "SCHEMA")
  else
    raw_execute("SET SESSION timezone TO DEFAULT", "SCHEMA")
  end
end
```

trails (`postgresql-adapter.ts:4316+`) reads the frozen `_sessionVariables`
instead of `@config.fetch(:variables, {})`, and calls
`client.query(...)` on a handle from `_acquireFreshClient()` instead of
`rawExecute`. Two `kind: "set"` rows (`fetch`, `raw_execute`) in the exclude
shard after PR #6581.

The documented reason: this runs as the first step of `_performQuery`, which is
itself the block already executing inside `withRawConnection`, so re-entering
the leaf loop would redundantly re-run its verify / materialize /
dirtyCurrentTransaction bookkeeping. That is a consequence of trails'
non-re-entrant `withRawConnection`, the same root cause as
`pg-configure-connection-body-off-rails-method`.

## Converged shape

- Body reads `variables` from `@config` with Ruby `fetch` semantics and returns
  early on `variables["timezone"]` exactly as Rails does.
- Both arms go through `this.rawExecute(sql, "SCHEMA")`.
- Depends on the same `withRawConnection` re-entrancy work; land after (or with)
  `pg-configure-connection-body-off-rails-method`.
- Delete both rows from the exclude shard and tighten the mark.

## Acceptance criteria

- [ ] `reconfigure_connection_timezone` row count for `postgresql-adapter.ts` is 0.
- [ ] `pnpm parity:api:calls` green; no baseline widened.
- [ ] Timezone reconfiguration still applies mid-query without re-entering the
      leaf loop's bookkeeping twice (regression test that fails on a naive
      `rawExecute` swap).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
