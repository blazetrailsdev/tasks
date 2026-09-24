---
title: "AdapterForeignKeyTest loads fixtures :fk_test_has_pk as adapter_test.rb:346 does"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: trails#8052
claim: "2026-09-24T18:29:09Z"
assignee: "adapter-foreign-key-test-loads-fk-test-has-pk-fixture"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AdapterForeignKeyTest` (`vendor/rails/activerecord/test/cases/adapter_test.rb:343-405`) sets `self.use_transactional_tests = false`. It loads `fixtures :fk_test_has_pk` (`:346`), which puts in the row `pk_id: 1`, and leases `@connection` in `setup`. It has no other setup or teardown.

The trails port, `describe("AdapterForeignKeyTest")` in `packages/activerecord/src/adapter.test.ts`, differs in four ways:

- It calls `fixtures({}, { useTransactionalTests: false })`, so it loads no fixtures.
- It adds a `cleanup` that deletes from `fk_test_has_fk` / `fk_test_has_pk`, registered as both `beforeEach` and `afterEach`. Rails has no such hook.
- It adds a `beforeEach` that runs `PRAGMA foreign_keys = ON` on sqlite.
- In `foreign key violations on delete are translated to specific exception`, it inserts the pk row itself before `insertIntoFkTestHasFk(1)`. Rails relies on the fixture row for that.

The registry already has `fkTestHasPk` (`test-helpers/fixtures-registry.ts:283`), and its data matches `test/fixtures/fk_test_has_pk.yml`.

## Acceptance criteria

- The describe calls `fixtures(["fkTestHasPk"], { useTransactionalTests: false })`, and the delete test no longer inserts the pk row itself.
- The trails-only `cleanup` hooks and the PRAGMA hook are removed. Keep one only if a test goes red without it. In that case, keep it with the reason shown by the failing test.
- All three lanes are green.
