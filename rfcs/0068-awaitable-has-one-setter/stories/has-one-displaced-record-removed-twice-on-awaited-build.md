---
title: "has-one-displaced-record-removed-twice-on-awaited-build"
status: draft
updated: 2026-07-20
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The awaitable `build#{Name}` / `create#{Name}` accessors remove the displaced
`has_one` target inline via `detachDisplacedTarget`
(`packages/activerecord/src/associations/builder/has-one.ts:78-80,91-93`), but
`setNewRecord` _also_ queues that same record on `_displacedRecords`
(`packages/activerecord/src/associations/has-one-association.ts`), so the
owner's `autosaveHasOne` drain re-runs `remove_target!` against a record that
has already been removed.

Rails runs `remove_target!` exactly once — `set_new_record` ->
`replace(record, false)`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:68-69,91-92`).

Measured on `main` (byte-identical to PR #4983, which did not touch either
path — verified by baselining both files against `main`):

- `dependent: destroy` — queued=1, record already `destroyed`. The second
  destroy is absorbed by the `target.isPersisted()` guard in
  `removeTargetBang` (`has-one-association.ts:647`), so no frozen-record
  error is raised.
- `dependent: delete` — queued=1, row already gone. `removeTargetBang`'s
  delete branch (`:636-638`) has **no** `isPersisted()` guard, so a redundant
  `DELETE` is issued that affects 0 rows.

So this is latent, not user-visible: wasted DB round-trips on every awaited
`build`/`create` over a loaded target, not a crash. Raised by Codex review on
PR #4983; confirmed pre-existing there and deliberately left out of scope.

The queue itself must stay — it is load-bearing for the _synchronous_
`assoc.build()` path that nested attributes uses
(`packages/activerecord/src/nested-attributes.ts:772`), which never reaches
the awaitable accessors. See the regression guard
`has-one-sync-build-displacement.trails.test.ts` added in #4983.

## Acceptance criteria

- [ ] An awaited `build#{Name}` / `create#{Name}` over a loaded, persisted
      displaced target issues exactly ONE removal (assert via SQL/spy count,
      not just end state — the end state is already correct).
- [ ] The synchronous `assoc.build()` / nested-attributes path still removes
      the displaced row exactly once;
      `has-one-sync-build-displacement.trails.test.ts` stays green.
- [ ] Likely shape: have the accessor skip the enqueue (or have
      `detachDisplacedTarget` dequeue what it removed) rather than dropping
      either mechanism.
- [ ] `has_one` / autosave / nested-attributes suites green.
