---
title: 'SQLite3Adapter#getDatabaseVersion queries the driver directly instead of queryValue(..., "SCHEMA")'
status: blocked
updated: 2026-08-07
rfc: "0076-execute-primitive-convergence"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-07T17:21:52Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: 'Gated on make-version-gated-predicates-async (RFC 0072), which is still `ready` as of 2026-08-07. The story text sequences this one after it: routing getDatabaseVersion through the async queryValue(..., "SCHEMA") makes the value unavailable to the sync version-gated supports*() readers in sqlite3-adapter.ts (:1240, :1264, :1268, :1304, :1324) until something awaits it. Converging today would have to reintroduce a driver-direct read or a hand-warm somewhere else, i.e. move the deviation rather than retire it.'
closed-reason: null
---

## Context

Surfaced while shipping `retire-sqlite3-and-pg-database-version-overrides`
(PR 6158), which made `SQLite3Adapter#getDatabaseVersion` the pure fetch Rails
has and deleted the `_databaseVersion` field.

Rails reads the version through the adapter's own query path, tagged SCHEMA
(`activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:476-478`):

```ruby
def get_database_version # :nodoc:
  SQLite3Adapter::Version.new(query_value("SELECT sqlite_version(*)", "SCHEMA"))
end
```

trails issues the same SQL straight at the driver handle
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`,
`getDatabaseVersion`), because our `queryValue` is `async` while the
version-gated `supports*()` readers that consume `databaseVersion`
(`:1240`, `:1264`, `:1268`, `:1304`, `:1324`) are sync. Going through
`queryValue` today would make the value unavailable to them until something
awaited it. Consequences of the driver-direct call:

- the query never reaches the SCHEMA-tagged log/notification path, so it is
  invisible to `assertQueries` and to the query-cache/dirtying wrappers
- the body carries a sync/Promise branch on `driver.prepare(...)` plus an
  `eslint-disable blazetrails/sqlite-driver-await`, none of which Rails has
- a missing driver (deferred async-only checkout) answers `Version("0.0.0")`
  rather than raising, which the pool memo (`pool_config.rb:39-41`) will then
  cache

## Converged shape

`getDatabaseVersion()` is Rails' one-liner over `queryValue("SELECT
sqlite_version(*)", "SCHEMA")`, with no driver-direct call, no
sync/Promise branch, no eslint suppression and no zero-version fallback. This
is gated on `make-version-gated-predicates-async` (RFC 0072): once the
version-gated predicates can await, the sync constraint that forces the
driver-direct read is gone. Sequence this after it.

## Acceptance criteria

- [ ] `SQLite3Adapter#getDatabaseVersion` reads through `queryValue(..., "SCHEMA")`
      and matches `sqlite3_adapter.rb:476-478` line for line.
- [ ] No `blazetrails/sqlite-driver-await` suppression and no `Version("0.0.0")`
      fallback remain in it.
- [ ] The version read shows up as a SCHEMA query, like every other reflection probe.
- [ ] sqlite lane green, including the async-only driver (libsql) path.
