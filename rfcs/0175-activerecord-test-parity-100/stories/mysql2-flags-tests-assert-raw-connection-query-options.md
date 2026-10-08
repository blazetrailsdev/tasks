---
title: "activerecord: mysql flags connection tests assert raw_connection.query_options[:flags] as Rails does"
status: draft
updated: 2026-10-08
rfc: "0175-activerecord-test-parity-100"
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

## Context

Surfaced by trails#8683.

Rails' `test_passing_arbitrary_flags_to_adapter` and `test_passing_flags_by_array_to_adapter` (`vendor/rails/v8.0.2/activerecord/test/cases/adapters/abstract_mysql_adapter/connection_test.rb:145-157`) establish a connection with `flags:` merged into the config and assert on what the client was given: `ActiveRecord::Base.lease_connection.raw_connection.query_options[:flags]` equals `COMPRESS | FOUND_ROWS`, or `["COMPRESS", "FOUND_ROWS"]`.

The trails ports in `packages/activerecord/src/adapters/abstract-mysql-adapter/connection.test.ts` ("passing arbitrary flags to adapter", "passing flags by array to adapter") build a `Mysql2Adapter` directly and assert on its private `_config.flags` through a cast, never connecting. So they cover `Mysql2Adapter#initialize` (`mysql2_adapter.rb:59-65`) but not that the flags reach the client, which is what Rails asserts. `newClient` turns an Integer into flag names for the npm client; only a trails test (`connection-adapters/adapter-username-key.trails.test.ts`) pins that.

`Mysql2Client` (`packages/activerecord/src/connection-adapters/mysql2/mysql2-client.ts`) has no `queryOptions.flags` to read. Story `mysql2-perform-query-takes-rails-control-flow-over-a-gem-shaped-raw-connection` gives the client its gem shape; this either follows it or adds `queryOptions.flags` there.

## Acceptance criteria

- [ ] Both tests connect and assert on `rawConnection.queryOptions.flags`, with Rails' expected values (`0x20 | 0x02`, and `["COMPRESS", "FOUND_ROWS"]`).
- [ ] The `_config` cast is gone from both tests.
