---
title: "converge-pg-configure-connection-variables-fetch"
status: claimed
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-22T19:19:58Z"
assignee: "converge-pg-configure-connection-variables-fetch"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter#configureConnection` and
`#reconfigureConnectionTimezone`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`) both
read a pre-parsed frozen `_sessionVariables` field instead of making Rails'
`@config.fetch(:variables, {})` call:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1005`
  — `variables = @config.fetch(:variables, {}).stringify_keys`
- `vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1041`
  — the timezone reconfigure re-reads the same hash.

trails resolves `variables` once at construction and freezes it, so the
per-call `fetch` never happens. That is a real structural divergence, not a
language shortcoming: Ruby's `fetch(:variables, {})` returns the STORED value
whenever the key exists (including a stored `nil`/`false`), and re-reading
`@config` per call is what lets a config mutation take effect on the next
configure.

Surfaced by RFC 0106 wave-5c, where the two rows left
`call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
as `@missingRailsCall fetch` receipts marked CONVERGEABLE against this story.

## Acceptance criteria

- [ ] `configureConnection` and `reconfigureConnectionTimezone` read the
      variables hash from `_config` at call time via the ported `fetch`
      semantics, matching postgresql_adapter.rb:1005 and :1041.
- [ ] The `@missingRailsCall fetch` tags on both declarations are deleted, not
      reworded.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; SQLite,
      PostgreSQL and MySQL/MariaDB lanes green.
