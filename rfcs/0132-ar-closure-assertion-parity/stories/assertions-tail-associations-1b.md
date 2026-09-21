---
title: "assertions-tail-associations-1b"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7918
claim: "2026-09-20T22:43:44Z"
assignee: "assertions-tail-associations-1b"
blocked-by: null
closed-reason: null
---

## Context

Remainder of assertions-tail-associations-1 (RFC 0132). inner_join_association_test.rb and
left_outer_join_association_test.rb are at 0; associations/callbacks_test.rb had
"adding macro callbacks", "removing with macro callbacks", "multiple callbacks" ported onto the
canonical Author#postsWithCallbacks / postsWithMultipleCallbacks + `fixtures(["authors","posts"])`
(in their own describe, because the sibling describe relies on empty fixtures).

Still mismatching (re-measured with `pnpm parity:test -- --package activerecord --assertions --missing`):
cascaded_eager_loading_test.rb, associations/callbacks_test.rb (the rest — bespoke makeAuthorWithCallbacks
models should move to canonical Author/Project/Firm associations as above), extension_test.rb,
has_one_through_disable_joins_associations_test.rb, required_test.rb, nested_error_test.rb.
Several rows need `assertQueriesCount` / `assertNoQueries` from testing/query-assertions.ts (Rails assert_queries_count).

## Remaining rows

```text
    associations/cascaded_eager_loading_test.rb › eager association loading grafts stashed associations to correct parent — rails 1 vs trails 2
    associations/cascaded_eager_loading_test.rb › cascaded eager association loading with duplicated includes — rails 3 vs trails 2
    associations/cascaded_eager_loading_test.rb › cascaded eager association loading with twice includes edge cases — rails 3 vs trails 2
    associations/cascaded_eager_loading_test.rb › eager association loading with join for count — rails 2 vs trails 1
    associations/cascaded_eager_loading_test.rb › eager association loading where first level returns nil — rails 2 vs trails 3
    associations/cascaded_eager_loading_test.rb › preloading across has one constrains loaded records — rails 2 vs trails 3
    associations/callbacks_test.rb › has many callbacks halt execution when abort is trown when removing from association — rails 2 vs trails 3
    associations/callbacks_test.rb › has many callbacks with create — rails 1 vs trails 2
    associations/callbacks_test.rb › has and belongs to many before add called before save — rails 4 vs trails 3
    associations/callbacks_test.rb › has and belongs to many does not fire callbacks on clear — rails 4 vs trails 3
    associations/callbacks_test.rb › dont add if before callback raises exception — rails 4 vs trails 1
    associations/extension_test.rb › proxy association after scoped — rails 2 vs trails 5
    associations/has_one_through_disable_joins_associations_test.rb › counting on disable joins through — rails 5 vs trails 6
    associations/has_one_through_disable_joins_associations_test.rb › preload on disable joins through — rails 2 vs trails 4
    associations/has_one_through_disable_joins_associations_test.rb › disable joins through with enum type — rails 5 vs trails 6
    associations/cascaded_eager_loading_test.rb › eager association loading with cascaded two levels — equal rails 4 vs trails 1, length rails 0 vs trails 3
    associations/cascaded_eager_loading_test.rb › eager association loading with cascaded two levels and one level — equal rails 6 vs trails 1, length rails 0 vs trails 5
    associations/cascaded_eager_loading_test.rb › eager association loading with hmt does not table name collide when joining associations — equal rails 2 vs trails 0, length rails 0 vs trails 2  [unmapped: rails:assert_queries_count, trails:assertQueriesCount]
    associations/cascaded_eager_loading_test.rb › eager association loading grafts stashed associations to correct parent — instanceOf rails 0 vs trails 1
    associations/cascaded_eager_loading_test.rb › cascaded eager association loading with duplicated includes — nothingRaised rails 1 vs trails 0
    associations/cascaded_eager_loading_test.rb › cascaded eager association loading with twice includes edge cases — nothingRaised rails 1 vs trails 0
    associations/cascaded_eager_loading_test.rb › eager association loading with join for count — nothingRaised rails 1 vs trails 0  [unmapped: rails:assert_queries_count, trails:assertQueriesCount]
    associations/cascaded_eager_loading_test.rb › eager association loading with nil associations — equal rails 3 vs trails 0, length rails 0 vs trails 3
    associations/cascaded_eager_loading_test.rb › eager association loading with cascaded two levels with two has many associations — equal rails 4 vs trails 1, length rails 0 vs trails 3
    associations/cascaded_eager_loading_test.rb › eager association loading with cascaded two levels and self table reference — equal rails 4 vs trails 2, length rails 0 vs trails 2
    associations/cascaded_eager_loading_test.rb › eager association loading with cascaded two levels with condition — equal rails 2 vs trails 0, length rails 0 vs trails 2
    associations/cascaded_eager_loading_test.rb › eager association loading with cascaded three levels by ping pong — equal rails 4 vs trails 3, length rails 0 vs trails 1  [unmapped: rails:assert_queries_count, trails:assertQueriesCount]
    associations/cascaded_eager_loading_test.rb › eager association loading with has many sti — equal rails 2 vs trails 0, length rails 0 vs trails 2  [unmapped: rails:assert_queries_count, trails:assertQueriesCount]
    associations/cascaded_eager_loading_test.rb › eager association loading with has many sti and subclasses — equal rails 2 vs trails 1, length rails 0 vs trails 2, truthy rails 1 vs trails 0  [unmapped: rails:assert_queries_count, trails:assertQueriesCount]
    associations/cascaded_eager_loading_test.rb › eager association loading where first level returns nil — equal rails 1 vs trails 2  [unmapped: rails:assert_queries_count, trails:assertQueriesCount]
    associations/cascaded_eager_loading_test.rb › eager association loading with missing first record — equal rails 1 vs trails 0, length rails 0 vs trails 1
    associations/cascaded_eager_loading_test.rb › eager association loading with cascaded interdependent one level and two levels — equal rails 6 vs trails 1, length rails 0 vs trails 5
    associations/cascaded_eager_loading_test.rb › preloading across has one constrains loaded records — equal rails 2 vs trails 1, instanceOf rails 0 vs trails 1, length rails 0 vs trails 1
    associations/cascaded_eager_loading_test.rb › preloading across has one through constrains loaded records — equal rails 2 vs trails 1, length rails 0 vs trails 1
    associations/callbacks_test.rb › adding with proc callbacks — equal rails 2 vs trails 0, includes rails 0 vs trails 2
    associations/callbacks_test.rb › removing with proc callbacks — equal rails 2 vs trails 0, includes rails 0 vs trails 2
    associations/callbacks_test.rb › has many callbacks halt execution when abort is trown when adding to association — empty rails 1 vs trails 0, equal rails 0 vs trails 1
    associations/callbacks_test.rb › has many callbacks halt execution when abort is trown when removing from association — equal rails 2 vs trails 3
    associations/callbacks_test.rb › has many callbacks with create — equal rails 1 vs trails 2
    associations/callbacks_test.rb › has many callbacks for save on parent — equal rails 3 vs trails 4, truthy rails 1 vs trails 0
    associations/callbacks_test.rb › has and belongs to many add callback — empty rails 1 vs trails 0, equal rails 2 vs trails 3
    associations/callbacks_test.rb › has and belongs to many before add called before save — equal rails 1 vs trails 3, falsy rails 1 vs trails 0, notNil rails 1 vs trails 0, truthy rails 1 vs trails 0
    associations/callbacks_test.rb › has and belongs to many after add called after save — empty rails 1 vs trails 0, equal rails 3 vs trails 4
    associations/callbacks_test.rb › has and belongs to many remove callback — empty rails 1 vs trails 0, equal rails 2 vs trails 3
    associations/callbacks_test.rb › has and belongs to many does not fire callbacks on clear — empty rails 2 vs trails 0, equal rails 0 vs trails 2, operator rails 0 vs trails 1, truthy rails 2 vs trails 0
    associations/callbacks_test.rb › has and belongs to many callbacks for save on parent — equal rails 3 vs trails 4, truthy rails 1 vs trails 0
    associations/callbacks_test.rb › dont add if before callback raises exception — empty rails 1 vs trails 0, equal rails 0 vs trails 1, excludes rails 3 vs trails 0
    associations/extension_test.rb › proxy association after scoped — equal rails 2 vs trails 4, instanceOf rails 0 vs trails 1
    associations/required_test.rb › belongs_to associations can be optional by default — equal rails 0 vs trails 2, truthy rails 2 vs trails 0
    associations/required_test.rb › required belongs_to associations have presence validated — equal rails 1 vs trails 3, falsy rails 1 vs trails 0, truthy rails 1 vs trails 0
    associations/required_test.rb › belongs_to associations can be required by default — equal rails 1 vs trails 3, falsy rails 1 vs trails 0, truthy rails 1 vs trails 0
    associations/required_test.rb › has_one associations are not required by default — equal rails 0 vs trails 2, truthy rails 2 vs trails 0
    associations/required_test.rb › required has_one associations have presence validated — equal rails 1 vs trails 3, falsy rails 1 vs trails 0, truthy rails 1 vs trails 0
    associations/has_one_through_disable_joins_associations_test.rb › counting on disable joins through — match rails 1 vs trails 2
    associations/has_one_through_disable_joins_associations_test.rb › nil on disable joins through — equal rails 0 vs trails 2  [unmapped: rails:assert_queries_count]
    associations/has_one_through_disable_joins_associations_test.rb › preload on disable joins through — equal rails 0 vs trails 4  [unmapped: rails:assert_no_queries]
    associations/has_one_through_disable_joins_associations_test.rb › disable joins through with enum type — equal rails 2 vs trails 3
    associations/nested_error_test.rb › index in association order — equal rails 6 vs trails 5, instanceOf rails 0 vs trails 1
    associations/nested_error_test.rb › index in nested attributes order — equal rails 6 vs trails 5, instanceOf rails 0 vs trails 1
    associations/nested_error_test.rb › index unaffected by reject_if — equal rails 5 vs trails 4, instanceOf rails 0 vs trails 1
    associations/nested_error_test.rb › no index when singular association — equal rails 6 vs trails 5, instanceOf rails 0 vs trails 1
```

## Acceptance criteria

- Every file above reports 0 count/kind/value mismatches; no test renames; mark file untouched (frozen).
- A converged assertion that fails from a production bug is parked it.skip with BLOCKED: and filed in 0155.
