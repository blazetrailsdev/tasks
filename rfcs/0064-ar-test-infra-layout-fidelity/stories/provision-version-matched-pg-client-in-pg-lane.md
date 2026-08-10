---
title: "provision-version-matched-pg-client-in-pg-lane"
status: closed
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded: PR #6296 provisions postgresql-client-17 from PGDG in the PG lane and enrolls PostgreSQLStructureDumpTest#structure_dump directly, so there is no residual work."
---

## Context

`packages/activerecord/src/adapters/postgresql/postgresql-rake.test.ts` ports
36 of the 37 cases in
`vendor/rails/activerecord/test/cases/adapters/postgresql/postgresql_rake_test.rb`
(PR #6296). The one left as `it.skip` is `PostgreSQLStructureDumpTest#test_structure_dump`
(`postgresql_rake_test.rb:333-343`).

It is the only case in its class that shells out for real — the others stub
`Kernel.system` — and it asserts the produced dump contains
`"PostgreSQL database dump complete"`:

```ruby
config = @configuration.dup
config["database"] = ARTest.config["connections"]["postgresql"]["arunit"]["database"]
ActiveRecord::Tasks::DatabaseTasks.structure_dump(config, @filename)
assert File.read(@filename).include?("PostgreSQL database dump complete")
```

That needs a `pg_dump` on PATH whose major version is not older than the
server. The PG lane (`.github/workflows/ci.yml:1033-1034`) runs a `postgres:17`
service, and nothing in the workflow installs a PostgreSQL client — GitHub's
ubuntu runner image carries the 16 client, and pg_dump aborts on a newer server
rather than dumping it.

The sibling SQLite case (`adapters/sqlite3/sqlite-rake.test.ts`, "structure
dump") does run for real, because `sqlite3` is preinstalled and has no
client/server version coupling.

## Acceptance criteria

- [ ] The PG lane provisions a `pg_dump`/`psql` whose major version matches the
      `postgres:17` service (PGDG apt repo, or run the client out of the
      service image).
- [ ] `PostgreSQLStructureDumpTest#structure dump` is un-skipped in
      `postgresql-rake.test.ts` at its Rails name, asserting
      `PostgreSQL database dump complete` with the Rails assertion kind
      (`assert File.read(...).include?(...)` → `toContain`).
- [ ] `pnpm parity:test` gate-mismatch stays 0 and the assertion ratchet stays
      green.
- [ ] Green on the PG lane.
