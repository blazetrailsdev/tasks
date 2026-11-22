---
title: "mysql2-client-write-timeout-and-default-auth-reach-the-npm-connection"
status: ready
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Client write_timeout and default_auth reach the npm connection

## Context

`mysql2-client-unwired-writers-reach-the-npm-connection` wired `reconnect=`, `default_file=` / `default_group=`, `enable_cleartext_plugin=` and `ssl_mode: :preferred` into `Client#connect` (`packages/mysql2/lib/client.ts`). Two writers still store a value `connect` never reads, and carry `@missingRailsCall ... CONVERGEABLE mysql2-client-write-timeout-and-default-auth-reach-the-npm-connection` on `connect`:

- `write_timeout=` (`vendor/mysql2/0.5.6/ext/mysql2/client.c`, `MYSQL_OPT_WRITE_TIMEOUT`): `mysql2/promise` has no per-write timeout; a socket `setTimeout` is an idle timeout and the driver does not act on its `timeout` event.
- `default_auth=` (`MYSQL_DEFAULT_AUTH`): the npm handshake (`mysql2/lib/commands/client_handshake.js`) always answers with the server's announced plugin and has no client-preferred plugin option.

## Acceptance criteria

- [ ] `write_timeout` fails a write that has not drained within the timeout with libmysql's `Mysql2::Error` (CR_SERVER_LOST), e.g. by watching the connection stream's write callback.
- [ ] `default_auth` selects the first auth plugin the client offers in the handshake response, or the operator rules it permanent and its receipt says so.
- [ ] `packages/mysql2/test/client.trails.test.ts` covers each.
