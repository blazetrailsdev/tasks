---
title: "has_one_through build/create on persisted owner with UNLOADED existing join row should load+update, not duplicate"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `has-one-through-build-persisted-owner-existing-row-reconcile`
(PR #4481). That PR converged `build`/`create` of a has_one_through on a
persisted owner that already has a **loaded** join row: the loaded persisted
through record is reconciled via `assignAttributes` + a deferred
`createThroughRecord` (`through_record.update`), matching Rails'
`create_through_record` (has_one_through_association.rb:19-38).

The one remaining divergence, documented in the docstring of
`constructThroughRecordInMemory`
(`packages/activerecord/src/associations/has-one-through-association.ts`): a
persisted owner whose pre-existing join row is **unloaded**. Rails'
`through_proxy.load_target` (has_one_through_association.rb:19) issues the DB
read and reconciles/updates the existing row; trails' synchronous write path
reads only the through proxy's in-memory `target`, so with no loaded target it
`build`s a fresh join record — producing a duplicate join row on save instead
of updating the existing one.

Converging requires letting the through-record construction consult the
persisted join row across an async boundary: either an async `build`/`create`
path, or eagerly loading the through association before constructing (e.g. in
the `create` (`_createRecord`) path, which is already async, and/or deferring
the whole reconcile to `persistReplace` for the `build` case rather than doing
an eager in-memory build).

Rails: `vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb`
(`create_through_record` → `through_proxy.load_target`).

## Acceptance criteria

- [ ] build/create of a has_one_through on a persisted owner with an
      **unloaded** pre-existing join row loads and updates that row rather than
      inserting a duplicate, matching Rails `create_through_record`.
- [ ] Add a test where the owner is re-fetched (join row unloaded) before
      build/create, asserting no duplicate join row and the existing row is
      repointed.
- [ ] No regression in the has_one_through write-side / nil-stale suites or the
      loaded-row reconcile from PR #4481.
