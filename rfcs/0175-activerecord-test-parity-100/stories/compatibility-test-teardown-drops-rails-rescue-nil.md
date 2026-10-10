---
title: "CompatibilityTest teardown drops Rails' rescue nil, so a test run alone fails on a missing schema_migrations"
status: draft
updated: 2026-10-10
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CompatibilityTest`'s teardown in Rails rescues both of its cleanup statements
(`vendor/rails/v8.0.2/activerecord/test/cases/migration/compatibility_test.rb:31-35`):

```ruby
teardown do
  connection.drop_table :testings rescue nil
  ActiveRecord::Migration.verbose = @verbose_was
  @schema_migration.delete_all_versions rescue nil
end
```

The trails port (`packages/activerecord/src/migration/compatibility.test.ts:59-63`)
drops the second `rescue nil`:

```ts
afterEach(async () => {
  await connection.dropTable("testings", "more_testings", { ifExists: true });
  Migration.verbose = verboseWas;
  await Base.connectionPool().schemaMigration.deleteAllVersions();
});
```

A test in the file that never creates `schema_migrations` therefore fails in
teardown when run alone. Reproduced on main after trails#8752:

```text
pnpm vitest run packages/activerecord/src/migration/compatibility.test.ts \
  -t "legacy migrations not raise exception on reverting transaction"
ActiveRecord::StatementInvalid: SQLite3::SQLException: no such table: schema_migrations
```

The same test passes when the whole file runs, because an earlier test's
`Migrator` created the table. The test body is not at fault.

The setup and first teardown line differ from Rails too: trails passes
`force: true` to `create_table :testings` (Rails `:25` does not), and drops
`more_testings` with `ifExists: true` where Rails has
`drop_table :testings rescue nil`. Rails sets `@schema_migration` and
`@internal_metadata` in setup (`:20-21`); trails re-reads the pool in teardown.

## Acceptance criteria

- `afterEach` mirrors Rails' teardown line for line: `drop_table :testings`
  with its `rescue nil`, the verbose restore, and
  `schemaMigration.deleteAllVersions()` with its `rescue nil`.
- `beforeEach` mirrors `setup` (`:16-29`): `schemaMigration` /
  `internalMetadata` captured there, `create_table :testings` without `force`
  unless a test proves it is needed, in which case the test that leaks the
  table is fixed instead.
- Every `it` in the `CompatibilityTest` describe passes when run alone with
  `-t`, on SQLite, PostgreSQL and MariaDB.
- No test names change.
