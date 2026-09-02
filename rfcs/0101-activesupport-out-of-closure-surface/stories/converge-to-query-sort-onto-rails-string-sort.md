---
title: "converge-to-query-sort-onto-rails-string-sort"
status: draft
updated: 2026-09-02
rfc: "0101-activesupport-out-of-closure-surface"
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

`Hash#to_query` (`activesupport/lib/active_support/core_ext/object/to_query.rb:20-27`)
builds the `"key=value"` strings first and then sorts **those strings**:

```ruby
query = filter_map { |key, value| ... value.to_query(...) }
query.sort! unless namespace.to_s.include?("[]")
query.join("&")
```

trails' `toQuery` (`packages/activesupport/src/hash-utils.ts:602`) instead sorts
the **keys** before building any part, and does so unconditionally — it has no
analogue of Rails' `unless namespace.to_s.include?("[]")` guard, which leaves an
array-namespaced sub-hash in insertion order.

The two orderings usually coincide because each built string starts with the
encoded key, but they are not identical: a nested value expands to several
parts whose relative order Rails decides after the fact, and percent-encoding
can reorder two keys that compare differently before and after escaping. The
missing `[]` guard is a plain behavioral gap.

Surfaced while porting `HashExtToParamTests` in PR #7407; predates that PR (the
code already did `Object.keys(obj).sort()`), and none of `hash_ext_test.rb`'s
cases distinguish the two, so it was not in that story's scope.

## Acceptance criteria

- `toQuery` builds its parts first and sorts the built strings, mirroring
  `to_query.rb:20-27` including the `namespace.to_s.include?("[]")` guard.
- `core_ext/object/to_query_test.rb`'s cases covering nested hashes/arrays and
  namespaced queries stay green, and any case that previously could not be
  ported for this reason is unskipped.
- No new `parity:api:calls` / `parity:api:calls:args` rows.
