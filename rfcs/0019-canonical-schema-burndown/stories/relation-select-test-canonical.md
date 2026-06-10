---
title: "relation/select.test.ts → canonical Post + posts/comments fixtures (select_test.rb)"
status: claimed
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 300
priority: 6
pr: null
claim: "2026-06-10T22:37:36Z"
assignee: "relation-select-test-canonical"
blocked-by: null
---

## Context

Carved out of `relation-select-order-cluster` (PR #3093 shipped the two
mechanically-clean files: deleted the redundant `relation/annotations.test.ts`
and `eslint-disable`d the synthetic `select-star-join-collision.test.ts`). This
story is the faithful Rails port of the remaining select file.

Convert `relation/select.test.ts` → `relation/select_test.rb`. Today the file
rides an inline `defineSchema({ posts, items, developers, orders, users })` with
synthetic 2-row data and bare local `class Post`/`Developer` models; the
`SelectTest` describe shadows the Rails test names but not the bodies. The
non-Rails extra describes (`select block form`, `regroup()`, `distinct count`,
`having hash form`, `distinctOn`, `Relation Select (Rails-guided)`,
`Group/Having (Rails-guided)`) are shallow SQL-string assertions with no Rails
counterpart — drop them per the fidelity-first guidance.

Rails source: `vendor/rails/activerecord/test/cases/relation/select_test.rb`
(`fixtures :posts, :comments`; canonical `Post`/`Comment` models; the
`"Welcome to the weblog"` welcome fixture drives the `UPPER(title)` assertions).

## Acceptance criteria

- [ ] `SelectTest` rides canonical `Post`/`Comment` + `posts`/`comments`
      fixtures (`useHandlerFixtures` + `TEST_SCHEMA`), like `src/annotate.test.ts`.
- [ ] Each ported test body matches `select_test.rb` word-for-word; test names
      unchanged. Unsupported features (`joins` + per-join table aliasing, `merge`
      across models, `eager_load`/`includes` attribute-key inspection,
      `default_scope` select) stay `it.skip` with a BLOCKED note.
- [ ] Non-Rails extra describes dropped (no Rails counterpart).
- [ ] `pnpm vitest run packages/activerecord/src/relation/select.test.ts`
      passes; 0 `require-canonical-schema` errors; file removed from the exclude
      JSON.
- [ ] `test:compare` delta >= 0 (`select_test.rb` must not drop below 18/26).

## Notes

- **Sequencing**: every file in the parent story edits the shared
  `eslint/require-canonical-schema-exclude.json`, so this PR conflicts with the
  three sibling stories. Ship one at a time off `main`, each after the prior
  merges. Single PR from `main`, draft, <=300 LOC.
