---
title: "activerecord: Admin test models derive their table name from Admin.table_name_prefix"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8488 gave the `Admin` fixture module its Rails `table_name_prefix`
(`vendor/rails/v8.0.2/activerecord/test/models/admin.rb:3-7`), and `full_table_name_prefix` now reads it
through `module_parents` (`activerecord/lib/active_record/model_schema.rb:302-304`).

Rails' `Admin::User` and `Admin::Account` set no `table_name`
(`test/models/admin/user.rb`, `test/models/admin/account.rb`): `admin_users` and `admin_accounts` come from the prefix.
The trails models still hard-code it (`static _tableName = "admin_users"` in
`packages/activerecord/src/test-helpers/models/admin/user.ts`, and the same in `admin/account.ts` and `admin/user-json.ts`),
so the prefix path is not exercised by the canonical models. `AdminRegion` in
`associations/belongs-to-associations.test.ts` does the same.

## Acceptance criteria

- [ ] Each `Admin::*` test model drops an explicit `_tableName` wherever its Rails counterpart sets no `table_name`, and derives it from `Admin.tableNamePrefix`.
- [ ] The tests that use those models stay green on SQLite, PostgreSQL and MariaDB.
