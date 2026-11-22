---
title: "mysql2-client-default-auth-reaches-the-npm-handshake"
status: draft
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Client default_auth reaches the npm handshake

## Context

`default_auth=` (`vendor/mysql2/0.5.6/ext/mysql2/client.c`, `MYSQL_DEFAULT_AUTH`) names the auth plugin libmysql answers the server's handshake with. `packages/mysql2/lib/client.ts` stores it and `connect` carries `@missingRailsCall default_auth`: `mysql2/lib/commands/client_handshake.js:73-141` always answers with the server's announced plugin (or `mysql_native_password` when a custom `authPlugins` entry or `authSwitchHandler` exists), and exposes no client-preferred plugin option. Split out of `mysql2-client-write-timeout-and-default-auth-reach-the-npm-connection`, whose `write_timeout` half landed.

## Acceptance criteria

- [ ] `default_auth` selects the plugin the client offers in the handshake response (e.g. by an upstream `mysql2` option, or a `ClientHandshake` hook), or the operator rules it permanent and the receipt on `connect` says so.
- [ ] `packages/mysql2/test/client.trails.test.ts` covers it.
