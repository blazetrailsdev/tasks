---
title: "Two check-constraint tests fail on MySQL 8 with Duplicate check constraint name (CI-invisible: mysql lane disabled)"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two check-constraint tests fail against **MySQL 8** on `main` (verified by
checking `origin/main`'s `connection-adapters/` and `migration/` out over a
clean tree and re-running — the failures are identical, so they predate #7532
and are unrelated to it):

- `packages/activerecord/src/schema-dumper.test.ts` — `SchemaDumperTest > schema
dumps check constraints`
- `packages/activerecord/src/migration/check-constraint.test.ts` — `Migration >
CheckConstraintTest > check constraints`

Both fail the same way:

```text
StatementInvalid: Error: Duplicate check constraint name 'products_price_check'.
  at Mysql2Adapter.performQuery (connection-adapters/mysql2/database-statements.ts:158)
```

i.e. a check constraint is created twice within the test, so either the
add-path is not detecting the existing constraint or teardown is not dropping
it. Rails' `add_check_constraint` guards with `if_not_exists` and
`check_constraint_exists?`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`),
so the likely culprit is the same class of bug #7532 fixed for foreign keys:
a lookup hash that materializes an absent key, or a name-comparison arm that
does not match what MySQL 8 reports back from `information_schema`.

**CI cannot see this.** The dedicated MySQL lane is disabled
(`.github/workflows/ci.yml` — "mysql-tests is temporarily disabled"), and the
MariaDB stand-in that replaces it does not reproduce these two, because MariaDB
and MySQL 8 differ on check-constraint introspection. So this is invisible
until the MySQL lane is re-enabled.

Reproduce with the repo's own compose stack:

```bash
docker compose up -d mysql
ARCONN=mysql2 MYSQL_HOST=127.0.0.1 MYSQL_PORT=13306 \
  pnpm vitest run packages/activerecord/src/migration/check-constraint.test.ts \
                  packages/activerecord/src/schema-dumper.test.ts
```

## Acceptance criteria

- [ ] Root cause identified — add-path guard vs. teardown vs. MySQL 8
      introspection — and cited against the Rails method it diverges from.
- [ ] Both tests pass under `ARCONN=mysql2` against MySQL 8.
- [ ] They stay green on MariaDB, PostgreSQL and sqlite.
