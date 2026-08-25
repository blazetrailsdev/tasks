---
title: "PG get_database_version bypasses with_raw_connection"
status: draft
updated: 2026-08-16
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# PG get_database_version bypasses with_raw_connection

## Context

Rails (`connection_adapters/postgresql_adapter.rb:635-643`):

```ruby
def get_database_version # :nodoc:
  with_raw_connection do |conn|
    version = conn.server_version
    if version == 0
      raise ActiveRecord::ConnectionFailed, "Could not determine PostgreSQL version"
    end
    version
  end
end
```

trails (`postgresql-adapter.ts:3115+`) does
`const conn = this._rawConnection ?? (await this._acquireFreshClient())` and
hand-rolls the connection-error discard that `with_raw_connection` provides.
One `kind: "set"` row (`with_raw_connection`) in the exclude shard after
PR #6581.

Reason: Rails' `with_raw_connection` is re-entrant on `@raw_connection`
(`abstract_adapter.rb:985` — `connect! if @raw_connection.nil?`), so it runs on
the connection being configured; ours would await the very acquire this call is
nested inside, because `configure_connection` warms the pool's
`server_version` memo at connect time.

Same root cause as `pg-configure-connection-body-off-rails-method` and
`pg-reconfigure-connection-timezone-bypasses-raw-execute`: one non-re-entrant
`withRawConnection`.

## Converged shape

- Body is `return this.withRawConnection(async (conn) => { ... })` with the
  `version === 0` guard raising `ConnectionFailed` inside the block, and the
  error-discard bookkeeping left to `withRawConnection` rather than duplicated.
- Requires the re-entrancy fix; do not land standalone.
- Delete the row from the exclude shard and tighten the mark.

## Acceptance criteria

- [ ] `get_database_version` row count for `postgresql-adapter.ts` is 0.
- [ ] The hand-rolled `_isConnectionError` / `_discardRawConnection` arm is gone
      (it duplicates `with_raw_connection`'s own handling).
- [ ] `pnpm parity:api:calls` green; no baseline widened.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
