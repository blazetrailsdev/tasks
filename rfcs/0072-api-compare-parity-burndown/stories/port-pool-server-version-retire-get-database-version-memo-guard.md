---
title: "Port pool.server_version; retire getDatabaseVersion's memo guard"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6144
claim: "2026-08-05T21:13:08Z"
assignee: "move-date-time-to-date-package"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #6115 while converging `AbstractMysqlAdapter#getDatabaseVersion`
onto `abstract_mysql_adapter.rb:86-90`. The double-memo re-check that PR removed
is gone, but a single leading memo guard remains, and it is not in Rails.

Rails splits the two concerns cleanly:

```ruby
# abstract_mysql_adapter.rb:86-90 — pure derivation, no memo
def get_database_version # :nodoc:
  full_version_string = get_full_version
  version_string = version_string(full_version_string)
  Version.new(version_string, full_version_string)
end

# abstract_adapter.rb:851-856 — the memo lives on the POOL
def get_database_version # :nodoc:
end

def database_version # :nodoc:
  pool.server_version(self)
end
```

`ConnectionPool#server_version` is the cache; every adapter's
`get_database_version` is a pure fetch called at most once through it.

trails has no `pool.server_version`, so the memo was pushed down into the
adapter: `getDatabaseVersion` opens with
`if (this._databaseVersion) return this._databaseVersion;` and assigns the field
on the way out. That guard is currently cited at the call site as the stand-in,
but it is a deviation, not a language shortcoming — it puts caching in the
method Rails deliberately kept pure, and it is why `_databaseVersion` is
readable as a field at all (see the sibling story
`mysql-supports-predicates-read-database-version-field-not-reader`).

## Converged shape

- Port `ConnectionPool#server_version` (`connection_pool.rb`) as the single
  cache, keyed per adapter as Rails keys it.
- `AbstractAdapter#databaseVersion` reads `this.pool.serverVersion(this)`, per
  `abstract_adapter.rb:854-856`.
- `AbstractMysqlAdapter#getDatabaseVersion` becomes the pure three-line
  derivation of `abstract_mysql_adapter.rb:86-90`: no leading guard, no field
  assignment.
- Retire the `_databaseVersion` field once the sibling story has removed its
  other readers.

Note the async shape: trails' `getDatabaseVersion` is async where Rails' is
sync, because the version fetch is a real await. The pool-level cache is what
makes the sync `databaseVersion` reader honest afterwards — this story is a
precondition for that, not a change to it.

Check the PostgreSQL and SQLite adapters for the same pushed-down memo before
scoping; `get_database_version` baseline rows exist in both
`call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
and `sqlite3-adapter.json`.

## Acceptance criteria

- [ ] `pool.serverVersion(adapter)` exists and is the only version cache.
- [ ] `AbstractMysqlAdapter#getDatabaseVersion` is the pure derivation, guard-free.
- [ ] `AbstractAdapter#databaseVersion` reads through the pool.
- [ ] PG/SQLite checked for the same shape; converged or filed separately.
- [ ] All adapter lanes green.
