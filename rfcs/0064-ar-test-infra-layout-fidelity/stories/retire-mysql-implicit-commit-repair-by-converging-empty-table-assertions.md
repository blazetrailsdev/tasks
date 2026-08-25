---
title: "Retire the MySQL implicit-commit fixture repair by converging the trails-only 'unseeded table is empty' assertions"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6280
claim: "2026-08-09T14:59:36Z"
assignee: "fixture-harness-wrappers-restore-own-property-shadowing-prototype"
blocked-by: null
closed-reason: null
---

## Context

PR #6277 added a trails-only mechanism to `with-transactional-fixtures.ts` —
`guardMysqlImplicitCommit` plus `repairEscapedFixtureRows` — that watches the
pinned connection on MySQL/MariaDB and, when a DDL statement implicitly commits
the fixture transaction, deletes the tables that test's fixture load filled.
Rails has no counterpart: `teardown_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:206-211`) unpins
the pools and stops.

This is tracked debt, not a settled design. The audit behind #6277 established
why Rails needs nothing here, and it is not that Rails avoids the escape —
`BatchesTest` calls `add_index(:posts, :title)` inside a transactional test
(`vendor/rails/activerecord/test/cases/batches_test.rb:570`, `:809-853`), and
MySQL implicitly commits its pin exactly as it does ours. The difference is that
**no Rails test asserts a table it did not seed is empty.** A load deletes the
tables it is about to fill and nothing more
(`abstract/database_statements.rb:486-495`), so a leaked row is simply
overwritten at the next load and never observed.

trails does make that assertion, in blocks that declare `fixtures([])` and then
assert a bare `count() === 0`. Those assertions are what the repair mechanism
exists to serve, and they are the divergence — a trails test asserting something
its Rails counterpart does not.

## Converged shape

Audit the `fixtures([])`-plus-empty-count blocks (and any other assertion that a
table the block did not seed is empty), and converge each to what its Rails
counterpart asserts — declare the fixture set the block actually depends on, or
assert against the seeded baseline rather than zero. `pnpm rails:find` on each
test name gives the Rails body to match.

Once no test observes a leaked row, delete `guardMysqlImplicitCommit`,
`repairEscapedFixtureRows`, `MYSQL_IMPLICIT_COMMIT_STATEMENT`,
`DELETE_FROM_TABLE`, `SQL_ENTRY_POINTS`, the `pinBrokenByDdl` /
`seededFixtureTables` module state and the `unpinned` flag threading in
`afterEach`, so teardown is once again pool-unpin and cache-reset only, exactly
like `teardown_fixtures`.

Do NOT close this by rewriting the justification for the mechanism. If the audit
finds an assertion that genuinely must observe zero and has a Rails counterpart
doing the same, `pnpm tasks block` with that `file:line`.

## Acceptance criteria

- [ ] Every AR test asserting an unseeded table is empty is listed, with its
      Rails counterpart's assertion, and converged or individually justified.
- [ ] The MySQL implicit-commit guard and repair are deleted from
      `with-transactional-fixtures.ts`; teardown is cache/pool-reset only.
- [ ] The two `fixture rows do not survive a MySQL DDL implicit commit` blocks
      and the `a pinned test that runs no DDL issues no teardown DELETE` block
      in `with-transactional-fixtures.test.ts` go with the mechanism they pin.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — in particular the
      `PersistenceTest` cases PR #6273 fixed at the assertion.
