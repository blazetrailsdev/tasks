---
title: "has_one enum-through-association"
status: in-progress
updated: 2026-07-10
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4828
claim: "2026-07-09T12:09:34Z"
assignee: "d2-has-one-assoc-enum"
blocked-by: null
closed-reason: null
---

## Context

Split from `d2-has-one-remaining-gaps`. has_one enum-through-association cluster
in `packages/activerecord/src/associations/has-one-associations.test.ts`:
`association enum works properly`, `association enum works properly with nested
join`.

Rails: `has_one_associations_test.rb` `test_association_enum_works_properly[_with_nested_join]`.
Needs `SpecialAuthor` has_one `book` + `SpecialBook` with a `status` enum
(vendor/rails/activerecord/test/models/author.rb, book.rb) and enum-aware
joins/where over the has_one.

## Acceptance criteria

- [ ] SpecialAuthor/SpecialBook enum has_one + joins(:book).where(books: {...})
      works.
- [ ] Both tests un-skipped with verbatim Rails names; test:compare delta
      non-negative.
