---
title: "pg-connection-connect-poll-c-primitives"
status: done
updated: 2026-11-24
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10691
claim: "2026-11-24T03:10:16Z"
assignee: "pg-connection-connect-poll-c-primitives"
blocked-by: null
closed-reason: null
---

# pg: port Connection's connect/poll C primitives over node-pg

## Context

`pg-connection-connect-and-reset-private-helpers` ports the Ruby helpers
`polling_loop`, `remove_current_host`, `async_connect_or_reset`, `resolve_hosts`,
`connect_to_hosts` and `host_is_named_pipe?` (`vendor/pg/v1.6.2/lib/pg/connection.rb:591-601`,
`:686-960`). Every one of them calls C methods `packages/pg/lib/connection.ts` does not
have, so a port today would be invented surface:

- `conninfo_hash`, `parse_connect_args`, `conninfo_parse`, `conndefaults` with real values (`conndefaults` returns all-nil keywords today)
- `connect_start` / `reset_start2`, `connect_poll` / `reset_poll` (`vendor/pg/v1.6.2/ext/pg_connection.c`)
- `error_message`, `host`, `hostaddr`, `port`, `socket_io#wait`
- `sync_setnonblocking`, `flush_data=`, `set_default_encoding`
- `PG.library_version`, `PG::BUNDLED_LIBPQ_WITH_UNIXSOCKET`
- `Addrinfo.getaddrinfo` for `resolve_hosts` (no `node:*` import allowed in package code)

Today `Connection.new` calls `connect()` and `reset` rebuilds a node-pg `Client`
(`packages/pg/lib/connection.ts`), bypassing all of it.

## Acceptance criteria

- The C primitives above exist on `Connection` at their gem names, driving node-pg's `Client` / protocol connection where libpq polls a socket.
- `pg-connection-connect-and-reset-private-helpers` can then route `new` and `reset` through the Ruby helpers with no invented members.
