---
title: "Converge eager destroy belongs_to preload to Rails lazy load (drop savepoint workaround)"
status: ready
updated: 2026-07-08
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Base#_preloadBelongsToForDestroyCallbacks`
(`packages/activerecord/src/base.ts`) eagerly loads **every** `belongs_to`
target before a `before_destroy`/`around_destroy` callback runs, so a
synchronous callback can read an otherwise-async association reader. This is a
trails invention — Rails issues **no** such query; it lazily loads only the
associations a callback actually dereferences
(`vendor/rails/activerecord/lib/active_record/associations/belongs_to_association.rb`,
lazy `reader`).

PR #4792 (story `txn-fixtures-halting-destroy-savepoint`) had to wrap each
preload `loadTarget()` in its own savepoint because one canonical association
(`tag_with_primary_key` → `tags.custom_primary_key`, a non-existent column)
issues a doomed `SELECT` that aborts the PostgreSQL transaction (25P02). The
savepoint fixed the abort but the underlying deviation remains: trails fires N
extra `SELECT`s (now N extra SAVEPOINT/RELEASE round-trips) on every
destroy-with-callback, none of which Rails issues.

Related (already filed): `belongs-to-sync-read-direct-destroy-callback` (done,
introduced the preload) and
`strict-loading-violation-suppressed-in-destroy-belongs-to-preload` (ready).

## Acceptance criteria

- [ ] Converge to Rails' lazy semantics: do not eagerly load `belongs_to`
      targets a destroy callback never reads. Either make the sync-callback
      association reader materialize on demand, or narrow the preload to
      associations the callback references.
- [ ] Eliminate the per-association savepoint overhead added by PR #4792 once
      the doomed eager query is no longer issued.
- [ ] `has-many-through-associations.test.ts` "update counter caches on destroy
      with indestructible through record" stays green on PG and SQLite with no
      `usesTransaction` opt-out.
