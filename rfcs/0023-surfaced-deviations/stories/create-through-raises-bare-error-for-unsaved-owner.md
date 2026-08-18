---
title: "Raise RecordNotSaved, not a bare Error, for the unsaved owner in _createThrough"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: _createThrough and _ensurePersistedOwnerForCreate no longer exist; collection-association.ts:498 (and has-one-association.ts:395) now throw RecordNotSaved('You cannot call create unless the parent is saved', this.owner), matching Rails' raise class and owner argument."
---

## Context

`CollectionProxy#_createThrough` (`packages/activerecord/src/associations/collection-proxy.ts:1583`)
raises a bare `Error` with Rails' persisted-owner message:

```ts
if (this._record.isNewRecord()) {
  throw new Error(`You cannot call create unless the parent is saved`);
}
```

Rails raises `ActiveRecord::RecordNotSaved.new("You cannot call create unless
the parent is saved", owner)` — with the owner as the `record` payload — from
`CollectionAssociation#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:355-357`).
A caller rescuing `RecordNotSaved`, or reading `error.record`, misses this one.

Found while landing #6423 (drop-duplicate-persisted-owner-guard-on-proxy-create),
which narrowed the proxy's `_ensurePersistedOwnerForCreate` to the through arm.
That guard fires first today, so this copy is unreachable from
`create`/`createBang` — but it is a third copy of a guard Rails has once, with
the wrong error class, and it becomes reachable the moment the earlier guard
goes away.

## Converged shape

Delete the bare-`Error` raise. Once `_createThrough` routes through
`CollectionAssociation#_createRecord` (see
`route-through-create-via-create-record`), the guard exists only at Rails' site
and raises `RecordNotSaved` with the owner payload. If that routing has not
landed, at minimum raise `RecordNotSaved(msg, this._record)` here so the class
and payload match.

## Acceptance criteria

- No call path raises a bare `Error` for the persisted-owner message.
- Regression coverage asserts the error class and `error.record` on the through
  arm, not just the message.
