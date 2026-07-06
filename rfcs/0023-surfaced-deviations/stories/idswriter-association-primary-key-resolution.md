---
title: "idswriter-association-primary-key-resolution"
status: claimed
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-06T15:52:59Z"
assignee: "idswriter-association-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#idsWriter` (`packages/activerecord/src/associations/collection-association.ts:132`)
resolves the target key for the not-found lookup + message as the target
model's `primaryKey` (typically `'id'`). Rails' `ids_writer`
(`activerecord/lib/active_record/associations/collection_association.rb:60-84`)
uses `reflection.association_primary_key`, which for a through/custom-PK
association is the association's own key (e.g. `Category.primary_key == "name"`
for `Author has_many :essay_categories, through: :essays`).

Symptom: `author.essay_category_ids = ["General", "Unknown"]` raises
`Couldn't find all Categories with 'id': (General, Unknown) (found 0 results, …)`
instead of Rails'
`Couldn't find all Categories with 'name': (General, Unknown) (found 1 results, …). Couldn't find Category with name Unknown.`
— trails keys the lookup by `id`, so it finds 0 (both "General" and "Unknown"
fail to match an id) and reports the wrong key.

Surfaced by the loosened assertion in
`has-many-through-associations.test.ts` "collection singular ids through setter
raises exception when invalid ids set" (PR #4665). The simple-PK developers case
in the same file already asserts the exact message.

## Acceptance criteria

- `idsWriter` resolves the lookup key + not-found message key via the
  association's primary key (`association_primary_key`), not the target model's
  `id`, so a custom-PK association (`Category` PK `name`) finds the real records
  and emits `'name'` in the message.
- Tighten the through-setter test to assert the exact Rails message
  (`… with 'name': (General, Unknown) (found 1 results, but was looking for 2). Couldn't find Category with name Unknown.`).
- Mirror Rails `has_many_through_associations_test.rb:1060`.
