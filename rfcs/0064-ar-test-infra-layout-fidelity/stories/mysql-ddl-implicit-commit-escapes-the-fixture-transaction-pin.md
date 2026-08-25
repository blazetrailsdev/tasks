---
title: "MySQL DDL implicit commit escapes the fixture transaction pin, leaking rows into the next describe"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6277
claim: "2026-08-09T12:53:07Z"
assignee: "mysql-ddl-implicit-commit-escapes-the-fixture-transaction-pin"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `fixture-teardown-has-no-delete-rails-deletes-at-next-load`
(PR #6273), which removed the per-test fixture DELETE so that teardown matches
`teardown_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb`) — cache and
pool reset only — and the rows go at the next load's `table_deletes`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:486-495`).

That change exposed a pre-existing gap the DELETE had been masking. On
MySQL/MariaDB, fixture rows seeded inside the transactional pin **survive the
rollback**: a DDL statement auto-commits (MySQL has no transactional DDL), which
implicitly commits the open fixture transaction, so the rows are durable and
`teardown_fixtures`' rollback cannot undo them. On SQLite and PostgreSQL the
rollback covers them, which is why this is a MySQL/MariaDB-only red.

The visible symptom is a later `describe` inheriting the previous block's rows.
A load only deletes the tables it is about to fill, so a `describe` declaring
`fixtures([])` deletes nothing and starts with whatever leaked. PR #6273 hit
this in three `PersistenceTest` cases (`expected 5 to be +0`, reproduced on
plain MySQL 8 as well as MariaDB) and fixed them at the assertion; the
underlying commit-escape is untouched and will keep surfacing wherever a test
assumes a table it did not seed is empty.

Rails does not have this problem because its own suite does not run DDL inside a
fixture-pinned test on MySQL; where trails does, the pin silently ends.

## Converged shape

Identify where the trails suite issues DDL inside a fixture-pinned transaction
on MySQL/MariaDB and stop the pin from being silently discarded — either by
keeping such files off the transactional path the way Rails' own DDL tests are
(`use_transactional_tests = false`, which trails spells
`fixtures([...], { useTransactionalTests: false })`), or by re-opening the pin
after a known implicit commit. Do **not** reintroduce a teardown DELETE: that is
the deviation PR #6273 removed, and `teardown_fixtures` issues none.

A first step worth doing regardless: an audit of which AR test files run DDL
while transactionally pinned on the MySQL lanes, since that set is the blast
radius.

## Acceptance criteria

- [ ] Fixture rows seeded under the transactional pin do not survive into a
      later `describe` on the MySQL and MariaDB lanes.
- [ ] No teardown DELETE is reintroduced; `teardown_fixtures` stays
      cache/pool-reset only (`test_fixtures.rb`).
- [ ] A test pins the leak: seed a fixture set, run DDL, and assert the rows are
      gone in the next block — red on baseline for MySQL/MariaDB.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
