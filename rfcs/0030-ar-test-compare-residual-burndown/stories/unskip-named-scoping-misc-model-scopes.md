---
title: "Un-skip named-scoping misc model scopes (last-cache, newest, oops, without_table)"
status: in-progress
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 200
priority: 30
pr: 3875
claim: "2026-06-22T12:27:58Z"
assignee: "unskip-named-scoping-misc-model-scopes"
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
- `class method in scope` — Rails `reply.rb` `scope :ordered, -> { Reply.order(:id) }`
  references the Reply class directly, escaping the `approved_replies` association's
  `parent_id` constraint so `topics(:first).approved_replies.ordered` returns both
  approved replies (second + fourth). The canonical Reply.ordered chains off the
  relation (`q.order("id")`) and does not escape; trails returns only [second].
  Converge canonical Reply.ordered to reference the class and verify the
  association proxy honors the class-scope escape, then assert the exact records.
- `model class should respond to none` — Rails asserts `Topic.none?` (true only
  when no records exist). trails implements no `isNone` predicate at the
  relation/Querying layers, and `base.ts` delegates `isAny`/`isMany`/`isOne` but
  not `isNone`. Add `Relation#isNone` + `Querying.isNone` + the `base.ts` static
  delegation, then un-skip with a faithful populated/empty body.

Rails source: `vendor/rails/.../scoping/named_scoping_test.rb`
(`test_first_and_last_should_not_use_query_when_results_are_loaded`,
`test_scopes_to_get_newest`, `test_model_class_should_respond_to_extending`,
`test_scoped_are_lazy_loaded_if_table_still_does_not_exist`,
`test_find_all_should_behave_like_select`,
`test_model_class_should_respond_to_none`).

## Acceptance criteria

- [ ] `last()` on a loaded unordered relation reads the loaded records cache (0
      queries), matching `first()`.
- [ ] Add the canonical Comment `newest` and `oops_comments` extension and a
      `without_table` model as Rails defines them; un-skip those cases.
- [ ] Add `Relation#isNone` + `Querying.isNone` + `base.ts` static delegation;
      un-skip `model class should respond to none`.
- [ ] Converge canonical `Reply.ordered` to `-> { Reply.order(:id) }` (class
      reference / association-scope escape); un-skip `class method in scope` with
      the exact `[second, fourth]` assertion.
- [ ] Decide `find all should behave like select` (implement or document
      permanent descope with rationale).

## Definition of done

The implementable cases pass un-skipped; any permanently-descoped case is
documented with rationale.
