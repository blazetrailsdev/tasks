---
title: "D1 — transactions: committed/destroy callback firing"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "persistence"
deps: []
deps-rfc: []
est-loc: 330
priority: null
pr: null
claim: "2026-06-16T02:58:11Z"
assignee: "d1-transactions-commit-destroy-callbacks"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Reopens f4. committedBang fires for destroy (triggerDestroyCallback), callback ordering, and instrumentTransaction Notifications event not published.

**41** `it.skip` tests to un-skip across 3 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **34** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- committedBang fires for destroy (triggerDestroyCallback=true) and
- afterCommit/afterRollback scoped to savepoint level requires
- transactions.ts#instrumentTransaction or Notifications event not published on commit/rollback

### Skipped tests to un-skip

- `transactions_test.rb` → `transactions.test.ts` — **32** to un-skip:
  - after_commit_returns_record_with_destroy
  - nested_transaction_with_savepoint_fires_callbacks
  - throw from transaction commits
  - rollback dirty changes even with raise during rollback removes from pool
  - rollback dirty changes even with raise during rollback doesnt commit transaction
  - connection removed from pool when commit raises and rollback raises
  - connection removed from pool when begin raises after successfully beginning a transaction
  - rollback dirty changes then retry save on new record with autosave association
  - add to null transaction
  - deprecation on ruby timeout outside inner transaction
  - invalid keys for transaction
  - using named savepoints
  - releasing named savepoints
  - savepoints name
  - sqlite add column in transaction
  - sqlite default transaction mode is immediate
  - mark transaction state as nil
  - transaction rollback with primarykeyless tables
  - unprepared statement materializes transaction
  - nested transactions skip excess savepoints
  - prepared statement materializes transaction
  - savepoint does not materialize transaction
  - raising does not materialize transaction
  - accessing raw connection materializes transaction
  - accessing raw connection disables lazy transactions
  - checking in connection reenables lazy transactions
  - automatic savepoint in outer transaction
  - no automatic savepoint for inner transaction
  - the uuid is lazily computed
  - transaction isolation read committed
  - after current transaction commit multidb nested transactions
  - concurrent Promise.all top-level transactions are serialized (no shared TM frame)
- `transaction_callbacks_test.rb` → `transaction-callbacks.test.ts` — **7** to un-skip:
  - only call after commit on update after transaction commits for existing record on touch
  - only call after commit on top level transactions
  - only call after rollback on update after transaction rollsback for existing record on touch
  - saving a record with a belongs to that specifies touching the parent should call callbacks on the parent object
  - before commit actions
  - updated callback called on first to save when followed in transaction by destroy from separate instance with old configuration
  - destroyed callbacks called on first saved instance in transaction with old configuration
- `transaction_instrumentation_test.rb` → `transaction-instrumentation.test.ts` — **2** to un-skip:
  - reconnecting after materialized transaction starts new event
  - transaction instrumentation on failed rollback

## Test-writing direction

Write **Rails-faithful tests** — fidelity to the upstream Rails suite is the #1
priority, not green checkmarks:

- **Read the corresponding Rails test first** (`activerecord/test/cases/...`) and
  mirror its structure, models, and assertions. Never reword or rename a test.
- **Use the official/canonical schema** (`TEST_SCHEMA`, which mirrors Rails'
  `schema.rb`) and the **official canonical models** in
  `packages/activerecord/src/test-helpers/models/` — there are ~200 already ported
  (Author, Post, Tag, Tagging, Comment, Category, Categorization, and many more),
  matching Rails' `activerecord/test/models/`. Do **not** create your own custom
  tables or models: **table, column, and model names must match Rails exactly.**
  If Rails uses `Author`/`authors`, use the canonical `Author` model and `authors`
  table — never rename it, hand-roll a stand-in, or substitute a bespoke one.
- **Use `useHandlerFixtures`** for fixture-backed setup — the one-call wiring that
  mirrors Rails' `fixtures :name` + transactional tests. Look up the real
  fixtures Rails uses instead of hand-building records.
- **Move away from `defineSchema`** / bespoke per-test schemas. If the canonical
  schema seems to lack something, mirror Rails' own setup (canonical model +
  fixture) rather than hand-rolling a schema.
- **Skip rather than deviate.** If a test cannot pass without diverging from Rails
  behavior (an implementation gap, missing feature, or genuine divergence), do
  **not** contort the test, schema, or assertion to force it green. Leave it
  `it.skip` with a `BLOCKED:`/`ROOT-CAUSE:` tag and **file an upstream-fix story**
  via `pnpm tasks new <rfc-slug> <story-slug>` so the gap is tracked and converged
  separately. Always converge to Rails — never ratify a deviation.

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
