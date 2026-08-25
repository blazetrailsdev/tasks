---
title: "Investigate belongsTo accessor returning null despite valid FK"
status: done
updated: 2026-06-04
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Satisfied on origin/main.**
>
> Root cause: the sync `record.author` reader
> (`packages/activerecord/src/associations/singular-association.ts`) mirrors
> Rails' `SingularAssociation#reader` (Rails:
> `activerecord/lib/active_record/associations/singular_association.rb`) — it
> returns `nil`/`null` for unloaded associations by design; `await null` is
> null.
>
> Fix: `record.loadBelongsTo("author")` (the explicit async accessor at
> `packages/activerecord/src/associations/instance-methods.ts:134`) calls the
> standalone `loadBelongsTo` (Rails:
> `activerecord/lib/active_record/associations/belongs_to_association.rb` —
> `find_target`/`scope.take`), then calls `setTarget` so subsequent sync reads
> return the loaded record. An inline-model fallback path at
> `packages/activerecord/src/associations.ts:956–968` handles cases where no
> reflection is registered.
>
> Regression tests: "natural assignment" at
> `packages/activerecord/src/associations/belongs-to-associations.test.ts:270`
> and "dont find target when foreign key is null" at `:449`.

## Context

In minimal inline-model + handler-suite tests, `await book.author === null`
despite a valid `author_id`. Join SQL and ordering are correct — only the
accessor is broken.

Rails source: `activerecord/lib/active_record/associations/singular_association.rb`
(`reader`), `activerecord/lib/active_record/associations/belongs_to_association.rb`
(`find_target`).

## Acceptance criteria

- [x] Root cause of the null belongsTo accessor identified
- [x] Accessor returns the associated record for a valid FK in inline-model setups
- [x] Regression test

## Notes

From the relation gap plan (belongsTo accessor bug), ready now.
