---
title: "attribute.test.ts: #not_in Union test calls .in(); converge to Rails not_in(union)"
status: claimed
updated: 2026-07-23
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-23T02:02:32Z"
assignee: "arel-attribute-test-not-in-union-uses-in"
blocked-by: null
closed-reason: null
---

# arel-attribute-test-not-in-union-uses-in

## Context

`packages/arel/src/attributes/attribute.test.ts:654` — the `#not_in` describe's
"can be constructed with a Union" it builds a Union but then calls
`users.get("id").in(union)` and asserts `IN (` SQL. Rails' counterpart
(`vendor/rails/activerecord/test/cases/arel/attributes/attribute_test.rb:958`)
calls `attribute.not_in(union)` and asserts a `Nodes::NotIn` over the Union.
The trails test therefore exercises `#in` under a `#not_in`-suite name and the
NOT IN + Union path is untested. Spotted during PR #5107 review; out of that
story's top-level-its scope.

## Acceptance criteria

- The `#not_in` "can be constructed with a Union" test calls `notIn(union)`
  and asserts NOT IN rendering/node shape per Rails attribute_test.rb:958.
- If the implementation mishandles NotIn-over-Union, converge it to Rails.
- test:compare matched for attributes/attribute_test.rb stays 128.
