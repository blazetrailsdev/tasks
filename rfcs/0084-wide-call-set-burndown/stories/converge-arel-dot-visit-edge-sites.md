---
title: "Dot visitor visit_edge sites pass labels and edges Rails does not"
status: done
updated: 2026-08-10
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6317
claim: "2026-08-10T01:46:38Z"
assignee: "port-test-date-arith-fractional-arms"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0095 call-argument comparator (PR #6309) measuring arel:
two `visit_edge` call sites in the Dot visitor pass argument lists Rails does
not. Both are wrong LITERALS or invented calls in a ported body, which
`parity:api` (names), `arity.ts` (declaration parameter counts) and `parity:api:calls`
(the call set) are all blind to — every call made is `visit_edge`, so only the
argument comparison sees it.

**1. `visit_Arel_Nodes_Extract` passes the wrong edge labels.**
Rails (`activerecord/lib/arel/visitors/dot.rb:109-112`):

```ruby
def visit_Arel_Nodes_Extract(o)
  visit_edge o, "expressions"
  visit_edge o, "alias"
end
```

trails (`packages/arel/src/visitors/dot.ts:202-205`) passes `"expr"` and
`"field"`. The labels are the node's attribute names the visitor reflects on, so
these are not cosmetic.

**2. `visit_Arel_Nodes_UpdateStatement` / `visit_Arel_Nodes_DeleteStatement`
emit two edges Rails does not have.**
Rails (`dot.rb:148-156` and `dot.rb:158-165`):

```ruby
def visit_Arel_Nodes_UpdateStatement(o)
  visit_edge o, "relation"
  visit_edge o, "wheres"
  visit_edge o, "values"
  visit_edge o, "orders"
  visit_edge o, "limit"
  visit_edge o, "offset"
  visit_edge o, "key"
end

def visit_Arel_Nodes_DeleteStatement(o)
  visit_edge o, "relation"
  visit_edge o, "wheres"
  visit_edge o, "orders"
  visit_edge o, "limit"
  visit_edge o, "offset"
  visit_edge o, "key"
end
```

trails (`dot.ts:242-252`, `dot.ts:254-263`) inserts `"groups"` and `"havings"`
into both, after `values` / `wheres` respectively. That is invented behavior —
9 edges where Rails emits 7, and 8 where Rails emits 6 — and it shifts every
following edge, which is how the comparator surfaced it (8 flagged rows reading
as label drift: `orders`→`groups`, `limit`→`havings`, `offset`→`orders`,
`key`→`limit`).

## Acceptance criteria

1. `visitArelNodesExtract` passes `"expressions"` then `"alias"`, matching
   `dot.rb:109-112`.
2. `visitArelNodesUpdateStatement` emits exactly Rails' seven edges in Rails'
   order; `visitArelNodesDeleteStatement` exactly Rails' six. The `groups` /
   `havings` edges are deleted, not reordered.
3. Any Dot-visitor test asserting the current output is updated to the Rails
   shape — the test encodes the divergence, so it is evidence to re-derive, not
   a constraint to preserve. If a test name mirrors a Rails test, the name does
   not change.
4. `pnpm parity:api:calls` shows no new rows.
