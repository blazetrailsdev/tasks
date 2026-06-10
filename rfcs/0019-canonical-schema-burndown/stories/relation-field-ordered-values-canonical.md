---
title: "relation/field-ordered-values.test.ts → canonical Post/Book/Author + fixtures (field_ordered_values_test.rb)"
status: in-progress
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 250
priority: 6
pr: 3101
claim: "2026-06-10T21:20:35Z"
assignee: "relation-field-ordered-values-canonical"
blocked-by: null
---

## Context

Carved out of `relation-select-order-cluster` (PR #3093). Faithful Rails port of
the `in_order_of` file.

Convert `relation/field-ordered-values.test.ts` → `field_ordered_values_test.rb`.

Rails source: `vendor/rails/activerecord/test/cases/relation/field_ordered_values_test.rb`
(`fixtures :posts`; canonical `Post` for the id-based tests, canonical `Book` for
the enum/string-column/nil/association tests, `Author` for `with_associations`).
The post tests assert against the fixed canonical posts fixture ids — e.g.
`in_order_of(:id, [3, 4, 1])`; `in_order_of(:id, order, filter: false)` expects
`posts.count == 11`. The book tests exercise the `Book` enum `status`
(proposed/written/published) and the `format` string column, including a `nil`
ordering case. `with_associations` needs
`Book.joins(:author).in_order_of("authors.name", order)`.

## Acceptance criteria

- [ ] Id-based tests ride canonical `Post` + `posts` fixtures; enum/string/nil/
      association tests ride canonical `Book`/`Author` (`Book.destroy_all` /
      `Author.destroy_all` setup mirrored).
- [ ] Each test body matches `field_ordered_values_test.rb` word-for-word; test
      names unchanged; unsupported features (`in_order_of` enum keys,
      `joins(:author)` ordering, `filter: false`) stay `it.skip` + BLOCKED note.
- [ ] `pnpm vitest run packages/activerecord/src/relation/field-ordered-values.test.ts`
      passes; 0 `require-canonical-schema` errors; file removed from the exclude
      JSON.
- [ ] `test:compare` delta >= 0 (`field_ordered_values_test.rb` currently 10/10).

## Notes

- **Sequencing**: shares the exclude JSON with the sibling stories — ship one at
  a time off `main`. Single PR from `main`, draft, <=300 LOC.
