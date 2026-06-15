---
title: "Thread JOIN ON _compileArelNode binds through outer collector (node-level alias rebinding)"
status: draft
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["compile-arel-node-bind-threading"]
deps-rfc: []
est-loc: 200
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out from `compile-arel-node-bind-threading` (merged, PR #3317). That story
converged the order (`inOrderOf` CASE) and select-fragment (collection-cache
COUNT/MAX) `_compileArelNode` call sites to attach their Arel nodes to the outer
manager so binds thread through the one collector. The JOIN `ON` cluster was
deferred: the call sites at `relation.ts` (whereMissing/whereAssociated and the
hasMany-through join builders) compile their predicate to an inlined `on`
**string** stored on the `_joinClauses` spec (`JoinClauseSpec.on: string`).

That string is consumed by **string-based self-join alias rebinding** in
`_appendQualifiedJoin` (`relation.ts:~205,212`): siblings targeting the same
table under different ON conditions are deduped by `j.on === join.on` and the
later join's ON is rebound to an alias via `join.on.split(...).join(...)` over
the rendered SQL. Converging these to Arel nodes therefore requires reworking
the rebinding to operate on the predicate AST (rebind the `Table` reference
inside the node) instead of string-splitting the rendered SQL.

These predicates are column=column or column=STI-type-literal (a `Casted`),
which Rails inlines anyway under the default `SQLString` collector — so the
parity win is for any genuine `BindParam` and for forward-compatibility with
`compile-casted-inline-in-visitor` (after which a threaded `Casted` inlines at
the visitor level, fully matching Rails).

## Acceptance criteria

- The JOIN `ON` `_compileArelNode` call sites attach their Arel predicate node
  to the join spec / outer manager instead of pre-rendering inlined SQL text.
- Self-join alias rebinding (`_appendQualifiedJoin`) operates on the predicate
  AST (rebinding the target `Table`) rather than string-splitting rendered SQL.
- `_compileArelNode` is removed once its only remaining caller is the
  genuinely-standalone `_distinctSelectForLimitedIds` bind-free column ref.
- No behavior change in executed SQL semantics; api:compare and test:compare
  deltas non-negative.
