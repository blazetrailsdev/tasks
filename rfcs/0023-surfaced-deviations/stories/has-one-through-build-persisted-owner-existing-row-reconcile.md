---
title: "has_one_through build/create on persisted owner with existing join row should load+update, not duplicate"
status: done
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4481
claim: "2026-07-03T13:45:54Z"
assignee: "has-one-through-build-persisted-owner-existing-row-reconcile"
blocked-by: null
closed-reason: null
---

## Context

Documented divergence introduced by RFC 0023
`hasone-through-write-side-and-nil-stale-gaps` (PR #4469),
`constructThroughRecordInMemory` in
`packages/activerecord/src/associations/has-one-through-association.ts`.

Rails' `create_through_record` (has_one_through_association.rb:19-38) calls
`through_proxy.load_target` first: when a persisted owner already has a join
row, `build`/`create` on the has_one_through loads that existing row and runs
`assign_attributes`/`update` on it. trails' `constructThroughRecordInMemory`
only reads the through proxy's in-memory target (a synchronous write path
cannot issue the async DB read that `load_target` would), so for a persisted
owner with an unloaded pre-existing join row it builds a brand-new join record
instead of reconciling with the existing one.

This shape is unusual (building a through for an owner that already has one)
and is not exercised by Rails' suite, so it was accepted and documented rather
than fixed in PR #4469. Converging it requires making the through-record
construction able to consult the persisted join row (e.g. an async
build/create path, or eagerly loading the through before constructing).

Rails: `vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb`
(`create_through_record`).

## Acceptance criteria

- [ ] build/create of a has_one_through on a persisted owner that already has a
      (possibly unloaded) join row loads and updates that row rather than
      building a duplicate, matching Rails `create_through_record`.
- [ ] Add a test mirroring the Rails semantics (owner already has a through
      record, then build/create the has_one_through target).
- [ ] No regression in has_one_through write-side / nil-stale suites.
