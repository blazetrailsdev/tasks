---
title: "model-private-constants"
status: ready
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found in review of PR #5511 (converge-model-constant-registration-paths).

Ruby's constant table supports private constants. Rails uses this for habtm join
models: `activerecord/lib/active_record/associations.rb:1877-1878` is

```ruby
const_set join_model.name, join_model
private_constant join_model.name
```

so `Object.const_get("Country::HABTM_Treaties")` raises `NameError: private
constant`. trails' invented constant table
(`packages/activesupport/src/inflector.ts:168-193` — `_constants`,
`registerConstant`, `unregisterConstant`, `constantize`, `safeConstantize`) is a
flat `Map<string, unknown>` with no visibility concept, so every registered name
is globally resolvable.

Since #5511 routed `ModelRegistry.set` through the constant table, the habtm
join key (`associations/builder/has-and-belongs-to-many.ts:176,199`) is now
constantize-able where Rails forbids it — globalid's locator can resolve a join
model. The deviation is recorded at that call site; this story is the
convergence.

## Acceptance criteria

- `registerConstant` (or a sibling) can mark a name private, mirroring Ruby's
  `private_constant`.
- `constantize` raises `NameError` (Rails' message: `private constant
<Owner>::<Name>`) for a private constant; `safeConstantize` returns undefined.
- The habtm join key registered at `has-and-belongs-to-many.ts:199` is private,
  and the deviation note there is removed.
- A test asserts `constantize("Country::HABTM_Treaties")` raises, while the
  habtm association itself and reflection-driven resolution still work (they go
  through `modelRegistry`/`resolveModel`, not `constantize`).
- `packages/globalid/src/global-locator.test.ts` stays green.
