---
title: "coerce-to-records-through-branch-scans-instead-of-finding"
status: draft
updated: 2026-09-07
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
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

`CollectionAssociation#coerceToRecords`
(`packages/activerecord/src/associations/collection-association.ts:622-643`)
splits on `this.reflection.options.through`: the non-through arm delegates to
`this.find(...ids)`, while the through arm loads the target and scans it by
stringified primary key.

Rails has no such split. `delete_or_destroy`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:386`)
is one line — `records = find(records) if records.first.is_a?(Integer)` — and
`CollectionAssociation#find` (`collection_association.rb:280-284`) is not
overridden per association type, so a through association resolves ids through
the same scoped query every other collection does.

The scan is a trails work-around: the inline note on the branch says trails'
`scope()`-based `find` cannot query across the join. PR #7589 converged the
branch's error class onto `RecordNotFound` via
`raiseRecordNotFoundExceptionBang` (`collection_association.rb:108`) but left
the scan-vs-query structure alone, because swapping the error type and removing
an invented branch are separate decisions. Flagged in review on that PR.

## Converged shape

`coerceToRecords` has no `through` branch: both arms route through
`this.find(...ids)`, which means fixing the underlying gap — a through
association's `scope()` producing a relation that can resolve ids across the
join.

## Acceptance criteria

- [ ] `coerceToRecords` has one arm, matching `collection_association.rb:386`.
- [ ] `things.delete(<missing id>)` on a `has_many :through` still raises
      `RecordNotFound` with the model name, primary key and id — the
      regression test added by #7589
      (`collection-association-through-delete-not-found.trails.test.ts`) keeps
      passing unchanged.
- [ ] `has-many-through-associations.test.ts` green on SQLite, PostgreSQL and
      MySQL/MariaDB.
