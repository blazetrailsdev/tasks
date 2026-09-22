---
title: "relation-responds-to-exists-unlike-rails"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7886 converged `relation/delegation_test.rb` "not respond to arel method"
(`vendor/rails/activerecord/test/cases/relation/delegation_test.rb:28-30`): Rails asserts
`assert_not_respond_to target, :exists`. trails' `Relation` does define `exists`, so the port
asserts `"project"` instead (`packages/activerecord/src/relation/delegation.test.ts`, "not respond to arel method").

## Acceptance criteria

- Establish why `Relation.prototype` answers `exists` where Rails' relation does not (Rails' predicate is `exists?`; check the trails spelling in `relation/finder-methods.ts`).
- Converge so the test can assert `assertNotRespondTo(target, "exists")` as Rails does.
