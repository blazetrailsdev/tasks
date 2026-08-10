---
title: "create#{name} does not port replace's leading load_target, so an unloaded displaced row stays attached"
status: done
updated: 2026-07-25
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5324
claim: "2026-07-25T21:42:53Z"
assignee: "has-one-create-record-unloaded-target-not-removed"
blocked-by: null
closed-reason: null
---

## Context

Rails' `HasOneAssociation#replace` opens with `load_target`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-69`),
so `remove_target!` detaches whatever the load surfaced — including a row that
was only in the DB, never cached.

`HasOneAssociation#_createRecord`
(`packages/activerecord/src/associations/has-one-association.ts`, the
`create#{name}` path) does not port that leading load. It captures
`const displaced = this.loaded ? this.target : null` and hands that to
`detachDisplacedTarget`, so an **unloaded** target is never removed: no query
runs to discover it, and RFC 0068 retired the `_removeDisplacedFromDb` flag
that used to pick it up at the owner's next `save()`. The pre-existing row
keeps its foreign key and stays attached.

Before RFC 0068 this case was covered (badly) by the deferral flag; the
retirement removed the stand-in without porting the real `load_target`.
PR #5298 documented the gap in a comment at that site but deliberately did not
change behavior (docs-only story).

Distinct from the existing draft
`has-one-direct-association-build-leaves-displaced-row-attached`, which is
about a **loaded** target reached via `SingularAssociation#build` /
`setNewRecord`. This one is the unloaded target on the `create#{name}` /
`_createRecord` path.

## Acceptance criteria

- [ ] `_createRecord` issues Rails' leading `load_target` (it is already
      `async`, so the await is available) before capturing the displaced
      target, so an unloaded persisted child is surfaced and removed.
- [ ] Regression test: `firm.createAccount(...)` on a firm whose existing
      `account` row was never loaded nullifies (or destroys, per `:dependent`)
      the old row. Must fail on baseline.
- [ ] The `has_one` / `has_one_through` suites stay green and `parity:test`
      delta is non-negative.
- [ ] Remove the "until that load is ported" caveat from the `_createRecord`
      comment once it is ported.
