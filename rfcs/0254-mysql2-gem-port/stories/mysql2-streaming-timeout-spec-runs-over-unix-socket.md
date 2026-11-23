---
title: "mysql2 streaming-timeout spec runs over a unix socket in CI"
status: draft
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`result_spec.rb` "should raise an exception if streaming ended due to a timeout" (`vendor/mysql2/0.5.6/spec/mysql2/result_spec.rb:240-258`) is `it.skip` in `packages/mysql2/test/result.test.ts`. trails#10640 verified the cause. Over TCP on Linux, the ~2.6 MB result fits in autotuned socket buffers, so the gem itself never raises either. Over a unix socket (fixed 208 KB buffers, which is what the gem CI's `localhost` resolves to), both the gem and the port raise "Lost connection". `spec-helper.ts` connects over host/port only.

## Acceptance criteria

- [ ] `spec-helper.ts` honours a `MYSQL_SOCKET` env var, as `spec/configuration.yml`'s `socket:` key does.
- [ ] The MariaDB CI lane exposes the server's socket, the spec runs there as written, and the skip is removed.
