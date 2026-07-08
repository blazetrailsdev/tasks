---
title: "txn-fixtures-halting-destroy-savepoint"
status: in-progress
updated: 2026-07-08
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 17
pr: 4792
claim: "2026-07-08T18:22:34Z"
assignee: "txn-fixtures-halting-destroy-savepoint"
blocked-by: null
closed-reason: null
---

## Context

Split off from `txn-fixtures-abort-recovery` (RFC 0057). That story removed the
`usesTransaction` opt-outs from deliberate-SQL-error tests by fixing the fixture
teardown to skip its redundant per-table `DELETE`s while the pinned transaction
is still open (`use-fixtures.ts` `shouldDeleteFixtureRows`). That covers every
opt-out whose abort is only observed at teardown.

One opt-out could NOT be removed with that fix:
`has-many-through-associations.test.ts` →
`"update counter caches on destroy with indestructible through record"`
(`packages/activerecord/src/associations/has-many-through-associations.test.ts:155`).

`IndestructibleTagging.beforeDestroy(() => throwAbort())`
(`test-helpers/models/tagging.ts:62`) mirrors Rails'
`before_destroy { throw :abort }` (`vendor/rails/.../models/tagging.rb:18-20`).
In Rails, `post.indestructible_tags.destroy(tag)` halts via the callback with NO
SQL error, so the subsequent `post.reload` runs fine inside the fixture txn
(`has_many_through_associations_test.rb:654-662`, run transactionally with no
opt-out). In trails, running transactionally the destroy leaves the PostgreSQL
transaction ABORTED **mid-test** (25P02 surfaces at the next `Post.find`), so the
in-test assertion fails — this is distinct from the teardown-DELETE poisoning and
is NOT recoverable by the teardown fix. Root cause is likely that the halting
`collection.destroy` path issues SQL that aborts the outer txn instead of rolling
back a per-destroy savepoint cleanly.

## Acceptance criteria

- [ ] Reproduce: remove the `usesTransaction` opt-out for
      `"update counter caches on destroy with indestructible through record"` and
      show it fails on PG (`ARCONN=postgresql`) with "current transaction is
      aborted" at the post-destroy `Post.find`.
- [ ] Fix the halting-`destroy` path so a `throw :abort`/`throwAbort()` in
      `before_destroy` rolls back to a savepoint (or otherwise leaves the outer
      transaction usable), matching Rails' clean callback-halt semantics.
- [ ] Remove the opt-out and keep the PG lane green.
