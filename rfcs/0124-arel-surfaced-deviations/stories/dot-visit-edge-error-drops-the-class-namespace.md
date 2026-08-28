---
title: "Dot#visitEdge's NoMethodError analogue names the bare class, not Arel::Nodes::X"
status: in-progress
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7163
claim: "2026-08-28T14:24:28Z"
assignee: "dot-visit-edge-error-drops-the-class-namespace"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::Dot#visit_edge` calls `o.send(method)`
(vendor/rails/activerecord/lib/arel/visitors/dot.rb:243-245). When the ivar is
absent Ruby raises its own `NoMethodError`, whose message names the receiver's
class with its full nesting — `undefined method 'expr' for an instance of
Arel::Nodes::Grouping`.

`packages/arel/src/visitors/dot.ts:315-319` hand-builds that message and reads
the bare constructor name:

    const klass = (o as { constructor?: { name?: string } }).constructor?.name ?? "Object";
    throw new TypeError(`undefined method '${method}' for ${klass}`);

so it reports `Grouping`, not `Arel::Nodes::Grouping`. PR #7155 added
`rubyConstantName` (packages/arel/src/visitors/ruby-class.ts) and already
routes Dot's node LABELS (dot.rb:253) and `Visitor#visit`'s
`Cannot visit …` (visitor.rb:39) through it; this call site was left on the
bare name.

## Converged shape

    const klass = rubyConstantName(o.constructor) ?? "Object";

giving `undefined method 'expr' for Arel::Nodes::Grouping`, the class name
Ruby's own NoMethodError carries.

## Acceptance criteria

- `dot.ts`'s `visitEdge` guard formats the receiver through `rubyConstantName`.
- A test pins the qualified name in the message (dot.trails.test.ts, since
  dot_test.rb never reaches this arm).
- No test renamed; `pnpm parity:api --package arel` stays 961/961.
