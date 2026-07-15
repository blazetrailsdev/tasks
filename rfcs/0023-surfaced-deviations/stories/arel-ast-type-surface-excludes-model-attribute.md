---
title: "Arel AST type surface excludes ActiveModel::Attribute, forcing escape casts at the Rails ports"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4882 (arel-am-attribute-predicates-diverge-across-sites).

Rails admits an `ActiveModel::Attribute` as a first-class AST occupant, by class:

- `casted.rb:50` — `build_quoted`'s `when` arm returns it **unwrapped** into the AST.
- `to_sql.rb:631-634` — Assignment's `when Arel::Nodes::Node, Arel::Attributes::Attribute, ActiveModel::Attribute` then `visit o.right`.
- `to_sql.rb:110` — ValuesList's `when Nodes::SqlLiteral, Nodes::BindParam, ActiveModel::Attribute`.
- `to_sql.rb:756` — `visit_ActiveModel_Attribute`.

Ruby duck-types past this. trails' AST types are closed over `Node`, so every
one of those sites needs an escape cast:

- `NodeOrValue` (`packages/arel/src/nodes/binary.ts:10-16`) is
  `Node | string | number | boolean | bigint | Date | ...` with no
  `ActiveModel::Attribute`. The rb:631 port at `visitors/to-sql.ts:1202` needs
  `this.visit(node.right as unknown as Node, collector)`, and a test building
  `new Nodes.Assignment(left, AMAttribute.fromUser(...))` needs
  `as unknown as Nodes.NodeOrValue` (`visitors/to-sql.test.ts`).
- `NodeCtor` (`visitors/visitor.ts:14`) is `abstract new (...args: never[]) => Node`,
  so registering rb:756's handler needs
  `reg(ModelAttribute as unknown as NodeCtor, "visitActiveModelAttribute")`
  (`visitors/to-sql.ts:535`).

Each cast is the type surface asserting "impossible" about something Rails does
routinely.

This is the **stated blocker** for `arel-build-quoted-passes-model-attribute-unwrapped`:
PR #4879 argues for keeping the `BindParam` wrap precisely because converging
"puts a bare `ActiveModel::Attribute` — not a `Node` — into an AST that is
statically typed against `Node`, across every node slot in arel". The owner's
decision is that the wrap converges, so closing this gap is what makes that
story workable.

Distinct from `arel-visit-dispatches-raw-classes-like-rails` (draft), which
covers raw JS scalars reaching `visit` via class dispatch. This one is about
`ActiveModel::Attribute` occupying AST slots and the dispatch table.

## Acceptance criteria

- [ ] `NodeOrValue` admits `ActiveModel::Attribute`, so a node slot holding one
      typechecks without `as unknown as`.
- [ ] The dispatch table accepts rb:756's non-Node class key without
      `as unknown as NodeCtor`, or the registration is expressed in a way that is
      honest about Rails dispatching by class.
- [ ] The `as unknown as` casts #4882 added at `visitors/to-sql.ts` (the
      Assignment port and the `reg` line) and `visitors/to-sql.test.ts` are gone.
- [ ] Coordinate with `arel-build-quoted-passes-model-attribute-unwrapped` — this
      unblocks it; do NOT converge the wrap here.
- [ ] api:compare / test:compare delta non-negative.
