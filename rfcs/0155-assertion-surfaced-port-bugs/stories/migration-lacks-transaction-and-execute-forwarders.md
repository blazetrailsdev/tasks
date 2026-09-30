---
title: "migration-lacks-transaction-and-execute-forwarders"
status: ready
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced porting `compatibility_test.rb` (trails#8206).
`test_legacy_migrations_not_raise_exception_on_reverting_transaction`
(`vendor/rails/v8.0.2/activerecord/test/cases/migration/compatibility_test.rb:216-228`) calls
`transaction do execute "select 1" end` inside a `Migration[5.2]#change` and
runs `migrate(:down)`. That reaches `V5_2::CommandRecorder#invert_transaction`
(`migration/compatibility.rb:282-284`) through Rails' `Migration#method_missing`
(`migration.rb:1044-1059`), which forwards `transaction` / `execute` to the connection.

trails' `Migration` (`packages/activerecord/src/migration.ts`) declares typed
forwarders per CLAUDE.md § "Records are not Proxies", but has none for
`transaction` or `execute`, so the case can't be written.

## Acceptance criteria

- [ ] `Migration` forwards `transaction` and `execute` through `methodMissing` like its other statements.
- [ ] Port `legacy migrations not raise exception on reverting transaction` into `migration/compatibility.test.ts`.
