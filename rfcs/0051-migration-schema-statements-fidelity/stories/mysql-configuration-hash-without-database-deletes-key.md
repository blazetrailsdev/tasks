---
title: "configuration_hash_without_database deletes the key instead of merging database: nil"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6281
claim: "2026-08-09T15:39:33Z"
assignee: "migration-context-collaborator-readers-cast-away-the-null-object"
blocked-by: null
closed-reason: null
---

## Context

`MySQLDatabaseTasks#configuration_hash_without_database`
(`activerecord/lib/active_record/tasks/mysql_database_tasks.rb:79-81`) is:

```ruby
def configuration_hash_without_database
  configuration_hash.merge(database: nil)
end
```

Rails MERGES an explicit `database: nil`; the key is present and null.
trails' `packages/activerecord/src/tasks/mysql-database-tasks.ts:294-296`
destructures the key away instead (`const { database: _db, ...rest }`), so the
key is absent entirely.

The distinction is observable: `MysqlDBCreateTest#test_establishes_connection_without_database`
(`activerecord/test/cases/adapters/mysql2/mysql2_rake_test.rb:26-28`) pins the
first `establish_connection` argument as `{ adapter: "mysql2", database: nil }`.
The ported test in
`packages/activerecord/src/adapters/mysql2/mysql2-rake.test.ts` asserts
`{ adapter: "mysql2" }` instead, i.e. it is currently written to trails'
behaviour rather than Rails'. It also matters to any config reader that
distinguishes "key absent" (fall back to a URL or a default) from "explicitly
no database" — which is exactly the case `create` uses it for.

Surfaced in review of PR #6278.

## Converged shape

```ts
private configurationHashWithoutDatabase(): ConfigHash {
  return { ...this.configurationHash, database: null };
}
```

Check the URL-rewriting arm the current body carries (it blanks the path of a
`url:` entry) against Rails, which has no such arm — either it is covering for a
gap elsewhere, in which case cite it, or it goes too.

## Acceptance criteria

- [ ] `configurationHashWithoutDatabase` merges an explicit null `database`
      rather than deleting the key, matching `mysql_database_tasks.rb:79-81`.
- [ ] `MysqlDBCreateTest#establishes connection without database` asserts
      Rails' `{ adapter: "mysql2", database: null }` first argument.
- [ ] Green on the MariaDB lane.
