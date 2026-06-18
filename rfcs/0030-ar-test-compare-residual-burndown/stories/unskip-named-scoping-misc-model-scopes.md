---
title: "Un-skip named-scoping misc model scopes (last-cache, newest, oops, without_table)"
status: ready
updated: 2026-06-18
rfc: "0030-ar-test-compare-residual-burndown"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`scoping/named-scoping.test.ts` (PR #3584) skips five Rails cases tied to model
scopes / engine details trails lacks:

- `first and last should not use query when results are loaded` — `last()` on an
  already-loaded, unordered relation re-queries instead of reading the loaded
  records cache (Rails asserts 0 queries; `first()` already reads the cache).
- `scopes to get newest` — Rails `comment.rb` `scope :newest, -> { order("id DESC").first }`
  returns a record; trails scopes return relations, so no faithful `newest`.
- `model class should respond to extending` — Rails relies on the
  `oops_comments` scope extension raising `OopsError`; trails has no such
  extension on the canonical Comment.
- `scoped are lazy loaded if table still does not exist` — Rails requires
  `models/without_table`; trails has no `without_table` model.
- `find all should behave like select` — Rails `Array#select` vs `Array#find_all`
  alias equivalence; trails materializes to a plain JS array with only
  `.filter`, so there is no distinct relation method to compare (may stay
  permanently descoped).

Rails source: `vendor/rails/.../scoping/named_scoping_test.rb`
(`test_first_and_last_should_not_use_query_when_results_are_loaded`,
`test_scopes_to_get_newest`, `test_model_class_should_respond_to_extending`,
`test_scoped_are_lazy_loaded_if_table_still_does_not_exist`,
`test_find_all_should_behave_like_select`).

## Acceptance criteria

- [ ] `last()` on a loaded unordered relation reads the loaded records cache (0
      queries), matching `first()`.
- [ ] Add the canonical Comment `newest` and `oops_comments` extension and a
      `without_table` model as Rails defines them; un-skip those cases.
- [ ] Decide `find all should behave like select` (implement or document
      permanent descope with rationale).

## Definition of done

The implementable cases pass un-skipped; any permanently-descoped case is
documented with rationale.
