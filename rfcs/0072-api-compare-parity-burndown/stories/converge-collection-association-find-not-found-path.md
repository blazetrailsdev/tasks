---
title: "converge-collection-association-find-not-found-path"
status: closed
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5880
claim: null
assignee: null
blocked-by: null
closed-reason: "Pulled into PR #5875"
---

## Context

Rails' `CollectionAssociation#find` (`collection_association.rb:97-112`) keeps
the not-found decision in `find`, not in the scan helper:

```ruby
result = find_by_scan(*args)
result_size = Array(result).size
if !result || result_size != args_flatten.size
  scope.raise_record_not_found_exception!(args_flatten, result_size, args_flatten.size)
else
  result
end
```

`find_by_scan` (`collection_association.rb:462-470`) only scans and returns —
it never raises.

trails inverts this: `findByScan`
(`packages/activerecord/src/associations/collection-association.ts:1241`)
raises bespoke `new Error("Couldn't find … with ID …")` /
`new Error("Couldn't find all … with IDs (…)")` itself, and `find`
(`collection-association.ts:369`) just returns its result. So the loaded
`inverse_of` path emits a plain `Error` with a simplified message instead of
the scoped `RecordNotFound` that `scope.raise_record_not_found_exception!`
produces — which carries the association scope's conditions, the model name,
the primary key, and the found/expected counts.

Found by review on PR #5875 (which converged the adjacent `scope.model` read
in the same method); pre-existing, so it was left out of that PR's scope.

trails already has the target helper:
`raiseRecordNotFoundExceptionBang` in
`packages/activerecord/src/relation/finder-methods.ts:224` ("byte-for-byte
with Rails'"), reachable as a method on the relation `scope()` returns.

## Acceptance criteria

- `findByScan` stops raising and returns the scan result (or `null`/undefined
  for a miss), mirroring Rails' `find_by_scan`.
- `find` performs the `!result || result_size != args_flatten.size` check and
  routes the failure through `scope().raiseRecordNotFoundExceptionBang(...)`
  with Rails' three arguments.
- Check the other `findByScan` callers (`collection-association.ts:1057`
  path in `delete`/`destroy` id coercion) and keep their behaviour, or
  converge them to their own Rails counterparts.
- Regression test fails on baseline: assert the loaded `inverse_of` `find`
  miss raises `RecordNotFound` with Rails' message, not a bare `Error`.
  Mirror the Rails test in
  `vendor/rails/activerecord/test/cases/associations/inverse_associations_test.rb`
  / `has_many_associations_test.rb` rather than inventing a name.
