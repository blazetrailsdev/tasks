---
title: "hmt-unskip-polymorphic-source"
status: claimed
updated: 2026-07-03
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-03T16:09:51Z"
assignee: "hmt-unskip-polymorphic-source"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged in PR #4224. Three tests for polymorphic-source HMT associations remain skipped:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped tests:

- `has many through polymorphic with rewhere` (line 1614) — `TaggedPost.has_many :tags, through: :taggings` where `taggings` is polymorphic (`taggable_type`/`taggable_id`); `.rewhere` overrides a condition on the scoped HMT
- `preloading empty through with polymorphic source association` (line 1851) — preloading a HMT when the through is a polymorphic `belongs_to` and the target set is empty
- `has many through with polymorphic source` (line 1882) — basic HMT through a polymorphic source association; `pet.persons` through `pet.owners` where owner is polymorphic

Rails source: `activerecord/lib/active_record/associations/has_many_through_association.rb`, `association_scope.rb` — polymorphic type condition wiring.

Note: `_buildThroughScope` in `collection-proxy.ts` currently guards against polymorphic source via try/catch on `associationPrimaryKey`; the source-wiring for the polymorphic case was deferred from PR #4224.

## Acceptance criteria

- [ ] Un-skip and pass all three tests under SQLite, PG, and MariaDB
- [ ] HMT through a polymorphic `belongs_to` generates correct SQL (`taggable_type = 'Post' AND taggable_id = ?`)
- [ ] Preloading empty HMT-through-polymorphic does not error or produce wrong counts
- [ ] `rewhere` on a polymorphic-source HMT scope replaces the correct condition
- [ ] No production regressions in `has-many-through-associations.test.ts`
