---
title: "SQLiteDatabaseTasks#drop invents an in-memory no-op where Rails raises NoDatabaseError"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6273
claim: "2026-08-09T02:00:45Z"
assignee: "fixture-teardown-has-no-delete-rails-deletes-at-next-load"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#drop`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) opens with a
trails-only early return:

```ts
if (isInMemoryDatabase(dbPath)) return;
```

Rails has no such guard
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:22-28`):

```ruby
def drop
  db_path = db_config.database
  file = File.absolute_path?(db_path) ? db_path : File.join(root, db_path)
  FileUtils.rm(file)
  FileUtils.rm_f(["#{file}-shm", "#{file}-wal"])
rescue Errno::ENOENT => error
  raise NoDatabaseError.new(error.message)
end
```

`FileUtils.rm(":memory:")` raises `Errno::ENOENT`, which the rescue turns into
`NoDatabaseError` — so Rails' answer for an in-memory database is
`NoDatabaseError`, not a silent no-op. #6259 removed the matching guard from
`create` on exactly this reasoning (`File.exist?(":memory:")` is false, so
Rails just connects); `drop`'s guard is the same invention and was left in
place because it was out of that story's scope.

It is pinned by two trails-only tests in
`packages/activerecord/src/tasks/sqlite-database-tasks.test.ts`,
`test_db_drop_is_noop_for_file_memory_uri` and
`test_db_drop_is_noop_for_named_file_memory_uri`, which assert the no-op
directly.

The blocker to check first is whether anything in the `sqlite3_mem` bootstrap
reaches `drop` and depends on the no-op; if it does, that caller is the thing
to converge, not the guard.

## Converged shape

`drop` is `sqlite_database_tasks.rb:22-28` line for line, with no in-memory
arm: the `root` join, the `rm`, the `rm_f` of the `-shm`/`-wal` pair, and the
single `Errno::ENOENT` → `NoDatabaseError` rescue. An in-memory database
therefore raises `NoDatabaseError`, as it does in Rails.

## Acceptance criteria

- [ ] No `isInMemoryDatabase` arm in `drop`.
- [ ] `drop` on `:memory:` raises `NoDatabaseError`, matching Rails' rescue.
- [ ] The two `test_db_drop_is_noop_for_*` trails-only tests are retired or
      re-pointed at the Rails behaviour — not left asserting the removed guard.
- [ ] Green on the sqlite file lane and `sqlite3_mem`.
