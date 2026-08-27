---
title: "Table extends Node, but Rails' Arel::Table is a standalone class"
status: in-progress
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 7120
claim: "2026-08-27T13:43:45Z"
assignee: "arel-table-extends-node-but-rails-table-is-standalone"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `node-eql-is-a-generic-serializer-not-per-class-eql`
(PR #7107), which moved `eql?`/`hash` off `Arel::Nodes::Node` onto each class
that defines them upstream. Writing `Table`'s pair made the structural
mismatch explicit.

**Rails' `Arel::Table` is a standalone class, not a Node subclass.**
`vendor/rails/activerecord/lib/arel/table.rb:4` is a bare `class Table`, whose
only mixins are `include Arel::FactoryMethods` and `include Arel::AliasPredication`
(table.rb:5-6). It is not in the `Arel::Nodes` namespace and does not inherit
from `Arel::Nodes::Node`.

trails has `export class Table extends Node`
(`packages/arel/src/table.ts:48`). Consequences visible today:

- `Table` inherits `not`, `or`, `and`, `invert`, `toSql`, `fetchAttribute` and
  `isEquality` from `Node`, none of which Rails' `Table` answers. A Rails dev
  reading `table.not()` would not expect it to resolve.
- It changes what `instanceof Node` means: any `node instanceof Node` guard in
  the visitors or in `build_quoted` admits a `Table`, where Ruby's
  `Arel::Nodes::Node === other` does not. `Nodes.build_quoted`
  (casted.rb:41-49) lists `Arel::Table` as a SEPARATE arm from
  `Arel::Nodes::Node` precisely because they are disjoint upstream.
- It is why `Table#hash` / `#eql` (table.rb:88-100) read as a Node override
  rather than as the class's own pair, and why `nodes.test.ts`'s
  `every_arel_nodes_have_hash_eql_eqeq_from_same_class` guard has to reason
  about whether `Table` is in its population at all — Ruby's ObjectSpace walk
  over `Arel::Nodes::Node.singleton_class` never yields it.

## Converged shape

Make `Table` a standalone class mirroring `table.rb:4-6` — no `extends Node`,
with `FactoryMethods` and `AliasPredication` mixed in via `include()` /
`Included<>` the way the rest of the package does it.

Expect the blast radius to be in the guards, not the behaviour: every
`instanceof Nodes.Node` site that currently admits a `Table` needs auditing
against its Ruby counterpart, and the visitors' dispatch on `Table` should
already be keyed by class name rather than by base class. `Table#hash` /
`#eql` stay exactly as they are (table.rb:88-100) — they simply stop being
overrides.

Check `node-slots.ts`'s `_Table` slot and `casted.ts`'s `buildQuoted` arms
first: `buildQuoted` already lists Table separately, so it is the clearest
statement of the intended disjointness.

## Acceptance criteria

- [ ] `Table` does not extend `Node`; it mirrors `table.rb:4-6`'s class line
      and mixins.
- [ ] No `instanceof Node` guard silently changes meaning — each one that
      previously admitted a `Table` is checked against its Ruby counterpart
      and either keeps or drops the Table arm deliberately.
- [ ] `Table#hash` / `#eql` still mirror `table.rb:88-100`.
- [ ] `pnpm vitest run packages/arel` green; AR suites green on all three
      adapter lanes.
- [ ] `pnpm parity:api:extra:gate` green with arel's mark unchanged or
      narrowed.
