---
title: "Retire the _fullVersionString / _mariadb memo fields; get_full_version and mariadb? derive"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6115
claim: "2026-08-05T02:45:04Z"
assignee: "row-count-is-debt-not-seeded-reasons"
blocked-by: null
closed-reason: null
---

## Context

Rails' MySQL version state is derived, not cached. `Mysql2Adapter#get_full_version`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:168-170`)
is one line with no memo:

```ruby
def get_full_version
  any_raw_connection.server_info[:version]
end
```

and `mariadb?` (`abstract_mysql_adapter.rb:92-94`) re-derives from the banner
every call:

```ruby
def mariadb? # :nodoc:
  /mariadb/i.match?(full_version)
end
```

`full_version` itself (`mysql2_adapter.rb:164-166`) reads
`database_version.full_version_string`, so `database_version`'s memo — Rails'
`@database_version ||=` in `AbstractAdapter#database_version` — is the _only_
memo in the chain.

trails carries two extra pieces of cached state instead:

- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts:354` declares
  `_fullVersionString`, which `getFullVersion` memoizes into and returns from.
- The same method sets `_mariadb` (`abstract-mysql-adapter.ts:255`) as a side
  effect, and `mariadb?`'s port reads that boolean field
  (`abstract-mysql-adapter.ts:383`) rather than matching against `fullVersion()`.

That extra memo then forces an invented guard in
`AbstractMysqlAdapter#getDatabaseVersion`
(`abstract-mysql-adapter.ts:1730-1740`): it re-checks `this._databaseVersion`
after awaiting `getFullVersion()`, with a comment explaining that the subclass
may have populated it as a side effect. Rails' `get_database_version`
(`abstract_mysql_adapter.rb:86-90`) has no such branch —

```ruby
def get_database_version # :nodoc:
  full_version_string = get_full_version
  version_string = version_string(full_version_string)
  Version.new(version_string, full_version_string)
end
```

PR #6107 converged `full_version` itself onto
`database_version.full_version_string`, which removes the last _reader_ of
`_fullVersionString` outside `getFullVersion`'s own memo. The remaining state is
now unreferenced surface with a divergent control flow hanging off it.

## Converged shape

- `getFullVersion` is the bare fetch (`mysql2_adapter.rb:168-170`): no
  `_fullVersionString` memo, no `_databaseVersion` side effect, no `_mariadb`
  side effect. Delete the `_fullVersionString` field.
- `mariadb?` re-derives from `fullVersion()` per `abstract_mysql_adapter.rb:92-94`.
  `_mariadb` goes with it; the ~10 call sites that read it
  (`abstract-mysql-adapter.ts:411-494` and neighbours) await the predicate.
- `getDatabaseVersion` loses the double-memo re-check and reads exactly like
  `abstract_mysql_adapter.rb:86-90`.

Note the async shape: Rails' `mariadb?` and `full_version` are sync because
`database_version` is memoized during `configure_connection`. trails' await is
the settled idiom, not a new deviation — but the _field_ it is standing in for
is.

## Acceptance criteria

- [ ] `_fullVersionString` and `_mariadb` are gone.
- [ ] `getFullVersion` is a bare `SELECT VERSION()` with no memo and no side effects.
- [ ] `mariadb?` matches `/mariadb/i` against `fullVersion()`.
- [ ] `getDatabaseVersion` matches `abstract_mysql_adapter.rb:86-90` line for line.
- [ ] MySQL/MariaDB lanes green.
