---
title: "relation/with.test.ts → canonical Post/Comment/Company + fixtures (with_test.rb)"
status: ready
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 350
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of `relation-select-order-cluster` (PR #3093). Faithful Rails port of
the CTE (`with`) file — the heaviest of the cluster.

Convert `relation/with.test.ts` → `relation/with_test.rb`. Today the file rides
an inline `defineSchema({ posts, comments, companies })` with synthetic inline
rows; the describe uses the Rails test names but recomputes expected ids from
the data it just inserted instead of asserting the fixed Rails id sets.

Rails source: `vendor/rails/activerecord/test/cases/relation/with_test.rb`
(`fixtures :comments, :posts, :companies`; canonical `Post`/`Comment`/`Company`).
The test relies on the exact canonical posts fixture ids and their `tags_count` /
`legacy_comments_count` (e.g. `POSTS_WITH_TAGS = [1,2,7,8,9,10,11]`,
`POSTS_WITH_COMMENTS = [1,2,4,5,7]`, `SPECIAL_POSTS = [2]`) plus the canonical
`companies` self-referential `firm_id` tree for `with_recursive`. Port the frozen
id-set constants verbatim and assert via `order(:id).pluck(:id)`.

Exercises CTEs (`with`, `with_recursive`), `from("cte AS posts")`, `pluck`, the
`with_tags_cte` model scope, joins/left_outer_joins on a CTE-backed association
(`commented_posts`), `unscope(:with)`, and arg-validation raises. Port what works
word-for-word; anything unsupported stays `it.skip` + BLOCKED (do not weaken
assertions to pass).

## Acceptance criteria

- [ ] Rides canonical `Post`/`Comment`/`Company` + `posts`/`comments`/`companies`
      fixtures; the frozen id-set constants mirror `with_test.rb` verbatim.
- [ ] Each ported test body matches `with_test.rb` word-for-word; test names
      unchanged; unsupported features kept `it.skip` + BLOCKED note.
- [ ] `pnpm vitest run packages/activerecord/src/relation/with.test.ts` passes;
      0 `require-canonical-schema` errors; file removed from the exclude JSON.
- [ ] `test:compare` delta >= 0 (`with_test.rb` currently 14/16 — must not drop).

## Notes

- **Sequencing**: shares the exclude JSON with the sibling stories — ship one at
  a time off `main`. May exceed 300 LOC even after dropping extras; if so keep it
  to the single `with_test.rb` port and note the size in the PR body. Single PR
  from `main`, draft.
