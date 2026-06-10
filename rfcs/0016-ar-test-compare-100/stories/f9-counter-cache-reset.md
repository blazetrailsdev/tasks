---
title: "F-9f — counter_cache reset variants"
status: draft
updated: 2026-06-10
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. `counter_cache_test.rb` has 5 matched-skips around
`reset_counters`: `reset counters with modular association`, `… with modularized
and camelized classnames`, `reset the right counter if two have the same
class_name`, `reset counters for cpk model`, `reset counter of has_many :through
association`, `reset counter works with select declared on association`.

## Acceptance criteria

- [ ] Un-skip the `reset_counters` variants (namespaced/camelized class-name
      resolution, same-class_name disambiguation, CPK, through, select-scoped).
- [ ] `counter_cache_test.rb` reaches 0 matched-skips.
- [ ] Touched test files only.

## Notes

Rails: `activerecord/test/cases/counter_cache_test.rb` + `counter_cache.rb`.
Class-name resolution overlaps the alias_attribute/through gap noted in
[[project_hmt_disable_joins_fixture_parity_blocked]].
