---
title: "Mysql2Adapter#getFullVersion queries SELECT VERSION() instead of reading server_info"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6143
claim: "2026-08-05T20:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

Cited at the call site in PR #6115 while making `getFullVersion` the bare fetch.
The memo and side effects are gone; the fetch itself still diverges.

Rails reads the banner off the driver's connection handshake, not off a query
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:168-170`):

```ruby
def get_full_version
  any_raw_connection.server_info[:version]
end
```

trails issues a round-trip instead
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`, `getFullVersion`):

```ts
const conn = await this.getConn();
const [[row]] = (await conn.query("SELECT VERSION() AS v")) as [Array<{ v: string }>, unknown];
return row?.v ?? "0.0.0";
```

Three consequences. It costs a query per connection at connect time, where
Rails costs none. It goes through `getConn()` rather than
`anyRawConnection`, so it does not compose with the pinned/lease-free path
`any_raw_connection` exists to provide. And the `?? "0.0.0"` invents a version
Rails never produces — Rails would surface a nil and raise in `version_string`,
which is the loud failure trails currently converts into a silently ancient
server that fails every `supports_*` floor.

The blocker is driver surface: node-mysql2 does not expose `server_info` the
way the Ruby `mysql2` gem does. Confirm before scoping — the handshake packet
carries the server version and the driver may surface it on the connection
object under another name, in which case this is a small change.

## Converged shape

- `getFullVersion` reads the server version off the raw connection's handshake
  state via `anyRawConnection`, per mysql2_adapter.rb:168-170 — no query.
- Drop the `?? "0.0.0"`; a missing banner reaches `versionString` and raises
  there, which is Rails' behaviour.
- If node-mysql2 genuinely exposes nothing, keep the query but move it behind
  `anyRawConnection` and record the driver gap as the language/driver
  shortcoming at the call site.

Related file-layout note from the same PR, not worth its own story: the single
`fullVersion()` definition sits on `AbstractMysqlAdapter` rather than
`Mysql2Adapter` where mysql2_adapter.rb:164-166 puts it, because Rails reaches
it from the abstract class by duck typing and TS needs a declared member. It is
marked `@internal` and cited at the call site. If this story lands a per-adapter
`getFullVersion` shape it may become natural to move `fullVersion` back too.

## Acceptance criteria

- [ ] node-mysql2's handshake/server-version surface established either way,
      and the finding recorded in the story.
- [ ] No `SELECT VERSION()` round-trip at connect time, or a call-site-cited
      driver-gap justification if the driver truly cannot supply it.
- [ ] No invented `"0.0.0"` fallback.
- [ ] Access routes through `anyRawConnection`, matching Rails.
- [ ] MySQL/MariaDB lanes green.
