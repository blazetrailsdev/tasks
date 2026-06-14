---
title: "Mixed all_queries/non-all_queries default scopes apply correctly on create+update (un-skip combined test)"
status: draft
updated: 2026-06-14
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up surfaced while implementing
`apply-all-queries-default-scope-on-reload-and-update-columns` (PR #3259). That
PR wired `all_queries` default scopes into `reload`/`update_columns` and the
class-level `_updateRecord` constraint path, but left one Rails test skipped:

- `packages/activerecord/src/scoping/default-scoping.test.ts` →
  `it.skip("combined default scope without and with all queries works")`
  (Rails: `default_scoping_test.rb`
  `test_combined_default_scope_without_and_with_all_queries_works`).

Model:
`DeveloperWithIncludedMentorDefaultScopeNotAllQueriesAndDefaultScopeFirmWithAllQueries`
(mentor scope NOT all_queries + firm scope all_queries).

The `update` half (update SQL carries `firm_id` but not `mentor_id`) should
already work via `applyDefaultAndGlobalConstraints` + `buildDefaultConstraint`.
The blocker is the **create** half: the test asserts the INSERT carries both
`mentor_id` and `firm_id`, i.e. default-scope `where(...)` attribute
propagation onto new records. That propagation is unimplemented — see the
sibling skips in the same file: `it.skip("default scope attribute")` and
`it.skip("create attribute overwrites default values")`. So this story likely
depends on implementing default-scope `where` → attribute seeding on
build/create first.

## Acceptance criteria

- Un-skip and pass `combined default scope without and with all queries works`
  without renaming it.
- Default-scope `where` conditions from BOTH all_queries and non-all_queries
  scopes are seeded as attributes on `new`/`create` (so the INSERT carries
  `mentor_id` and `firm_id`).
- `update` on the mixed-scope model applies only the all_queries (`firm_id`)
  constraint, not `mentor_id` (already covered by the merged PR — add a
  regression assertion if not).
- If default-scope attribute propagation on create is split out as its own
  story, register it and link via `blocked-by`.
