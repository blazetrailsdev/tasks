---
title: "activerecord: move the 20 TS-only tests in the mysql connection/explain, database-tasks and default-scoping test files to .trails siblings"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 660
priority: null
pr: trails#8846
claim: "2026-10-13T03:42:25Z"
assignee: "activerecord-relocate-ts-only-tests-mysql-tasks-scoping"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-relocate-ts-only-tests-smaller-dirs`, which moved
the extras in 12 of its files but could not fit these four under the PR LOC
ceiling. Extras per file, from `pnpm parity:test`:

- `packages/activerecord/src/adapters/abstract-mysql-adapter/connection.test.ts`, 7:
  `active after discard` and `discard abandons the raw connection without closing it`
  in `ConnectionTest`, plus the whole `connect error translation` describe (5 tests).
  Rails' `adapters/abstract_mysql_adapter/connection_test.rb` has no `discard` test.
- `packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts`, 7:
  the three `Relation#explain on MySQL ...` tests in `MySQLExplainTest`, plus the
  whole `explain helpers (trails-only)` describe (4 tests).
- `packages/activerecord/src/tasks/database-tasks.test.ts`, 3: the whole
  `DatabaseTasksWithTemporaryPoolTest` describe at the end of the file.
- `packages/activerecord/src/scoping/default-scoping.test.ts`, 3:
  `default scope as class method runs on create`,
  `sti association write paths use the declaring-class foreign key`,
  `sti has_one read build and assign paths use the declaring-class foreign key`.

None of the first three has a `.trails.test.ts` sibling yet;
`scoping/default-scoping.trails.test.ts` exists.

What the move needs, found while doing it once:

- `connection.trails.test.ts` needs the same `describeIfMysqlAdapter("Mysql2Adapter")`
  wrapper, `leaseMysqlAdapter` `beforeEach`, and the `afterEach` with
  `clearVersionCache`. The Rails-named file then drops `DatabaseConnectionError`,
  `ConnectionNotEstablished` and the `mysql2/promise` default import.
- `mysql-explain.trails.test.ts` needs the `beforeAll` that leases the adapter
  and the `fixtures(["authors", "authorAddresses", "posts"], { useTransactionalTests: true })`
  call for `authors("david")`.
- `database-tasks.trails.test.ts` needs `DatabaseTasks`, `HashConfig`, `Base`,
  `type ConnectionPool`, `DEFAULT_ENV`, `adapterType`, `ambientPoolConfiguration`
  and `vi`. The Rails-named file then drops its `ConnectionPool` type import.
- The default-scoping tests need `fixtures(["developers", "posts", "comments"])`
  and `registerModel` for `Developer`, `Comment`, `SpecialComment`,
  `VerySpecialComment`, `Post`, `SpecialPost`.
- `.trails.test.ts` files are not in `eslint/no-explicit-any-test-exclude.json`,
  so the default-scoping tests cannot keep their eight `any` casts and the
  allowlist must not grow. Casts that type-check: `readAttribute("name")` for
  the developer name, `post.association("specialComments") as HasManyAssociation`,
  `builder.association("verySpecialComment") as HasOneAssociation`, and a
  structural cast for `setVerySpecialComment`.

The two MySQL files only run on the MariaDB lane; run them against a local
compose stack before opening the PR.

## Acceptance criteria

- [ ] The 20 tests live in the four `.trails.test.ts` siblings, bodies unchanged apart from the `any` casts.
- [ ] All four Rails-named files report 0 extra in `pnpm parity:test --package activerecord --sort-extra --min-extra=1`.
- [ ] No row is added to `eslint/no-explicit-any-test-exclude.json`.
