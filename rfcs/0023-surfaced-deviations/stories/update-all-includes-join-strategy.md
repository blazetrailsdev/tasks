---
title: "update-all-includes-join-strategy"
status: draft
updated: 2026-08-21
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
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

`packages/activerecord/src/relation/update-all.test.ts` ("update all with
includes") carried a `TRACKED DEVIATION` comment, deleted by the
`no-freeform-comments` sweep over `relation/` (a comment recording deferred work
becomes a story, not a better comment):

> includes + where referencing included table should switch to JOIN strategy.
> Trails `includes` does a separate SELECT so toys.name is not available in the
> WHERE clause.

Rails switches an `includes` to an eager JOIN whenever the relation references
an included table — `references_eager_loaded_tables?` /
`eager_loading?` in
`vendor/rails/activerecord/lib/active_record/relation.rb` (see
`activerecord/lib/active_record/relation/finder_methods.rb` `construct_join_dependency`),
so `Pet.includes(:toys).where(toys: { name: "Bone" }).update_all(...)` compiles
one joined statement. trails' `includes` runs a separate preload SELECT, so the
`toys.name` predicate is not available to the `UPDATE`.

trails: `packages/activerecord/src/relation/update-all.test.ts:137`
(`it("update all with includes")`).

## Acceptance criteria

- [ ] `includes` + a `where` referencing the included table switches to the
      eager-JOIN strategy, matching Rails' `eager_loading?` decision.
- [ ] `UpdateAllTest#update all with includes` passes on all adapter lanes
      without the deviation.
