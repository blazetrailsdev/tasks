---
title: "CollectionProxy/Relation Array delegation: restrict to Rails' curated delegate-to-records list"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3653
claim: "2026-06-19T15:48:26Z"
assignee: "collection-proxy-array-delegation-curated-list"
blocked-by: null
---

## Context

PR #3497 added Array-method delegation to CollectionProxy/Relation
(`delegateArrayMethod` in `packages/activerecord/src/relation/delegation.ts`),
wired into `wrapCollectionProxy` (`associations.ts`) and `wrapWithScopeProxy`
(`relation/delegation.ts`). It delegates **any** `Array.prototype` method to the
loaded records.

Rails is narrower: `activerecord/lib/active_record/relation/delegation.rb`
delegates only a curated list via `delegate ... to: :records`
(`to_xml, encode_with, length, collect, map, each, all?, include?, to_ary,
join, [], &, |, +, -, sample, reverse, rotate, compact, in_groups,
in_groups_of, to_sentence, to_fs, to_formatted_s, as_json, shuffle, split,
index, rindex`). Methods outside that list raise `NoMethodError` (method_missing
falls through to `super`).

Deviation: trails delegates JS Array methods absent from Rails' list (e.g.
`findIndex`, `flat`, `copyWithin`, `fill`, `lastIndexOf`), so calls that would
raise in Rails silently succeed in trails.

## Acceptance criteria

- [x] Decide convergence: restrict `delegateArrayMethod` to the Rails
      `delegate ... to: :records` set (mapped to JS equivalents where one
      exists; Ruby-only entries like `rotate`/`compact`/`sample`/`in_groups`
      have no JS analogue and are dropped), OR ratify the broader surface with a
      documented reason.
- [x] Per fidelity-first, prefer convergence to the curated list unless there is
      a concrete JS reason to keep the broad delegation.
- [x] Preserve current behavior for the curated members and the restored
      `test_has_many_array_methods_called_by_method_missing`.
