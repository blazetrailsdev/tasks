---
title: "activerecord: MySQL mariadb? / full_version are async; supportsInsertReturning inlines the regexp"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 63
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `mariadb?` is synchronous
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:92-94`):
`/mariadb/i.match?(full_version)`, and `full_version` is
`database_version.full_version_string`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:164-166`).

In trails `AbstractMysqlAdapter#isMariadb` and `Mysql2Adapter#fullVersion`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`,
`mysql2-adapter.ts`) are `async`: they await `this.databaseVersion`, and about
fifteen `supports_*` predicates in `abstract-mysql-adapter.ts` await
`isMariadb()` in turn.

The PR for `converge-sql-for-insert-and-supports-insert-returning-to-sync` made
`supportsInsertReturning` synchronous. It could not call the async `isMariadb`,
so it inlines the regexp against the peeked `databaseVersion.fullVersionString`
where Rails' body (`abstract_mysql_adapter.rb:173-175`) is
`mariadb? && database_version >= "10.5.0"`. The call gate does not flag the
omitted call, so nothing in the code records it.

A plain flip of `isMariadb` to a sync peek is not safe on its own: on a pool
where no connection has been configured yet, `this.databaseVersion` is a
promise, `fullVersionString` reads `undefined`, and every
`await this.isMariadb()` caller would silently answer the MySQL arm. Each caller
needs a warm version first (trails CLAUDE.md, "Adapter facts are prewarmed and
peeked").

## Acceptance criteria

- [ ] `fullVersion` and `isMariadb` are synchronous and read the pool's warmed
      server version, as `mysql2_adapter.rb:164-166` and
      `abstract_mysql_adapter.rb:92-94` do.
- [ ] `supportsInsertReturning` is `this.isMariadb() && databaseVersion >= "10.5.0"`,
      with the inlined regexp gone.
- [ ] No `await this.isMariadb()` caller can read a cold version: each either
      runs after the connection is configured or warms `databaseVersion` first.
