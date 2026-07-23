---
title: "nested-through-sti-reflection-load"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by residual-skip-tail-sweep (RFC 0030). Rails
`associations/nested_through_associations_test.rb`
`test_has_many_through_with_sti_on_nested_through_reflection` loads a 3-level
nested-through chain whose middle reflection is an STI subclass scope:
`specialComments` → `specialCommentsRatings` (`ratings` through
`special_comments`) — see `vendor/rails/activerecord/test/models/post.rb`
(`has_many :special_comments_ratings, through: :special_comments, source:
:ratings`). In trails the direct load of that nested-through association
returns empty (`packages/activerecord/src/associations/nested-through-associations.test.ts`
:658, currently `it.todo` with the note "3-level nested through
(specialComments→specialCommentsRatings→taggings) direct-load returns empty").

The sibling nested-through tests in the same file pass, so the gap is scoped
to STI-typed intermediate reflections in the through-chain resolution
(through-association scope stacking over an STI-scoped middle reflection).

Also listed in `scripts/api-compare/unported-files.ts` (deferred) — remove
that entry when un-skipping.

## Acceptance criteria

- 3-level nested-through chains with an STI-scoped intermediate reflection
  load their records (non-empty, Rails-faithful values).
- Convert the `it.todo` at nested-through-associations.test.ts:658 into a
  passing ported test and drop its unported-files entry.
