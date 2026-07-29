---
title: "mariadb-insert-returning-rows-dropped"
status: claimed
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-29T19:14:23Z"
assignee: "mariadb-insert-returning-rows-dropped"
blocked-by: null
closed-reason: null
---

## Context

`AbstractMysqlAdapter#supports_insert_returning?` is `mariadb? && database_version

> = "10.5.0"`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:173`),
and trails' port at
`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:535`answers the same. But the MariaDB write path does not actually surface the`RETURNING`rows: on`mariadb:11`(the CI mysql lane's stand-in, 11.8.6),`insert_all`with returning yields`[]`.

This was masked until PR #5585: `support/supports.ts` baked
`insert_returning: ["postgres", "sqlite"]` off `adapterType`, so every
`itIfSupports("insert_returning", …)` skipped on the mysql lane regardless of
which server was behind it. Making the entry live-derived exposed 7 real
failures, all on a MariaDB 11 container:

- `insert-all.test.ts`: "insert with type casting and serialize is consistent",
  "insert all returns primary key if returning is supported", "insert all
  returns requested fields", "insert all returns requested sql fields", "insert
  all and upsert all with aliased attributes", "insert all returning uses
  schema-cache primary keys not the model primary key"
  (`expected [] to deeply equal [ 'id' ]` etc.)
- `persistence.test.ts`: "model with no auto populated fields still returns
  primary key after insert"

PR #5585 therefore holds `insert_returning`'s mysql answer at `false` with a
pointer to this story, recorded as the single entry in that suite's
`KNOWN_DIVERGENCES`; every other key reconciles against the live adapter.

Likely shape: the mysql2 execute path drops result rows for statements it
classifies as writes — the same failure mode as
`packages/activerecord/src/connection-adapters/mysql/database-statements.ts:111`
guards for. Compare with the SQLite `perform_query` isWrite gate, which had the
identical bug.

## Acceptance criteria

- `insert_all` / `upsert_all` with `returning:` yield the requested columns on
  MariaDB ≥ 10.5, matching the PostgreSQL/SQLite lanes.
- The 7 tests above pass on the MariaDB lane with no new skips and no test
  renamed.
- `support/supports.ts` drops the `insert_returning` hold-at-false and derives
  it from the live server like the other MySQL-family keys; the
  `KNOWN_DIVERGENCES` entry in `supports-live-adapter.trails.test.ts` is
  deleted, leaving that map empty.
