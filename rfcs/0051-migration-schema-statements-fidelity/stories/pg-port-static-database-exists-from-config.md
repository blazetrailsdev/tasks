---
title: "pg-port-static-database-exists-from-config"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5757
claim: "2026-08-01T02:03:45Z"
assignee: "pg-port-static-database-exists-from-config"
blocked-by: null
closed-reason: null
---

## Context

Rails defines the class-level probe once on `AbstractAdapter`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:358-360`):

```ruby
def self.database_exists?(config)
  new(config).database_exists?
end
```

and every adapter test uses it — `postgresql_adapter_test.rb:120,126`,
`mysql2_adapter_test.rb:88,94`, `sqlite3_adapter_test.rb:33,37`.

trails has it only on `Mysql2Adapter`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:412`), which
constructs an adapter, calls `_ensureClient()` and maps `NoDatabaseError` to
false. There is no equivalent on `AbstractAdapter` or `PostgreSQLAdapter`.

The gap is visible in the ported tests: `postgresql-adapter.test.ts:215-226`
carries the Rails test names "database exists returns false when the database
does not exist" / "...returns true when the database exists", but exercises the
one-arg `pg_database` catalog probe (renamed `databaseNameExists` by PR #5752)
rather than the static the Rails tests actually call.

PG already has the error mapping the static needs: `isNoDatabaseError` checks
SQLSTATE 3D000 (`postgresql-adapter.ts:2748-2750`) and `NoDatabaseError.dbError`
is raised at `postgresql-adapter.ts:2772`.

## Acceptance criteria

- A static `databaseExists(config)` exists on the adapters, mirroring
  `self.database_exists?(config)` — preferably hoisted so `Mysql2Adapter` stops
  being the only one that has it.
- `postgresql-adapter.test.ts:215-226` exercises the static, matching what the
  Rails tests of the same name assert. Test names unchanged.
- Green on all three lanes.
