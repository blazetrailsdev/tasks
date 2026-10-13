---
title: "activerecord: table_name_prefix / table_name_suffix accept nil and interpolate it as an empty string"
status: draft
updated: 2026-10-13
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `table_name_prefix` / `table_name_suffix` are class attributes defaulting
to `""` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:164-165`)
and accept `nil`: `DatabaseTasksTruncateAllWithPrefixTest` /
`WithSuffixTest` reset them with `ActiveRecord::Base.table_name_prefix = nil` /
`table_name_suffix = nil`
(`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb:1354-1356,1364-1366`).
Every Rails reader interpolates the value (`"#{full_table_name_prefix}#{…}#{full_table_name_suffix}"`,
`model_schema.rb:615`; `schema_migration.rb:50`; `internal_metadata.rb:32`),
and Ruby interpolates `nil` as `""`.

trails types both `string` (`packages/activerecord/src/model-schema.ts:207,752`,
`packages/activerecord/src/base.ts:617`) and the readers build the name with
template literals, where `null` interpolates as `"null"`. So the ported
teardowns in `packages/activerecord/src/tasks/database-tasks.test.ts`
(`DatabaseTasksTruncateAllWithPrefixTest` / `WithSuffixTest`, shipped in
trails#8870) write `""` where Rails writes `nil`.

## Acceptance criteria

- [ ] `tableNamePrefix` / `tableNameSuffix` are typed `string | null`, and every
      reader that interpolates one renders `null` as `""`, as Ruby's
      `"#{nil}"` does.
- [ ] The two teardowns in `database-tasks.test.ts` assign `null`, as
      `database_tasks_test.rb:1355,1365` do.
