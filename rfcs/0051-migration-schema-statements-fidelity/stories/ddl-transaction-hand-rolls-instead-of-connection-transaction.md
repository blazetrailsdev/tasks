---
title: "Migrator#ddl_transaction hand-rolls begin/commit instead of calling connection.transaction"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6180
claim: "2026-08-07T16:29:49Z"
assignee: "of-kind-default-type-and-normalize-arguments"
blocked-by: null
closed-reason: null
---

## Context

The one wide call-mismatch row PR #6121 left behind on `ddl_transaction`:
`activerecord migration.ts ddl_transaction transaction`. The other two rows on
that method (`use_transaction?`, and `execute_migration_in_transaction`'s two)
converged when the wrapper/private split collapsed; this one is a real body
divergence, not a hop.

Rails (`vendor/rails/activerecord/lib/active_record/migration.rb:1585-1591`):

```ruby
def ddl_transaction(migration, &block)
  if use_transaction?(migration)
    connection.transaction(&block)
  else
    yield
  end
end
```

trails (`packages/activerecord/src/migration.ts`, `ddlTransaction`) hand-rolls
the transaction instead of calling `connection.transaction`:

```ts
if (this.connection.inTransaction) {
  await fn();
} else {
  await this.connection.beginTransaction();
  try {
    await fn();
    await this.connection.commit();
  } catch (e) {
    try {
      await this.connection.rollback();
    } catch {
      /* swallow */
    }
    throw e;
  }
}
```

Three consequences:

1. `connection.transaction` is never called, so none of its behaviour applies —
   requires-new handling, savepoints, `after_commit` callback dispatch, the
   transaction instrumentation.
2. The `inTransaction` short-circuit is trails-only. Rails relies on
   `transaction`'s own nesting semantics; a nested `transaction` call on an
   already-open connection joins the outer one rather than being skipped.
3. Rollback errors are swallowed. `connection.transaction` does not swallow
   them.

Related precedent: `sqlite-alter-table-hand-rolls-transaction-instead-of-helper`
(same RFC, done) converged the identical shape elsewhere in the adapter layer.

## Converged shape

```ts
async ddlTransaction(migration: Migration, fn: () => Promise<void>): Promise<void> {
  if (this.isUseTransaction(migration)) {
    await this.connection.transaction(fn);
  } else {
    await fn();
  }
}
```

Check what `AbstractAdapter#transaction` does with an already-open transaction
before dropping the `inTransaction` arm — if it does not join the outer
transaction the way Rails' does, that gap is this story's real work and the
`ddl_transaction` body is just where it surfaced.

## Acceptance criteria

- `ddlTransaction` calls `connection.transaction`; the hand-rolled
  begin/commit/rollback and the `inTransaction` short-circuit are gone.
- The row `ddl_transaction` / `transaction` is **removed** from
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/migration.json`
  (only-shrink).
- Migration and migrator suites green on all three lanes, including the
  `disable_ddl_transaction` and failed-migration-rollback cases.
