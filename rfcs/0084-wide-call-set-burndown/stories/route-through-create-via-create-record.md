---
title: "Route CollectionProxy through-create through _createRecord instead of insertRecord"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6464
claim: "2026-08-13T14:06:37Z"
assignee: "extra-surface-scores-overridden-ruby-files"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#_pushThrough`'s `skipCallbacks` arm
(`packages/activerecord/src/associations/collection-proxy.ts:2170-2190`) is the
through-collection `create!` path. It hand-rolls Rails'
`CollectionAssociation#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:354-372`)
as `transaction { addToTarget(record, { skipCallbacks: true }) { insertRecord(record, true, true) } }`
— calling `insertRecord` directly instead of `_createRecord`.

Since #6407 moved the in-memory counter bump out of
`HasManyAssociation#insert_record` into `#concat_records` / `#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_association.rb:139-149`,
the Rails shape), this arm no longer bumps the counter — Rails reaches the bump
through `_create_record`. It also drops the `raise ActiveRecord::Rollback
unless result` guard: `insert_record`'s return value is discarded.

## Converged shape

Route this arm through `_createRecord` (see the sibling story
`port-collection-association-create-record`, which ports it) rather than
calling `insertRecord`, so the counter bump, the `Rollback unless result`
guard, and the `@_was_loaded` block all come from one Rails-shaped body.

## Acceptance criteria

1. `_pushThrough`'s `skipCallbacks` arm calls the ported
   `_createRecord` (or the through override of it) instead of `insertRecord`.
2. A failed non-raising insert rolls the transaction back, as
   collection_association.rb:368 does.
3. Counter caches on has_many :through creates move in memory again.
4. has-many-through and counter-cache suites stay green.
