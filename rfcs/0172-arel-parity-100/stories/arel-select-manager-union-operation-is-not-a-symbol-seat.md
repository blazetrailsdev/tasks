---
title: "arel: SelectManager#union reads operation.to_s with no Symbol arm; operation is not a Symbol-discriminating seat"
status: ready
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Replaces `arel-select-manager-union-operation-to-s-is-a-conditional`, whose converged shape waited on
`rbObjAsString` answering a Symbol's name. That fix is rejected (see
`arel-table-as-is-not-a-symbol-seat`): a String and a Symbol share one JS type, and `rbObjAsString` is
the general `to_s` for callers that pass real Strings which may begin with `:`.

`pnpm parity:api:arms:report --package=arel` lists `select-manager.ts#union` at `+if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/select_manager.rb:198-207`):

```ruby
if other
  node_class = Nodes.const_get("Union#{operation.to_s.capitalize}")
```

`packages/arel/src/select-manager.ts#union` spells `operation.to_s` as a conditional,
`isSymbol(operation) ? symbolToS(operation) : rbObjAsString(operation)`, so that a colon-carrying
`":all"` resolves `UnionAll`.

## Decision (operator, 2026-10-02)

`union`'s `operation` is not a Symbol-discriminating seat. `select_manager.rb:198-207` does not turn on
`Symbol === operation`, so by CLAUDE.md ("A Ruby Symbol is a JS string") `union(:all, other)` ports as
`union("all", other)`, with no colon. The conditional goes and the callers pass the colon-less name.

## Converged shape

```ts
`Union${capitalize(rbObjAsString(operation), [])}`;
```

## Acceptance criteria

- [ ] `SelectManager#union` reads `rbObjAsString(operation)` with no `isSymbol` arm.
- [ ] Every caller passes the colon-less name. On `main` at `1890b5103a` the colon-carrying callers are
      all tests: `packages/arel/src/select-manager.test.ts:243`,
      `packages/arel/src/select-manager.trails.test.ts:72,78` and
      `packages/arel/src/nodes/binary.trails.test.ts:28`. Re-check `packages/*/src` for others.
- [ ] `rbObjAsString` and its other callers are untouched.
- [ ] `pnpm parity:api:arms:report --package=arel` no longer lists `select-manager.ts#union`.

## Verification

```bash
pnpm vitest run packages/arel && pnpm parity:api:calls && pnpm parity:api:arms:report --package=arel
```
