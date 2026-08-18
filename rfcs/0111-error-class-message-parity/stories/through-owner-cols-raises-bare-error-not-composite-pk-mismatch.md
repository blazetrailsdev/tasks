---
title: "_throughOwnerCols raises a bare Error instead of CompositePrimaryKeyMismatchError"
status: draft
updated: 2026-08-07
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
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

Surfaced while building `converge-composite-through-collection-proxy-owner-cols`
(PR #6201).

`CollectionProxy#_throughOwnerCols`
(`packages/activerecord/src/associations/collection-proxy.ts:2120`) resolves the
owner FK/PK column pair for a through association and, on an arity mismatch,
raises a bespoke error with a bespoke message:

```ts
throw new Error(
  `Composite primaryKey/foreignKey mismatch on through "${this._assocName}": ${pkCols.length} pk vs ${fkCols.length} fk`,
);
```

Rails has no such raise site. Its single check is
`AssociationReflection#check_validity!`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:618-627`), which
raises `ActiveRecord::CompositePrimaryKeyMismatchError` — a real error class
with a Rails-authored message — and only from `check_validity!`. The trails
error is a bare `Error`, so no caller can rescue it by class, and the message
matches nothing a Rails dev would grep for.

PR #6201 removed the _reason_ this fired in practice (the mismatch came from
`ThroughReflection#activeRecordPrimaryKey` delegating to the delegate rather
than the source reflection, `reflection.rb:973-974`), but the guard and its
bespoke raise remain.

Note `has-many-association.ts` already routes its equivalent arity failures
through `routeThroughCheckValidity(ctor, assocName)` + `CompositePrimaryKeyMismatchError`
(`packages/activerecord/src/associations/has-many-association.ts:665-681`), so
the converged shape already exists in the codebase — this call site just does
not use it.

## Converged shape

Delete the bespoke `throw new Error(...)`. Either let the mismatch route
through `routeThroughCheckValidity` / `CompositePrimaryKeyMismatchError` the way
the sibling loader does, or — preferably — drop the arity guard entirely, since
Rails' `check_validity!` is the single raise site and `_throughOwnerCols` is not
one of the places Rails validates.

## Acceptance criteria

- [ ] No bare `Error` with a "Composite primaryKey/foreignKey mismatch" message
      remains in `collection-proxy.ts`.
- [ ] Any surviving arity failure raises `CompositePrimaryKeyMismatchError`
      from the canonical `checkValidityBang` route, with Rails' message.
- [ ] `disable-joins-composite-nested.test.ts` and
      `disable-joins-composite-key.test.ts` stay green on all lanes.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
