---
title: "pg: engine walks libpq's host list so connect_to_hosts / reset reach resolve_hosts"
status: ready
updated: 2026-11-25
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10706 ported `PG::Connection`'s connect helpers. Two Rails arms are still unreached:

- `reset` (`vendor/pg/v1.6.2/lib/pg/connection.rb:594-596`) and `connect_to_hosts` (`:937-944`) call `resolve_hosts` only when `PG.library_version >= 100000`. `library_version` is PERMANENT-skipped (packages/pg/CLAUDE.md), and the port omits the arm, receipted as `@missingRailsCall resolve_hosts — PERMANENT` on `connectToHosts` (`packages/pg/lib/connection.ts`).
- The arm can't be taken as things stand. `resolve_hosts` emits libpq's comma-separated host/hostaddr/port lists (`localhost` becomes `::1,127.0.0.1`). `engine/node-pg.ts` `_clientConfig` hands `host` to node-pg verbatim, and node-pg connects to one host only.

libpq walks the host list inside `PQconnectPoll`, trying each entry until one succeeds (`ext/pg_connection.c` `pgconn_connect_poll` over libpq). The trails engine stand-in for that is `Connection#_connectStart` / `connectPoll`.

## Acceptance criteria

- The engine reads the host/hostaddr/port lists and tries each entry in order on connect failure, as libpq does, so `connectPoll` reports FAILED only after the last one.
- `connect_to_hosts` dispatches in Ruby's branch order (`if hostaddr / elsif host && !empty → resolve_hosts / else`), and `reset` takes its `resolve_hosts` arm. The guard `library_version` cannot evaluate stays omitted under its existing PERMANENT receipt.
- `@missingRailsCall resolve_hosts — PERMANENT` is removed from `connectToHosts`.
- `removeCurrentHost` restarts with the remaining hosts on timeout, as `polling_loop` (`:735-744`) intends.
