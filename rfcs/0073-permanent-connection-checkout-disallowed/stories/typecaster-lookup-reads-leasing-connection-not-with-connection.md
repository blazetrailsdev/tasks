---
title: "TypeCaster::Connection lookup reads the leasing connection reader, not with_connection"
status: closed
updated: 2026-09-16
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "sync/async boundary"
---

## Context

`TypeCaster::Connection#typeForAttribute`
(`packages/activerecord/src/type-caster/connection.ts:19-27`) peeks the schema
cache and then reads `this._klass?.connection` — the `connection` reader
(`connection-handling.ts:332`), which is a lease and trips
`permanent_connection_checkout = :disallowed`.

Rails (`activerecord/lib/active_record/type_caster/connection.rb:19-23`) gates on
`schema_cache.data_source_exists?(table_name)` and scopes the lookup:
`@klass.with_connection { |connection| connection.lookup_cast_type_from_column(column) }`.

CLAUDE.md § "Schema reflection peeks at a warm cache" (#7831) ratifies only the
cache peek; it explicitly excludes the lease. The baseline row
`call-mismatches-exclude/activerecord/type-caster/connection.json`
(`with_connection`) now says the lease half stays open under this RFC.
`typecaster-connection-drops-datasource-gate-and-with-connection` is being closed
against the section, so this story carries the remainder.

## Acceptance criteria

- The lookup no longer reads the deprecated `connection` reader; it borrows the
  adapter through the lease-free / scoped shape RFC 0073 settles for sync callers.
- The `data_source_exists?` gate (`:19`) is ported as a cache peek.
- The `with_connection` baseline row is deleted when the call converges.
