---
title: "disable-joins-first-answers-from-loaded-target"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

`vendor/rails/activerecord/test/cases/associations/has_many_through_disable_joins_associations_test.rb:66-74`
(fetching on disable joins through, plain and custom foreign key) asserts
`assert_queries_count(2) { @author.no_joins_comments.first.id }`.

trails runs 0 queries: `first` on the disable-joins collection is answered from a
loaded target instead of querying through
`packages/activerecord/src/associations/disable-joins-association-scope.ts`
(Rails: `disable_joins_association_scope.rb:6-16`, `scope`).

Two `it.skip` tests in `has-many-through-disable-joins-associations.test.ts` point at this story.

## Acceptance criteria

- `no_joins_*.first` on a fresh association issues the two Rails queries.
- The two skipped tests are un-skipped and pass.
