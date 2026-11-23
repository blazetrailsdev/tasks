---
title: "mysql2 session_track reads every tracker type from the OK packet"
status: draft
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
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

`client.test.ts` "session_track" keeps "returns multiple session track type values when available" and "returns valid transaction state inside a transaction" skipped (trails#10616). `Client#sessionTrack` (port of `rb_mysql_client_session_track`, `vendor/mysql2/0.5.6/ext/mysql2/client.c`) reads npm mysql2's `ResultSetHeader.stateChanges`. That parser (`mysql2/lib/packets/resultset_header.js`) parses types 0-3 only and drops SESSION_TRACK_TRANSACTION_CHARACTERISTICS (4) and \_STATE (5). It also splits GTIDS, where libmysql returns the raw strings. Spec: `client_spec.rb:1095-1114`.

## Converged shape

Read the OK packet's session-state block in the existing `handlePacket` hook in `Client#connect`. Keep every (type, data) pair in arrival order, as `mysql_session_track_get_first/next` iterate them. `sessionTrack(type)` returns them, or null when there are none.

## Acceptance criteria

- [ ] Both skipped specs run and pass on MariaDB 11.

- [ ] The three running session_track specs still pass. SESSION_TRACK_GTIDS returns libmysql's raw strings.
