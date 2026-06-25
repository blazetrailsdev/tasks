---
title: "instance #update(nil) should raise ArgumentError not TypeError"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during `persistence-test-canonical-wave14` (PR #4124).
`test_update_parameters` (persistence_test.rb:1329) asserts
`assert_raises(ArgumentError) { topic.update(nil) }`. trails instance
`update` (packages/activerecord/src/persistence.ts, `export async function
update`) iterates `Object.entries(attrs)`; with `attrs === null` this throws
a raw `TypeError` ("Cannot convert undefined or null to object"), not an
`ArgumentError`. Same applies to `update!`/`updateBang`.

The ported test (persistence.test.ts) currently asserts only that _some_
error is raised, with an in-code comment documenting the deviation. Converging
the raised class to `ArgumentError` (Rails `assign_attributes` raises
ArgumentError on a non-hash argument) lets the assertion check the class.

## Acceptance criteria

- [ ] `update(nil)` / `update!(nil)` (and `assignAttributes(nil)` if it shares
      the path) raise `ArgumentError`, matching Rails.
- [ ] Tighten the `update parameters` assertion in persistence.test.ts to
      expect `ArgumentError` and drop the deviation comment.
