---
title: "Shared assertNotCalled that can watch Preloader.new"
status: in-progress
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8066
claim: "2026-09-24T23:04:12Z"
assignee: "duration-test-env-tz-zero-and-integer-division"
blocked-by: null
closed-reason: null
---

## Context

`has-many-through-associations.test.ts` › "get ids for has many through with conditions should not preload" mirrors `has_many_through_associations_test.rb` `test_get_ids_for_has_many_through_with_conditions_should_not_preload`, which does `assert_not_called(ActiveRecord::Associations::Preloader, :new)`. `activesupport`'s `assertNotCalled` (`packages/activesupport/src/testing/method-call-assertions.ts:67`) is synchronous and cannot spy a constructor, so the test uses a same-file `assertNotCalled` helper that spies `Preloader.prototype.call` instead.

## Acceptance criteria

- An async-capable `assertNotCalled` / `assertCalled` in the shared test helpers that can watch a class's construction (Rails `Class.new`).
- The local helper in `has-many-through-associations.test.ts` is deleted and the test uses the shared one against `Preloader` construction.
