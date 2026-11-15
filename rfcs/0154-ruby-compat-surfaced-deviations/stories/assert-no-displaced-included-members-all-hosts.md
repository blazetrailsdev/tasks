---
title: "assert-no-displaced-included-members-all-hosts"
status: draft
updated: 2026-11-15
rfc: "0154-ruby-compat-surfaced-deviations"
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

# Assert no unlisted displaced include() members across every framework include() host

## Context

trails#10140 made `rbModAppendFeatures` (`packages/ruby-compat/lib/include.ts`) record every class-body
member that keeps an `include()`d module member from being installed; `displacedIncludedMembers(klass)`
reports them and `klass[shadowsIncluded]` opts out intentional Ruby-semantics overrides. Only
`ActiveRecord::Base` is asserted (`packages/activerecord/test/displaced-included-members.trails.test.ts`).
Every other framework class built with `include()` (ActiveModel::Model, ActionController::Base,
ActionView::Base, AbstractAdapter and the adapters, Relation, ...) is recorded but unchecked, so a
displaced port there is still silent.

## Acceptance criteria

- [ ] A test per package (or one sweep) asserts `displacedIncludedMembers(K)` is empty for each framework class `K` that calls `include()`.
- [ ] Every existing collision found is either converged (the displaced port installed, per its Rails `file:line`) or opted out under `shadowsIncluded` because the class body is the Rails override / inlined `super` chain.
- [ ] No opt-out for a collision that is a displaced port; those become convergence fixes or filed stories.
