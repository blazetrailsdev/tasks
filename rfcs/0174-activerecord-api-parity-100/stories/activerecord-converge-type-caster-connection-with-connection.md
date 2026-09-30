---
title: "activerecord: TypeCaster::Connection#type_for_attribute leases through with_connection (call row)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`call-mismatches-exclude/activerecord/type-caster/connection.json` — `type_for_attribute` omits
`with_connection`: `vendor/rails/v8.0.2/activerecord/lib/active_record/type_caster/connection.rb` reads
`@klass.with_connection { |connection| connection.lookup_cast_type_from_column(column) }`. The port reads
the column's cast type without a lease. This body is synchronous in Rails and reached from Arel type
casting; CLAUDE.md § "Schema reflection peeks at a warm cache" scopes which sync leases are ratified
(none).

## Acceptance criteria

- [ ] The body follows Rails through the settled sync shape available after RFC 0152 (a `withConnection` lease where the caller is async, or the ratified warm-cache peek) — name which in the PR; row deleted.
