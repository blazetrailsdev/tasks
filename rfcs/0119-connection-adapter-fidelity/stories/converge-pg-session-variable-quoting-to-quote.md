---
title: "Render :variables session values through quote, not an on/off mapping"
status: claimed
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-08-30T15:23:49Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter#configureConnection`'s `:variables` loop
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`, in
`_maybeConfigureConnection`) renders the non-sentinel value itself rather than
routing it through `quote`. Rails is:

```ruby
elsif !v.nil?
  internal_execute("SET SESSION #{k} TO #{quote(v)}", "SCHEMA")
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:986`)

trails instead does:

```ts
const pgVal = val === true ? "on" : val === false ? "off" : String(val);
await client.query(`SET SESSION ${key} TO ${this.quoteLiteral(pgVal)}`);
```

Two divergences fall out of that:

- **Booleans.** `Quoting#quote(true)` on PG yields `TRUE` / `FALSE`
  (`connection_adapters/postgresql/quoting.rb`), so Rails emits
  `SET SESSION k TO TRUE`. trails emits `SET SESSION k TO 'on'`. The `on`/`off`
  spelling is a trails invention; no Rails code produces it.
- **Numerics.** `quote(5)` yields the bare `5`; trails' `String(5)` +
  `quoteLiteral` yields `'5'`.

Postgres coerces all four spellings for most GUCs, so
`adapters/postgresql/connection.test.ts` stays green either way — this is a
silent divergence, not a failing one.

Surfaced while converging the `":default"` sentinel spelling in the adjacent
branch (story `converge-pg-variables-default-sentinel-spelling`, PR #7105).

## Converged shape

Route the value through the adapter's `quote` (the `Quoting#quote` port), the
way postgresql_adapter.rb:986 does, and delete the `on`/`off` mapping.

Note the execution route must stay a direct `client.query` on the raw client
passed into `_maybeConfigureConnection` — routing configure-time queries back
through `execute`/`withRawConnection` deadlocks against the acquire/reset
barrier. Only the _quoting_ converges here, not the call.

## Acceptance criteria

- [ ] The non-sentinel arm renders its value with `quote`, matching
      postgresql_adapter.rb:986.
- [ ] `true` emits `TRUE`, `false` emits `FALSE`, a number emits it bare.
- [ ] The `on`/`off` string mapping is gone.
- [ ] PostgreSQL lane green.
