---
title: "object-literal-mixin-methods-carry-no-skeleton"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8448
claim: "2026-10-03T16:07:12Z"
assignee: "lazy-attribute-hash-default-value-and-equality"
blocked-by: null
closed-reason: null
---

## Context

`harvestObjectLiteralMethods` (`scripts/api-compare/extract-ts-api.ts`, the
`ts.isMethodDeclaration(prop)` and function-expression `PropertyAssignment`
arms) records `calls`, `callSeq` and `callArgs` for a bodied object-literal
mixin method, but never `skeleton`. So a `ClassMethods = { validatesWith() {…} }`
body is invisible to `parity:api:arms:report`, and where the same file also
holds a same-named file function the comparer pairs BOTH Ruby definitions
against that one function.

The live instance: `packages/activemodel/src/validations/with.ts`. Rails defines
`validates_with` twice — `ClassMethods#validates_with`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/with.rb:88-105`,
arms `loop if loop`) and the instance method (`with.rb:144-152`, arm `loop`).
The TS class method (`ClassMethods.validatesWith`) carries the `if` and both
loops, but has no skeleton, so the Ruby class method is compared to the instance
`validatesWith` function and reports `-loop`. That is the one remaining
activemodel `--direction=missing` row that is not a real dropped branch.

Measured while working `activemodel-converge-missing-control-flow-arms`: adding
`skeleton = extractSkeleton(prop.body)` / `extractSkeleton(init.body)` to those
two arms surfaces two missing-`throw` rows the gate cannot see today, and reds
`pnpm parity:api:arms:throws`:

- `actiondispatch` `middleware/session/abstract-store.ts`: mark 0, current 1
- `activesupport` `message-pack/extensions.ts`: mark 0, current 1

## Acceptance criteria

- [ ] Bodied object-literal mixin methods carry a `skeleton` in `ts-api.json`.
- [ ] `with.rb`'s two `validates_with` definitions each compare against their own
      TS body (or neither compares, where the owner is ambiguous), and the
      activemodel `validatesWith  -loop` row is gone.
- [ ] The two missing-`throw` rows above are converged at their Rails raise
      sites, not absorbed by raising `arm-throw-mark.json`.
