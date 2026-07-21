---
title: "to-sql's visitActiveModelAttribute takes unknown while dot.ts types it"
status: claimed
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-07-21T20:50:16Z"
assignee: "to-sql-visitactivemodelattribute-untyped-param"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #5013 (arel-ast-type-surface-excludes-model-attribute).

The two `visit_ActiveModel_Attribute` ports disagree on their parameter type:

- `packages/arel/src/visitors/dot.ts:387` — `visitActiveModelAttribute(o: ModelAttribute): void`
- `packages/arel/src/visitors/to-sql.ts:1410` — `visitActiveModelAttribute(o: unknown, collector: SQLString)`

The `unknown` was forced by the old dispatch-table typing, which could not
express a non-`Node` class key. PR #5013 widened `NodeCtor` to `object` and
registers the handler without a cast, so the `unknown` is now unnecessary — the
sibling visitor already demonstrates the honest signature.

Rails: `to_sql.rb:756` `visit_ActiveModel_Attribute(o, collector)` →
`collector.add_bind(o, &bind_block)`.

## Acceptance criteria

- [ ] `to-sql.ts`'s `visitActiveModelAttribute` takes `ModelAttribute`, matching
      `dot.ts`.
- [ ] Any now-redundant internal narrowing/casts in the body are removed.
- [ ] `to-sql.test.ts:1918`'s `as unknown as { visitActiveModelAttribute(...) }`
      test cast is re-checked and dropped if the signature change makes it moot.
- [ ] api:compare / test:compare delta non-negative.
