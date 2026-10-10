---
title: "activerecord: QueryMethods#build_where_clause calls WhereClause.new last (order row)"
status: claimed
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: ["activerecord-relocate-query-methods-bodies-inlined-in-relation"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-10T09:09:37Z"
assignee: "activerecord-converge-build-where-clause-constructor-order"
blocked-by: null
closed-reason: null
---

## Context

`call-mismatches-exclude/activerecord/relation/query-methods.json` — `build_where_clause` order row
`constructor,references`: Rails' only constructor call is the closing `Relation::WhereClause.new`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:1651`), after `PredicateBuilder.references` (:1639). The port constructs a
clause early and mutates it.

## Acceptance criteria

- [ ] The body is restructured to Rails' order (build predicates, collect references, construct last); row deleted.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
