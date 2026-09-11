---
title: "fixture-cpk-reviews-association-label-composite-fk"
status: claimed
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-11T13:23:00Z"
assignee: "duplicate-test-paths-never-credit-past-the-first"
blocked-by: null
closed-reason: null
---

## Context

Rails' `vendor/rails/activerecord/test/fixtures/cpk_reviews.yml` names the
book by association label (`book: cpk_book_with_generated_pk`), and
`TableRow#resolve_sti_reflections` expands it through
`FixtureSet.composite_identify(value, fk_name)` over the `[author_id, number]`
foreign key (`activerecord/lib/active_record/fixture_set/table_row.rb:166-172`).

trails' `packages/activerecord/src/test-helpers/fixtures/cpk-reviews.ts`
instead spells it as per-column `ref("cpk_books", ...)` values on `author_id`
/ `number`, which resolve `number` via `resolveCompositeRefColumn`
(`fixtures.ts:170`) to the wrong slot. Result: `review.book` does not match the
book, so two `CompositePkFixturesTest` cases (`fixtures_test.rb:1782,1790`) are
excluded in `scripts/parity/unported-files/unscoped.ts`.

## Acceptance criteria

- [ ] `cpk-reviews.ts` mirrors `cpk_reviews.yml` (association-label `book:`),
      and fixture row building expands a composite-FK belongs_to label through
      `compositeIdentify` like `table_row.rb:166-172`.
- [ ] "resolves associations using composite primary keys" and "... with
      partially filled values" are ported in `fixtures.test.ts` and their
      exclusion row is deleted.
