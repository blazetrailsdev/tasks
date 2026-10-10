---
title: "activerecord: Mysql2::Client _query and Statement#execute honour the query options they are handed"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8744 ported `Mysql2::Client#query` (`vendor/mysql2/0.5.6/lib/mysql2/client.rb:144-148`) as
`query(sql, options = {})` calling `_query(sql, { ...queryOptions, ...options })` in
`packages/activerecord/src/mysql2/client.ts`. `_query` (`ext/mysql2/client.c:1605`, `rb_mysql_query`)
reads every option in that hash. The port reads one: `databaseTimezone`, through `typeCastFor`.

Not honoured:

- `as`: rows are always arrays (`rowsAsArray: true` in `options()`), so the gem's default `as: :hash`
  (`client.rb:7`) returns arrays. The adapter only asks for `:array` (`mysql2_adapter.rb:159`).
- `cast_booleans`, `symbolize_keys`, `application_timezone`, `cache_rows`, `cast`, `async`
  (`client.rb:8-15`) are in `defaultQueryOptions()` and read by nothing.
- `Statement#execute` (`lib/mysql2/statement.rb:3-7`) takes `**kwargs` merged over the client's options;
  the port's `execute(...args)` takes none and passes `client.queryOptions`.

## Acceptance criteria

- [ ] `_query` and `Statement#execute` honour `as` (`"hash"` rows keyed by field name), `cast` and
      `castBooleans`, `symbolizeKeys` and `applicationTimezone`, each with a trails test, or a key the
      npm driver cannot serve is deleted from `defaultQueryOptions()` with the reason at that line.
- [ ] `Statement#execute` accepts the gem's per-call options.
