---
title: "assertValidKeys should raise ArgumentError, not generic Error"
status: claimed
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-04T19:27:07Z"
assignee: "assert-valid-keys-argumenterror-type"
blocked-by: null
closed-reason: null
---

## Context

`Relation::HashMerger#initialize` validates keys with
`hash.assert_valid_keys(*Relation::VALUE_METHODS)`
(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:11`), which
raises Ruby's `ArgumentError` on an unknown key. trails wires this through the
shared `assertValidKeys` helper
(`packages/activesupport/src/hash-utils.ts:181`), which throws a **generic**
`new Error(...)` rather than a named `ArgumentError`. So
`merge({ omg: "lol" })` raises, but not with the Rails-faithful error type —
callers cannot `catch`/narrow on `ArgumentError` the way they can in Rails.

This mirrors the pattern already tracked and fixed by sibling stories
`derive-fk-query-constraints-argumenterror-type` and
`relation-handler-composite-pk-argumenterror-parity`.

Surfaced by PR #4561 (merge-hash-value-methods-key-validation).

## Acceptance criteria

- [ ] `assertValidKeys` (activesupport `hash-utils.ts`) throws the trails
      `ArgumentError` (the same class `merger.ts` uses for the nil/false and
      non-relation cases), not a bare `Error`.
- [ ] Audit existing `assertValidKeys` callers for any that depend on the
      current generic-`Error` message/type; update or confirm no regression.
- [ ] `hash-ext.test.ts` `assert_valid_keys` cases assert the `ArgumentError`
      type.
