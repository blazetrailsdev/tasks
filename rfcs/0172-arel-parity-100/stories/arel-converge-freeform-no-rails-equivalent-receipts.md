---
title: "arel: give the 7 free-form @noRailsEquivalent receipts a legal shape or delete the surface they excuse"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: receipts
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md allows exactly two receipt shapes — `PERMANENT` (the token is the whole receipt) and
`CONVERGEABLE <story-id>`. arel carries **7** `@noRailsEquivalent` receipts that are neither;
each is prose describing a TypeScript-only typing or wiring device:

- `packages/arel/src/index.ts:34` — ESM load order forces the mixin wiring here; Ruby `include`s in each class body.
- `packages/arel/src/predications.ts:509` — TypeScript-only compile-time assertion; Ruby reopens the module instead.
- `packages/arel/src/tree-manager.ts:85` — TypeScript-only mixin typing; Ruby `include` needs no type surface.
- `packages/arel/src/nodes/infix-operation.ts:100` — TypeScript-only mixin typing; Ruby `include` needs no type surface.
- `packages/arel/src/nodes/node-expression.ts:17` — TypeScript-only mixin typing; Ruby `include` needs no type surface.
- `packages/arel/src/nodes/node.ts:61` — TypeScript-only mixin typing; Ruby `include` needs no type surface.
- `packages/arel/src/visitors/visitor.ts:14` — TypeScript-only ctor type; Ruby dispatches on the class object directly.

Most of these are mixin typing interfaces (`Included<>`-style host types) and the ESM wiring in
`packages/arel/src/index.ts`. CLAUDE.md § "Module mixins" is the ratified section for
`include()` / `Included<>`; a typing interface the settled `Included<>` shape makes unnecessary is
extra surface to delete, not to receipt.

## Acceptance criteria

- [ ] Each of the 7 sites is either deleted (its declaration replaced by the settled `include()` / `Included<>` shape from CLAUDE.md § "Module mixins"), or re-tagged `PERMANENT` only where it is the literal subject of a ratified CLAUDE.md section, cited in the PR body.
- [ ] No site is re-tagged `CONVERGEABLE` without a story id, and no new receipt is added.
- [ ] `pnpm parity:api:extra:gate` stays at arel novel 0 (pinned), and `pnpm parity:api:receipts:gate` green.

## Verification

```bash
grep -rnE '@noRailsEquivalent' packages/arel/src | grep -vE 'PERMANENT|CONVERGEABLE [a-z0-9-]+'  # → empty
pnpm parity:api:extra:gate
```
