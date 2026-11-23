---
title: "mysql2 CLIENT_ERRORS texts are pinned to Connector/C's client_errors[]"
status: draft
updated: 2026-11-23
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10647 added `CLIENT_ERRORS` to `packages/mysql2/lib/client.ts`. It holds the libmysql `ER(CR_*)` texts for 2002, 2003, 2005, 2006 and 2013, and `raiseMysql2Error` formats each one with `%-.100s` (the host or socket) and `%d` (the OS errno). The texts were written from memory of MariaDB Connector/C's `libmariadb/ma_errmsg.c` `client_errors[]`. That source is not vendored, so nothing pins the strings. The gem passes `mysql_error` through unchanged (`vendor/mysql2/0.5.6/ext/mysql2/client.c:263-277`, `rb_raise_mysql2_error`). Two related loose ends:

- `ENOENT` maps to `CR_CONNECTION_ERROR` on every `raiseMysql2Error` path, not only on connect. It is safe today because LOCAL INFILE errors carry a numeric errno (`infile.ts:53`).
- For `ENOTFOUND`, `%d` prints npm's getaddrinfo errno with the sign dropped, where Connector/C prints the resolver's own return code.

## Acceptance criteria

- [ ] Vendor Connector/C's `ma_errmsg.c` (the version the gem CI links, 3.4.x) under `vendor/`, or cite it at a pinned version, and check each `CLIENT_ERRORS` text against it word for word.
- [ ] The `ENOTFOUND` `%d` argument matches the value Connector/C passes to `my_set_error` for `CR_UNKNOWN_HOST`.
- [ ] `ENOENT` → 2002 applies only on the connect call site.
