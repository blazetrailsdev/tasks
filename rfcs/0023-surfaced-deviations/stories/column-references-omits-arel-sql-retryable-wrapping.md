---
title: "column_references returns bare strings, not Arel.sql(ref, retryable: true)"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: query-methods.ts:2463 columnReferences now returns Nodes.SqlLiteral[] and ends in refs.map((ref) => Arel.sql(ref, { retryable: true })) at :2511, matching query_methods.rb:2146's filter_map { Arel.sql(ref, retryable: true) }; the retryable marking is also carried at :2867 and :2913."
---

## Context

Surfaced while converging `order!`/`reorder!` onto `preprocessOrderArgs` (PR #5937).

Rails' `column_references` ends by wrapping every extracted table reference in a
retryable Arel literal:

```ruby
end.filter_map { |ref| Arel.sql(ref, retryable: true) if ref }
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2146`)

trails' `columnReferences`
(`packages/activerecord/src/relation/query-methods.ts`) returns bare strings and
`preprocessOrderArgs` unions them straight into `_referencesValues`. The
`retryable: true` marking is what lets Rails' query-retry machinery know the
reference is safe to replay; dropping it means `references_values` holds a
different value type than Rails'.

This is pre-existing (not introduced by #5937) and currently benign because
nothing downstream inspects the marking, but it is a real representation
divergence in a value that is part of the public `references_values` surface.

## Acceptance criteria

- [ ] `columnReferences` returns `Arel.sql(ref, retryable: true)`-equivalent
      nodes, matching Rails' `filter_map`, rather than bare strings.
- [ ] `_referencesValues` consumers (eager-load promotion in
      `preprocessOrderArgs`, `referencesBang`, and the `references_values`
      reader) handle the node form.
- [ ] Existing order/eager-load promotion behavior is unchanged — the
      `includes(:author).order("authors.name")` promotion still fires.
- [ ] No regression in the relation/finder/associations suites.
