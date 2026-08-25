---
title: "arel-collector-argument-order-convergence"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6348
claim: "2026-08-11T01:14:36Z"
assignee: "arel-collector-argument-order-convergence"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0095 call-argument baseline seed (PR #6343): the arel
visitor-helper family moved `collector` to the LAST parameter, where Rails
passes it in the middle. 23 call sites, invisible to `arity.ts`,
`parity:api` and `parity:api:calls` — the port makes every call Rails makes,
with the arguments permuted, which is exactly the class RFC 0095 exists to
catch.

Rails (`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb`) vs trails
(`packages/arel/src/visitors/to-sql.ts`):

- `inject_join(list, collector, join_str)` (`to_sql.rb:897`) vs
  `injectJoin(nodes, connector, collector)` (`to-sql.ts:654`)
- `collect_nodes_for` (`to_sql.rb:179`)
- `infix_value` (`to_sql.rb:957`)
- `infix_value_with_paren` (`to_sql.rb:963`)
- `grouping_parentheses` (`to_sql.rb:981`)

The parameter NAMES diverge too (`list`/`nodes`, `join_str`/`connector`), which
is the RFC 0096 naming dimension and converges in the same edit.

## Acceptance criteria

1. Each helper takes Rails' parameter list, in Rails' order, with Rails' names.
2. All 23 call sites updated; no wrapper or overload retained for the old order.
3. The corresponding `kind: "args"` rows are DELETED from
   `scripts/api-compare/call-mismatches-exclude/arel/visitors/to-sql.json`
   (only-shrink: converged rows go stale and red the gate until removed).
4. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
