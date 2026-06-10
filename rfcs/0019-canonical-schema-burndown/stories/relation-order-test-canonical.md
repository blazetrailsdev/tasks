---
title: "relation/order.test.ts → canonical Book/Author + fixtures (order_test.rb)"
status: in-progress
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 250
priority: 6
pr: 3102
claim: "2026-06-10T22:15:35Z"
assignee: "relation-order-test-canonical"
blocked-by: null
---

## Context

Carved out of `relation-select-order-cluster` (PR #3093). Faithful Rails port of
the order file.

Convert `relation/order.test.ts` → `relation/order_test.rb`. Today the file rides
an inline `defineSchema({ posts: { title, score, name, price } })` (non-canonical
columns) with bare local `class Post` models, plus a TS-invented `hash syntax`
describe block that has no Rails counterpart — drop it.

Rails source: `vendor/rails/activerecord/test/cases/relation/order_test.rb`
(`fixtures :authors, :author_addresses`; canonical `Book` + `Author`; `setup`
does `Book.delete_all`; the four tests `order_asc`, `order_desc`,
`order_with_association`, `order_with_association_alias` build
`Book.create!(name:, author: authors(:david/:mary))` and assert ordering). The
association tests use `includes(:author).order(authors: { name: :asc })` — if
includes+order-by-included-table isn't supported, keep those `it.skip` + BLOCKED.

## Acceptance criteria

- [ ] Rides canonical `Book`/`Author` + `authors`/`author_addresses` fixtures.
- [ ] `order_asc` / `order_desc` ported word-for-word (string, symbol,
      `books.name`, arel-table, hash forms); test names unchanged.
- [ ] `order_with_association` / `order_with_association_alias`: ported if
      includes+order-by-included-table works, else `it.skip` + BLOCKED note.
- [ ] TS-invented `hash syntax` describe dropped.
- [ ] `pnpm vitest run packages/activerecord/src/relation/order.test.ts` passes;
      0 `require-canonical-schema` errors; file removed from the exclude JSON.
- [ ] `test:compare` delta >= 0 (`order_test.rb` currently 4/4 — must stay 4/4).

## Notes

- **Sequencing**: shares the exclude JSON with the sibling stories — ship one at
  a time off `main`. Single PR from `main`, draft, <=300 LOC.
