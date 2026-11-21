---
title: "Mysql2::Client#initialize's option writers, charset_name= and ssl_set reach the npm connection"
status: ready
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mysql2::Client#initialize` (`vendor/mysql2/0.5.6/lib/mysql2/client.rb:32-58`) hands each connection option to a C writer (`reconnect=`, `local_infile=`, `write_timeout=`, `init_command=`, `secure_auth=`, `default_file=`, `default_group=`, `enable_cleartext_plugin=`, `default_auth=`; `ext/mysql2/client.c`, `set_*` / `_set_*` → `mysql_options`). It then calls `self.charset_name = opts[:encoding] || 'utf8'`, and `ssl_set` / `ssl_mode=` (`:46-58`, with `parse_ssl_mode` `:99-108` and `find_default_ca_path` `:127-134`).

In trails, `packages/mysql2/lib/client.ts` (the constructor loop, trails#10491) writes those options as ad-hoc instance properties through `(this as Options)[key] = ...`, and `connect` only reads `connectTimeout`. `writeTimeout`, `localInfile`, `initCommand` and the other writer-set options therefore never reach the npm connection config. `charset_name=`, `ssl_set`, `ssl_mode=`, `parse_ssl_mode` and `find_default_ca_path` are not ported.

## Acceptance criteria

- [ ] Each C writer is a `Client` member at its gem name (`setWriteTimeout`, `setInitCommand`, … or a setter where it is sync), and the constructor calls it in place of the property write.
- [ ] `connect` passes every writer-set value to the `mysql2/promise` config (`localInfile` → `infileStreamFactory`/`localInfile`, `initCommand` → run on connect, `writeTimeout`, the encoding → `charset`).
- [ ] `charsetName=`, `sslSet`, `sslMode=`, `parseSslMode` and `findDefaultCaPath` are ported from `client.rb:46-58,99-134`, mapped onto the npm `ssl` option.
- [ ] `packages/mysql2/test/` covers each option reaching `mysql.createConnection`'s config.
