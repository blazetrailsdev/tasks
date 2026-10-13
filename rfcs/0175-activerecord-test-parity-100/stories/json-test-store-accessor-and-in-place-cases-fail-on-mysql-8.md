---
title: "activerecord: JSONTest store-accessor and in-place-change cases fail on MySQL 8 (pass on MariaDB)"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8871
claim: "2026-10-13T20:12:28Z"
assignee: "connection-handlers-multi-db-test-rails-setup-and-inline-config-swap"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while verifying trails#8806 against a local MySQL. `docker-compose.yml:37` runs `mysql:8`; the CI MySQL lane runs MariaDB 11, so this never reds CI.

Against `mysql:8`, two cases in `packages/activerecord/src/adapters/abstract-mysql-adapter/json.test.ts` fail, run alone, on `origin/main` at `079e69e98a` as well as on the PR branch:

- `JSONTest > test_with_store_accessors` — `expected '320×480' to be '640×1136'` at `json.test.ts:160`: a store-accessor write to a JSON column is not read back after save and reload.
- `JSONTest > test_changes_in_place_with_ruby_object`.

Both pass on MariaDB, where `json` is a `longtext` alias, and both are in Rails' shared cases (`vendor/rails/v8.0.2/activerecord/test/cases/json_shared_test_cases.rb`, `test_with_store_accessors` and `test_changes_in_place_with_ruby_object`), which Rails runs on MySQL proper with a native JSON column. The likely area is the native-JSON round trip: MySQL 8 returns a JSON column already normalised (key order, spacing) or already parsed by the driver, so the in-place change detection in `Type::Json#changed_in_place?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/json.rb`) or the serialized value written on update differs from the MariaDB path.

Reproduce with a private compose stack on free ports, then:

`TZ=UTC ARCONN=mysql2 MYSQL_PORT=<port> pnpm vitest run packages/activerecord/src/adapters/abstract-mysql-adapter/json.test.ts`

## Acceptance criteria

- [ ] Both cases pass against `mysql:8` and still pass against MariaDB 11.
- [ ] The cause is fixed in the ported type or adapter code at its Rails name, not by loosening the tests.
