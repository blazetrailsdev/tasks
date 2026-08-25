---
title: "join-model-create-through-sets-owner-fk"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3762
claim: "2026-06-21T01:51:26Z"
assignee: "join-model-create-through-sets-owner-fk"
blocked-by: null
---

## Context

Surfaced by the canonical conversion of
`packages/activerecord/src/associations/join-model.test.ts` (wave 3, RFC 0019).
`test_create_through_has_many_with_piggyback` is `it.skip`'d there.

`category.authorsWithSelect.create({ name: "Ernie" })` (a `has_many :through`
create) inserts the join row (`categorizations`) but leaves the owner foreign
key `categorizations.category_id` NULL, so the created record never appears back
through the association. Debug confirmed: created categorization had
`author_id` set but `category_id: null`.

Rails populates the through join's owner key on create-through.

## Acceptance criteria

- [ ] create-through-has_many sets the join record's owner foreign key.
- [ ] Un-skip `create through has many with piggyback` in join-model.test.ts.
