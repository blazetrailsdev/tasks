---
title: "MySQL IsDistinctFrom should delegate to IsNotDistinctFrom per mysql.rb"
status: done
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: 50
pr: 5061
claim: "2026-07-22T15:41:50Z"
assignee: "mysql-isdistinctfrom-delegates-to-isnotdistinctfrom"
blocked-by: null
closed-reason: null
---

## Context

Found in PR #5050 (story `to-sql-base-isdistinctfrom-emits-native-not-case-form`).

Rails' MySQL visitor routes `IsDistinctFrom` through the `IsNotDistinctFrom`
visitor (`vendor/rails/activerecord/lib/arel/visitors/mysql.rb:49-51`):

```ruby
def visit_Arel_Nodes_IsDistinctFrom(o, collector)
  collector << "NOT "
  visit_Arel_Nodes_IsNotDistinctFrom o, collector
end
```

Trails inlines the `<=>` body instead
(`packages/arel/src/visitors/mysql.ts:169-178`): it appends `"NOT "` then
re-emits `left <=> right` directly rather than calling
`this.visitArelNodesIsNotDistinctFrom(node, collector)`. SQL output is
identical, but the call-graph divergence is what the wide-call baseline entry
in `scripts/api-compare/call-mismatches-wide-exclude/arel/visitors/mysql.json`
(`visit_Arel_Nodes_IsDistinctFrom` → `visit_Arel_Nodes_IsNotDistinctFrom`)
flags.

## Acceptance criteria

- `mysql.ts` `visitArelNodesIsDistinctFrom` appends `"NOT "` and delegates to
  `visitArelNodesIsNotDistinctFrom`, matching mysql.rb:49-51.
- Remove the converged mysql.json wide-baseline entry; re-run
  `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls` then
  `pnpm api:calls:wide`.
- Existing mysql.test.ts SQL assertions unchanged (output is identical).
