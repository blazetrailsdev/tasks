---
title: 'MySQL full_version falls back to "" because Version#fullVersionString is nullable'
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6138
claim: "2026-08-05T17:13:08Z"
assignee: "date-yday-drops-m-yday-fast-arms"
blocked-by: null
closed-reason: null
---

## Context

`AbstractMysqlAdapter#fullVersion` returns
`this.databaseVersion.fullVersionString ?? ""`. Rails has no fallback
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:164-166`):

```ruby
def full_version # :nodoc:
  database_version.full_version_string
end
```

The `?? ""` exists because trails' `Version` (`connection-adapters/abstract-adapter.ts:156-168`)
declares `fullVersionString: string | null` with a `null` default, so a Version
built from a bare numeric string carries none. Rails' `Version` is only ever
constructed by `get_database_version` (`abstract_mysql_adapter.rb:86-90`), which
always passes the full string, so Rails cannot observe the nil and `full_version`
needs no arm for it.

The deviation is currently cited in the `fullVersion` JSDoc (PR #6125). It is
debt, not a settled shape: `isMariadb()` does `/mariadb/i.test(fullVersion())`,
so an empty string silently answers "not MariaDB" where Rails would have raised
on `nil.full_version_string`-style misuse — the same swallow-the-unwarmed-case
failure mode that story removed from the version predicates.

## Converged shape

Make `fullVersionString` non-nullable, or narrow the nullable window to the
constructor arm Rails does not have, so `fullVersion()` is a bare
`return this.databaseVersion.fullVersionString;`. Audit the Version construction
sites (`getDatabaseVersion`, the PG/SQLite analogues, and any test-built
Version) for the ones that pass only a numeric string, and give them the full
string or a distinct constructor.

## Acceptance criteria

- [ ] `fullVersion()` has no `?? ""` and the JSDoc deviation note is deleted,
      not reworded.
- [ ] `Version#fullVersionString` cannot be null on any adapter-built Version.
- [ ] MySQL/MariaDB lanes green.
