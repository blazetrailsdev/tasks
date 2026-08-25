---
title: "Port or retire the sqlite retries busy_handler"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Cannot converge and is not worth tracking: no bound JS sqlite driver exposes sqlite3_busy_handler (only a busy timeout at open), and Rails deprecates :retries for removal in 8.1; the call-site comment already records the deviation."
---

## Context

Rails' `SQLite3Adapter#configure_connection` `retries` branch
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:827-832`)
warns, casts `retries` with `type_cast_config_to_integer`, and installs
`raw_connection.busy_handler { |count| count <= retries }`.

PR #5583 ported everything in that block except the handler:
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`
(`configureConnection`) emits the deprecation warning and stops, with the
deviation documented at the call site. `retries` is also not cast, since
nothing consumes the cast value.

The handler is unported because the `SqliteConnection` interface
(`packages/activerecord/src/sqlite-adapter.ts:59`) has no busy-handler surface
and none of the bound drivers expose `sqlite3_busy_handler` — better-sqlite3,
node:sqlite and libsql all accept only a busy _timeout_ at open. Adding a hook
would be an interface member no driver can implement.

Rails deprecates the option for removal in 8.1, so this may be resolved by
dropping `retries` entirely rather than by porting the handler. Triage should
decide between: (a) find or add a driver-level busy-handler escape hatch (e.g.
via the better-sqlite3 `raw` handle), (b) close as an accepted permanent
deviation with the Rails 8.1 removal as the justification.

## Acceptance criteria

- Either a count-bounded busy handler is installed for `retries` on every
  driver that can support it, with the deviation comment narrowed to the
  drivers that cannot, or
- the story is closed with a written decision that the handler is permanently
  unported, and the call-site comment updated to reference that decision.
- `retries` is cast with `typeCastConfigToInteger` if and only if a consumer
  for the cast value exists.
