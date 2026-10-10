---
title: "activerecord: Mysql2Adapter verify! seats an unconfigured raw connection without query_options"
status: done
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8744
claim: "2026-10-10T03:09:39Z"
assignee: "mysql2-client-scores-against-the-vendored-mysql2-gem"
blocked-by: null
closed-reason: null
---

## Context

Found by reading, not by running: verify it first.

`AbstractAdapter#verify!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:770-786`)
seats a connection handed to the constructor with `@raw_connection = @unconfigured_connection`, then
calls `attempt_configure_connection`. For Mysql2 that connection is a `Mysql2::Client`, which has
`query_options`, so `configure_connection`
(`connection_adapters/mysql2_adapter.rb:158-162`) can write `query_options[:as]` and
`[:database_timezone]`.

In trails, `verifyBang` (`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, the
`_unconfiguredConnection` arm) assigns `this._connection = this._unconfiguredConnection` directly. On
`Mysql2Adapter` that bypasses the `_rawConnection` setter (`mysql2-adapter.ts`), which is the only place
the npm client is wrapped by `mysql2Client` (`connection-adapters/mysql2/mysql2-client.ts`) and given
`queryOptions` / `automaticClose`. So a Mysql2Adapter built from a raw `mysql.Connection` (the deprecated
constructor form, `_acceptDeprecatedRawConnection`) reaches
`this._rawConnection!.queryOptions.as = "array"` with `queryOptions` undefined, which is a `TypeError`;
`attemptConfigureConnection` then disconnects. The same dereference was there before trails#8714.

## Acceptance criteria

- [ ] A trails test builds a `Mysql2Adapter` from a raw connection, calls `verifyBang`, and shows whether `configureConnection` raises.
- [ ] If it does, the unconfigured connection is seated through the same path that wraps a connected client, so `verify!` is Rails' `@raw_connection = @unconfigured_connection` with a usable `query_options`.
- [ ] No new guard is added to `configureConnection` (`mysql2_adapter.rb:158-162` has none).
