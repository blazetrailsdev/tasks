---
title: "activerecord: PG reconnect resets the raw connection and update_typemap_for_default_timezone rebuilds the timestamp decoder"
status: draft
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-converge-missing-control-flow-arms-connection-adapters-part-2`, which
converged 18 of that story's rows. `pnpm parity:api:arms:report --package=activerecord --direction=missing`
still shows:

- `connection-adapters/postgresql-adapter.ts#reconnect` — `-try -rescue -if`
- `connection-adapters/postgresql-adapter.ts#updateTypemapForDefaultTimezone` — `-if`

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb`):

- `:944-952` — `reconnect` is `begin; @raw_connection&.reset; rescue PG::ConnectionBad; @raw_connection = nil; end`
  then `connect unless @raw_connection`. The port (`postgresql-adapter.ts`, `reconnect`) is
  `this._discardRawConnection(); await this.connect();` — it never tries to reuse the connection.
  The blocker is that a `pg.Client` cannot be reset in place (a second `connect()` on an ended client
  throws), so `reset` needs the raw connection to be a holder that can swap its `pg.Client`. The raw
  connection is already gem-shaped by decoration in `_attachReadyForQueryListener`
  (`transactionStatus`, and since the parent story `status`, `cancel`, `block`); `reset` is the member
  that decoration cannot give, and is the reason to make that holder a real class.
- `:1093-1110` — `update_typemap_for_default_timezone` is one
  `if @raw_connection && @mapped_default_timezone != default_timezone && @timestamp_decoder` whose body
  picks `PG::TextDecoder::TimestampUtc` / `TimestampWithoutTimeZone` with a ternary, rebuilds
  `@timestamp_decoder`, adds it to `type_map_for_results`, calls `reconfigure_connection_timezone` and
  returns `true`. The port is an early return on `_mappedDefaultTimezone === tz` and has no
  `_timestampDecoder`, because `addPgDecoders` (`:1112-1150`) is an empty stub in
  `postgresql-adapter.ts`: results are decoded by the `pg` client's own type parsers.

Sibling `activerecord-converge-invented-control-flow-arms-postgresql-pg-client-boundary` needs the same
decision about where the pg client wrapper lives; take them together or in that order.

## Acceptance criteria

- [ ] `reconnect` is Rails' `begin`/`rescue PG::ConnectionBad` around `reset`, then
      `connect unless @raw_connection`, with `_discardRawConnection` gone from it.
- [ ] `addPgDecoders` records `_timestampDecoder`, and `updateTypemapForDefaultTimezone` is Rails' one
      guarded body with the decoder-class ternary and the `true` return.
- [ ] The missing-direction arms report shows no row for either pair.
- [ ] The PostgreSQL lane's reconnect tests (`adapters/postgresql/connection.test.ts`,
      `postgresql-adapter.test.ts`) stay green.
