---
title: "pg-connection-type-map-for-results-defaults-to-all-strings"
status: done
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10467
claim: "2026-11-21T00:56:32Z"
assignee: "activerecord-root-imports-without-pg-is-pinned"
blocked-by: null
closed-reason: null
---

## Context

- `packages/pg/lib/connection.ts:37` defaults `typeMapForResults` to `new TypeMapByOid()`, so a bare `PG::Connection` decodes `SELECT 1` to the number `1`.
- The gem's `pgconn_s_allocate` seats `pg_typemap_all_strings` (`vendor/pg/v1.5.9/ext/pg_connection.c:262`), so `getvalue` answers `"1"` until the application assigns a map (Rails' `add_pg_decoders`, `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1112-1151`).
- Found in trails#10443's review. The block-form test there was switched to a text column so that it does not depend on the default map.

## Acceptance criteria

- [ ] A new `PG::Connection`'s `typeMapForResults` is the gem's `TypeMapAllStrings` equivalent, and `getvalue` answers Strings until a map is assigned.
- [ ] Callers that rely on the current decoding (the PostgreSQL adapter, the pg package tests) assign their map explicitly, as Rails does.
