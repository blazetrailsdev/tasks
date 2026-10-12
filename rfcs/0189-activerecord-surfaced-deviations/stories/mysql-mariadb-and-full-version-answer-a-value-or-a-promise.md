---
title: "MySQL isMariadb and fullVersion answer a value or a promise; Rails' mariadb? and full_version are sync"
status: ready
updated: 2026-10-12
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `mariadb?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:92-94`)
is `/mariadb/i.match?(full_version)`, and Mysql2's `full_version`
(`mysql2_adapter.rb:136-138`) is `database_version.full_version_string`. Both
are synchronous.

`converge-sql-for-insert-and-supports-insert-returning-to-sync` made
`supportsInsertReturning` a synchronous peek, and MySQL's body is
`mariadb? && database_version >= "10.5.0"` (`abstract_mysql_adapter.rb:164-166`).
The other version-gated predicates in
`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts` are
still `async` and reach `isMariadb` before they await `databaseVersion`, so
they can run on a pool whose server version is not memoized yet.

To serve both, `AbstractMysqlAdapter#isMariadb` and `Mysql2Adapter#fullVersion`
answer a value when the pool's server version is warm and a promise of it when
it is cold. Each carries `@inventedArm if` and `@inventedArm then` receipts
naming this story.

## Acceptance criteria

- [ ] `isMariadb` returns `boolean` and `fullVersion` returns `string | null`,
      with no `instanceof Promise` arm and no `.then`.
- [ ] Every caller that can run before the connection is configured still gets
      the right answer on a cold pool (MariaDB lane green), under trails
      CLAUDE.md § "Adapter facts are prewarmed and peeked".
- [ ] The four `@inventedArm` receipts naming this story are deleted.
