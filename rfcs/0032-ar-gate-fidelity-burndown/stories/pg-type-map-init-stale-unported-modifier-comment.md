---
title: "delete the stale 'add_modifier unported' comment in type-map-init.ts"
status: ready
updated: 2026-07-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/type-map-init.ts:50-52`
carries a comment stating that the two `add_modifier` lines opening Rails'
registration block (`postgresql_adapter.rb:1166-1167`) "are unported: trails has
no registry modifiers". That was true when #5206 was written, but #5203 merged
first and added exactly those two calls immediately below the `ArType.register`
block in the same file:

```ts
ArType.addModifier({ array: true }, OidArray, { adapter: "postgres" });
ArType.addModifier({ range: true }, RangeType, { adapter: "postgres" });
```

The comment now contradicts the code twelve lines under it and will mislead the
next reader into re-filing the already-closed
`ar-pg-array-range-type-modifiers-never-registered` (#5203).

## Acceptance criteria

- The stale "unported / no registry modifiers" claim in `type-map-init.ts` is
  deleted or rewritten to describe what the file actually does.
- The remaining comment, if any, states only the non-obvious fact (that
  "postgres" is trails' normalized name for Rails' `:postgresql`), which the
  `addModifier` comment already covers — so deletion is the likely outcome.
