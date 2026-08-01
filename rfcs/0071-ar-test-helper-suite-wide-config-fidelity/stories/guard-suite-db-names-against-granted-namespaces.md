---
title: "Guard suite database names against the rails user's granted namespaces"
status: done
updated: 2026-08-01
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 0
pr: 5773
claim: "2026-07-31T23:56:13Z"
assignee: "guard-suite-db-names-against-granted-namespaces"
blocked-by: null
closed-reason: null
---

## Context

PR #5646 narrowed the MySQL `rails` test user from `GRANT ALL PRIVILEGES ON
*.*` to per-namespace patterns in `scripts/db-init/mysql/01-rails-user.sql`:

    GRANT ALL PRIVILEGES ON `activerecord\_unittest%`.* TO 'rails'@'%';
    GRANT ALL PRIVILEGES ON inexistent_activerecord_unittest.* TO 'rails'@'%';
    GRANT ALL PRIVILEGES ON `ar\_cli\_e2e%`.* TO 'rails'@'%';

That makes the grant file implicitly coupled to every database name the test
suites invent, with nothing enforcing the relationship. The coupling broke
during that PR's own review: the activerecord-cli E2E suite creates
`ar_cli_e2e_${process.hrtime.bigint()}` databases
(`packages/activerecord-cli/src/__e2e__/mysql-happy-path.test.ts:34`, and the
postgres sibling at `:32`) via `ar db:create` as the same `rails` user. The
first revision granted only `activerecord_unittest%`, so `db:create` exited 1
and only the MariaDB/MySQL legs failed — Postgres passed because its role holds
`CREATEDB`, which is not per-database. It cost a full CI round-trip to surface,
and a grep for `CREATE DATABASE` / `createDatabase` call sites did not find it
because the E2E creates its database through the CLI (`run(["db:create"])`)
rather than a literal statement.

Any future test that invents a database name outside the granted namespaces
will fail the same way: only on the MySQL legs, only in CI, with an exit code
rather than a permission error in the assertion message.

Known database-name producers today:

- `slotDatabaseName` — `packages/activerecord/src/support/run-token.ts:88`
  (`activerecord_unittest_<token>_<slot>`)
- `ARUNIT_DATABASE` / arunit2 — `packages/activerecord/src/support/config.ts:169`,
  `packages/activerecord/src/support/arunit2-config.ts`
- `ar_cli_e2e_<hrtime>` — the two activerecord-cli E2E happy-path suites
- Postgres-only temporaries `trails_test_drop_db_tmp` /
  `trails_test_recreate_tmp` —
  `packages/activerecord/src/connection-adapters/postgresql/schema-statements.test.ts:263,286`
  (unaffected by MySQL grants, listed so a guard does not false-positive)

## Acceptance criteria

- A guard fails fast when a database name the suite creates falls outside the
  namespaces `scripts/db-init/mysql/01-rails-user.sql` grants. A lint over the
  known producers, or a test that derives the namespaces from the SQL file and
  checks the producers against them, both fit — pick whichever stays honest as
  the grant file changes.
- The guard must model MySQL's wildcard semantics: `_` and `%` are LIKE
  wildcards in a database-level GRANT unless backslash-escaped, so
  `activerecord\_unittest%` matches `activerecord_unittest2` but not
  `activerecordXunittest_1`.
- It must not false-positive on the Postgres-only temporaries, which no MySQL
  grant covers by design.
- Failure message names the offending database and points at the grant file, so
  the next occurrence is a one-line fix rather than a CI archaeology session.
