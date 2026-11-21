---
title: "mysql2-client-unwired-writers-reach-the-npm-connection"
status: ready
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10518 ported `Mysql2::Client#initialize`'s C writers (`vendor/mysql2/0.5.6/ext/mysql2/client.c:937-1010,1340-1500`) as `Client` members in `packages/mysql2/lib/client.ts`. Six of them store a value that `connect` never reads, because `mysql2/promise`'s `ConnectionConfig` has no key for it:

- `write_timeout=` (`MYSQL_OPT_WRITE_TIMEOUT`)
- `reconnect=` (`MYSQL_OPT_RECONNECT`)
- `default_file=` / `default_group=` (`MYSQL_READ_DEFAULT_FILE` / `_GROUP`; the npm driver reads no `my.cnf`)
- `default_auth=` (`MYSQL_DEFAULT_AUTH`)
- `enable_cleartext_plugin=`

`ssl_mode: :preferred` is also unreachable: libmysql tries TLS and falls back to plaintext (`client.c:121-190`), and the npm driver can do one or the other only.

## Acceptance criteria

- [ ] Each option either reaches the npm connection (for example `write_timeout` as a socket timeout on the connection stream, `reconnect` through `ping`, `default_file` read with async fs and merged into the config, PREFERRED as a TLS attempt with a plaintext retry), or the operator rules it permanent and its writer carries that receipt.
- [ ] `packages/mysql2/test/` covers each wired option.
