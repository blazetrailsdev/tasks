---
title: "establish-connection-in-initializer-stays-lazy"
status: draft
updated: 2026-11-23
rfc: "0248-trailties-parity-100"
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

`vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb:4535-4584` ("adds a time zone aware type if using PostgreSQL",
"doesn't add a time zone aware type if using MySQL", "can opt out of extra time zone aware types if using PostgreSQL")
call `ActiveRecord::Base.establish_connection(adapter: "postgresql")` in an initializer and boot in production with no server.
Rails' establish_connection is lazy; in trails booting `app("production")` with that initializer raises a
`DatabaseConnectionError` (unhandled rejection from the connection pool, hostname error) — something on the boot path
(`packages/trailties/lib/trailties/active-record.ts` ~line 342 `initializeDatabase`) opens a connection.

## Acceptance criteria

- Booting with an unconnectable postgresql/mysql2 `establishConnection` in an initializer does not connect, as in Rails.
- The three tests ported into `packages/trailties/test/application/configuration.test.ts` and pass.
