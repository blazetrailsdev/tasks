---
title: "mysql2-default-file-reads-every-my-cnf-client-option"
status: done
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: trails#10556
claim: "2026-11-22T07:35:04Z"
assignee: "mysql2-client-prepare-prepares-on-the-server"
blocked-by: null
closed-reason: null
---

# default_file reads every my.cnf client option

## Context

trails#10534 wired `default_file=` / `default_group=` (`vendor/mysql2/0.5.6/ext/mysql2/client.c`, `MYSQL_READ_DEFAULT_FILE` / `_GROUP`) through `myLoadDefaults` and `MY_CNF_KEYS` in `packages/mysql2/lib/client.ts`. That stands in for libmysql's `my_load_defaults` + `mysql_read_default_options`, but it reads only `user`, `password`, `host`, `port`, `socket` and `database`. libmysql also reads `ssl-ca` / `ssl-cert` / `ssl-key` / `ssl-cipher`, `default-character-set`, `connect-timeout`, `compress`, `local-infile`, `init-command`, and follows `!include` / `!includedir`. Dashed and underscored spellings are both accepted.

## Acceptance criteria

- [ ] Every client option `mysql_read_default_options` reads that has a `mysql2/promise` `ConnectionConfig` key is applied beneath the explicit options, with dash and underscore spellings both read.
- [ ] `!include` / `!includedir` are followed with async fs.
- [ ] `packages/mysql2/test/client.trails.test.ts` covers an ssl key, `default-character-set` and `!include`.
