---
title: "pg-adapter-disconnect-keeps-timestamp-decoder-as-rails"
status: draft
updated: 2026-11-21
rfc: "0186-pg-gem-port"
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

- Rails' `PostgreSQLAdapter#disconnect!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:386-392`) closes the raw connection and sets it to `nil`. It leaves `@timestamp_decoder` and `@mapped_default_timezone` alone.
- When the adapter later runs `reconnect!`, `connect` builds a fresh raw connection whose `type_map_for_results` is `TypeMapAllStrings`. `configure_connection`'s first query runs `perform_query`, which calls `update_typemap_for_default_timezone` (`postgresql/database_statements.rb:136`; `postgresql_adapter.rb:1093-1100`). If the default timezone changed in between, that method calls `add_coder` on the all-strings map before `add_pg_decoders` has run.
- trails reaches this in `BasicsTest > connection in utc time` (trails#10467). trails#10467 therefore clears both fields in `PostgreSQLAdapter#connect` (`packages/activerecord/lib/connection-adapters/postgresql-adapter.ts`; Rails' `connect` is `postgresql_adapter.rb:930-936`), right after `newClient`. That covers `disconnectBang`, `discardBang` and `reconnect`'s `ConnectionBad` arm.
- Open question: why does trails reconnect a disconnected adapter here at all? In Rails, `establish_connection` builds a new pool, and the new pool builds a new adapter.

## Acceptance criteria

- [ ] Find which caller reconnects the stale adapter in `connection in utc time`, and converge it to Rails' pool and adapter lifecycle.
- [ ] Remove the two field resets from `connect`, so that `connect` is Rails' `postgresql_adapter.rb:930-936` again,, and the test still passes on the PG lane.
