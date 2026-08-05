---
title: "MySQL supports_virtual_columns? answers true unconditionally, Rails gates on 5.7.5"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6139
claim: "2026-08-05T19:53:07Z"
assignee: "date-package-scaffold"
blocked-by: null
closed-reason: null
---

## Context

`AbstractMysqlAdapter#supportsVirtualColumns` (`abstract-mysql-adapter.ts`)
returns a bare `true`. Rails gates it on the server version
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:144-146`):

```ruby
def supports_virtual_columns?
  mariadb? || database_version >= "5.7.5"
end
```

Surfaced while converging the sibling version predicates onto the
`database_version` reader in PR #6125 (RFC 0072
`mysql-supports-predicates-read-database-version-field-not-reader`). That story
enumerated 13 named sites and this one was not among them, so it was left
alone rather than widened into — but it is the same class of divergence: a
capability answered unconditionally where Rails asks the server.

The unconditional `true` is wrong for MySQL 5.6.x, where generated columns do
not exist; `schema-creation.ts:326` already branches on
`isMariadb()` for the `PERSISTENT`/`STORED` keyword, so the generated-column
path is reachable on a server that cannot serve it.

## Converged shape

```ts
supportsVirtualColumns(): boolean {
  return this.isMariadb() || this.databaseVersion.compare("5.7.5") >= 0;
}
```

Branch order and literal exactly as `:144-146`. Reads the `databaseVersion`
getter, not `_databaseVersion`, matching the sibling predicates after #6125.

## Acceptance criteria

- [ ] `supportsVirtualColumns` reads `mariadb? || database_version >= "5.7.5"`.
- [ ] No `_databaseVersion` field read and no `?? -1` fallback introduced.
- [ ] MySQL/MariaDB lanes green.
