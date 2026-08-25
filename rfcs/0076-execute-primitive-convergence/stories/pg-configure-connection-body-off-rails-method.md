---
title: "PG configure_connection's body lives in _maybeConfigureConnection"
status: draft
updated: 2026-08-16
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# PG configure_connection's body lives in `_maybeConfigureConnection`

## Context

Rails' `PostgreSQLAdapter#configure_connection`
(`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:956-997`)
is one method: `super`, encoding, `client_min_messages=`,
`schema_search_path=`, the notice receiver, `set_standard_conforming_strings`,
then

```ruby
variables = @config.fetch(:variables, {}).stringify_keys
internal_execute("SET intervalstyle = iso_8601", "SCHEMA")
variables.map do |k, v|
  if v == ":default" || v == :default
    internal_execute("SET SESSION #{k} TO DEFAULT", "SCHEMA")
  elsif !v.nil?
    internal_execute("SET SESSION #{k} TO #{quote(v)}", "SCHEMA")
  end
end
add_pg_encoders; add_pg_decoders; reload_type_map
```

trails' `configureConnection` is a two-line delegator to a private
`_maybeConfigureConnection(client)` (`postgresql-adapter.ts:825-874`), which
issues every SET directly on the `pg.Client` and renders values with
`quoteLiteral`. So the ported method makes none of `fetch` /
`internal_execute` / `quote` — three `kind: "set"` rows in
`call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
after PR #6581.

The stated blocker is real but is a trails-side design choice, not a language
limit: configure runs while the acquire machinery still holds `_acquiring` (and,
on `resetBang`, while the reset holds the connection lock), so routing the SETs
through `internalExecute` re-enters `connectBang`/verify and deadlocks. Rails
has no such problem because `configure_connection` is called from `connect`
with `@raw_connection` already published, and `internal_execute` →
`with_raw_connection` is re-entrant on it (`abstract_adapter.rb:985`).

Blocked-on/related: `0073-permanent-connection-checkout-flip` and
`0013-pg-rawconn-refinement` both touch the same seam; the boolean
`_connectionConfigured` gate is the other half of why the body had to move.

## Converged shape

- `configureConnection()` **is** the Rails body — no `_maybeConfigureConnection`
  delegator — reading `variables` off `@config` via a `fetch`-equivalent that
  preserves Ruby's stored-`nil`/`false` semantics (see CLAUDE.md's `fetch` vs
  `??` note), and issuing the SETs through `internalExecute(sql, "SCHEMA")`.
- Requires making `withRawConnection` re-entrant on the already-acquired handle
  (Rails' `connect! if @raw_connection.nil?` shape) so a nested
  `internalExecute` during configure resolves to the connection being
  configured instead of awaiting the acquire it is nested inside.
- Values render through `quote(v)`, not `quoteLiteral`.
- Delete the three rows from the exclude shard; `pnpm parity:api:calls:tighten
activerecord/connection-adapters/postgresql-adapter.json`.

## Acceptance criteria

- [ ] `configure_connection` row count for `postgresql-adapter.ts` is 0.
- [ ] `pnpm parity:api:calls` green, in-scope count falls; no baseline widened.
- [ ] No deadlock on connect, `resetBang`, `reconnectBang` or discard paths —
      covered by a test that reconfigures a live connection.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
