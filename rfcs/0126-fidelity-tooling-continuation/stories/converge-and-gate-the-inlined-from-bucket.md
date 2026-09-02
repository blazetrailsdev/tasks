---
title: "converge-and-gate-the-inlined-from-bucket"
status: in-progress
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 4
pr: 7391
claim: "2026-09-02T14:04:19Z"
assignee: "report-noRailsEquivalent-tags-that-cover-no-extra"
blocked-by: null
closed-reason: null
---

## Context

PR #7159 (RFC 0126) added the `inlined-from` bucket to `parity:api:extra` — the
mirror image of `moved`: a Ruby module member whose TS body sits on an INCLUDING
class's file instead of the file mirroring the module's own. It is report-only.
`pnpm parity:api:extra --package arel` currently reports eight rows:

```text
arel/attributes/attribute.ts     quotedNode    inlined-from predications.rb (quoted_node)
arel/nodes/infix-operation.ts    quotedNode    inlined-from predications.rb (quoted_node)
arel/nodes/node-expression.ts    quotedNode    inlined-from predications.rb (quoted_node)
arel/nodes/sql-literal.ts        quotedNode    inlined-from predications.rb (quoted_node)
arel/select-manager.ts           compileDelete inlined-from crud.rb (compile_delete)
arel/select-manager.ts           compileInsert inlined-from crud.rb (compile_insert)
arel/select-manager.ts           compileUpdate inlined-from crud.rb (compile_update)
arel/select-manager.ts           createInsert  inlined-from crud.rb (create_insert)
```

The four `crud.rb` rows are owned by `arel-crud-interface-holds-no-bodies`
(RFC 0124). The four `quotedNode` rows are new: Rails defines
`Arel::Predications#quoted_node` once, privately
(`vendor/rails/activerecord/lib/arel/predications.rb`), and four trails hosts
each carry their own copy instead of the one body in `predications.ts` — the
same class of drift as `Attribute` hand-copying four mixins, fixed in #7123.

Two pieces of work, in order.

## Acceptance criteria

- The four `quotedNode` copies collapse to one body in
  `packages/arel/src/predications.ts`, at Rails' visibility, reached by the
  hosts the way Rails reaches it (`include Predications`); the four
  `inlined-from predications.rb` rows disappear.
- Once arel reports zero rows, seed an only-shrink mark for the bucket beside
  `scripts/api-compare/extra-surface-mark.json`'s existing dimensions and gate
  arel on it, the same contract as `parity:api:extra:gate` (write-down only,
  no reseed). Other packages stay report-only until their own burndown.
- No row is retired by widening an allowlist or by adding a receipt.
