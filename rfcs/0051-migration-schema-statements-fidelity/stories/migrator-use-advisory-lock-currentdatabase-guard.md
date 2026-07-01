---
title: "Migrator#isUseAdvisoryLock has a non-Rails currentDatabase guard"
status: ready
updated: 2026-06-30
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while editing `Migrator#isUseAdvisoryLock` in PR #4295
(`packages/activerecord/src/migration.ts`, the `isUseAdvisoryLock()` method).
That PR removed two now-redundant method-existence checks
(`getAdvisoryLock` / `releaseAdvisoryLock`, concrete on `AbstractAdapter`),
leaving:

```ts
isUseAdvisoryLock(): boolean {
  return !!(
    this._adapter.supportsAdvisoryLocks?.() &&
    typeof this._adapter.currentDatabase === "function"
  );
}
```

The trailing `typeof this._adapter.currentDatabase === "function"` guard is a
trails-only addition. Rails' `ActiveRecord::Migrator#use_advisory_lock?` gates
**only** on the adapter's advisory-lock support
(`active_record/migration.rb` — `use_advisory_lock?` →
`connection.supports_advisory_locks?`). The extra `currentDatabase` guard means
trails can return `false` (and silently skip migration advisory locking) on an
adapter that _does_ support advisory locks but doesn't expose `currentDatabase`
as a function — a behavior Rails would not exhibit.

## Acceptance criteria

- [ ] Read Rails `Migrator#use_advisory_lock?` and confirm the exact gate
      (supports_advisory_locks? only, vs. any database-name dependency).
- [ ] Converge `isUseAdvisoryLock` to the Rails gate, or document why the
      `currentDatabase` guard is load-bearing in trails (e.g. lock-id
      generation needs the DB name) and move it to the call that actually
      requires it rather than the support predicate.
- [ ] No regression in advisory-lock migration tests across sqlite/pg/mysql.
