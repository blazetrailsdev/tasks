---
title: "Singular arelColumn missing Arel-node passthrough branch (crashes on raw Nodes.Node)"
status: claimed
updated: 2026-07-06
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-07-06T00:21:54Z"
assignee: "arel-column-singular-node-passthrough"
blocked-by: null
closed-reason: null
---

## Context

Trails' singular `arelColumn` (packages/activerecord/src/relation/query-methods.ts:2258)
lacks the `Arel.arel_node?(field) -> field` passthrough branch that Rails' singular
`arel_column` has (vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2002-2003).
Passing a raw `Nodes.Node` to `arelColumn` falls through to `fieldStr.match(...)`,
which throws because a Node has no `.match`. Surfaced during PR #4631: the
grouped-aggregate path had to route through the plural `arelColumns` (which does
have the Node passthrough at query-methods.ts:2287) to avoid crashing on a raw
Arel-node group column.

## Acceptance criteria

- Singular `arelColumn` returns the field unchanged when it is a `Nodes.Node`,
  mirroring Rails query_methods.rb:2002-2003.
- Add a unit test in build-arel-helpers.test.ts covering `arelColumn(node)`.
