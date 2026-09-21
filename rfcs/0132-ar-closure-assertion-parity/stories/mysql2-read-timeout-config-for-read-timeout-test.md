---
title: "mysql2-read-timeout-config-for-read-timeout-test"
status: draft
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
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

## Context

Rails `test_read_timeout_exception` (`vendor/rails/activerecord/test/cases/adapters/mysql2/mysql2_adapter_test.rb`) connects with `read_timeout: 1`, runs `SELECT SLEEP(2)`, and expects `AdapterTimeout`. trails' `Mysql2Adapter` has no `readTimeout` config, so `packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts` "read timeout exception" throws `translateExceptionClass(...)` on a hand-built driver error instead.

## Acceptance criteria

- Mysql2Adapter supports `read_timeout` (mapped onto the node driver's per-query timeout) and translates the timeout to `AdapterTimeout`.
- The test establishes a connection with `readTimeout: 1` and runs `SELECT SLEEP(2)`, as Rails does.
