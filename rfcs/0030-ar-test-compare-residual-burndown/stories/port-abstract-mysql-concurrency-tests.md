---
title: "port-abstract-mysql-concurrency-tests"
status: claimed
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-07-23T02:52:36Z"
assignee: "port-abstract-mysql-concurrency-tests"
blocked-by: null
closed-reason: null
---

## Context

`test:compare --incomplete` marks both abstract_mysql_adapter concurrency files
✗ — neither has a TS counterpart under
`packages/activerecord/src/adapters/abstract-mysql-adapter/`:

- `vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/count_deleted_rows_with_lock_test.rb:11`
  — "delete and create in different threads synchronize correctly": racing
  `delete_all` vs an unrelated `create!` on two threads; asserts the delete
  returns 1 (MySQL row-count-under-lock behavior).
- `vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/nested_deadlock_test.rb:37`
  — "deadlock correctly raises Deadlocked inside nested SavepointTransaction":
  two connections deadlock inside nested savepoint transactions; asserts
  `ActiveRecord::Deadlocked` and savepoint state. Rails itself creates the
  `samples` table inline (its own test does), so mirroring that is faithful.

Both are two-connection concurrency tests — Ruby threads map to trails'
concurrent-async-with-two-pools pattern. MySQL-gated. If either interleave is
genuinely unreproducible in JS, classify it permanent-skip explicitly rather
than leaving a ✗.

## Acceptance criteria

- Both TS files exist (Rails test names preserved), MySQL-gated, exercising the
  real race/deadlock via two connections — or carry an explicit permanent-skip
  classification with call-site justification.
- Neither file appears as ✗ in `test:compare --package activerecord`.
