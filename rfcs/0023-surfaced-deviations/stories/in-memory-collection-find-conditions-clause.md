---
title: "in-memory-collection-find-conditions-clause"
status: claimed
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-06T16:05:06Z"
assignee: "in-memory-collection-find-conditions-clause"
blocked-by: null
closed-reason: null
---

## Context

Rails' in-memory `CollectionAssociation#find`
(`activerecord/lib/active_record/associations/collection_association.rb:104`)
raises via `scope.raise_record_not_found_exception!(args_flatten, result_size,
args_flatten.size)` — called on the association **scope**, so the message
carries the scope's `[#{arel.where_sql(model)}]` conditions clause (owner FK +
any scope conditions + STI type).

trails' in-memory `CollectionProxy#find`
(`packages/activerecord/src/associations/collection-proxy.ts:3332`) calls
`raiseNotFoundAll(..., conditions = "")`, omitting the scope's WHERE clause, so
the message lacks the `[WHERE …]` clause Rails includes. The pluralized name +
found/expected suffix already match (PR #4665); only the conditions clause is
missing.

## Acceptance criteria

- In-memory `CollectionProxy#find` not-found message includes the association
  scope's conditions clause (`[WHERE …]`), matching Rails'
  `scope.raise_record_not_found_exception!`.
- Tighten the in-memory test in `collection-proxy.test.ts`
  ("emits the pluralized aggregate message …") from the current
  conditions-tolerant regex to assert the full message including the WHERE
  clause (adapter-robust: match structure, not exact quoting).
