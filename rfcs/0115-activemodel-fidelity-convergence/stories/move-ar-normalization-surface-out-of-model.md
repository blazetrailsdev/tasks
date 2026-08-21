---
title: "Move the ActiveRecord normalization surface out of activemodel/model.ts"
status: claimed
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel", "activerecord"]
deps:
  - delete-model-xml-serialization-and-nullify-blanks
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-08-21T19:04:05Z"
assignee: "move-ar-normalization-surface-out-of-model"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Model` has no `normalizes`. The Rails home is
`vendor/rails/activerecord/lib/active_record/normalization.rb`:
`normalize_attribute` (`:26`), `normalizes` (`:88`), `normalize_value_for`
(`:106`), and the `NormalizedValueType` decorator it installs.

trails defines the whole family on `ActiveModel::Model` instead, because
`packages/activerecord/src/base.ts:871` is `class Base extends Model`:

- `model.ts:393` `normalizes` (44 code lines)
- `model.ts:466` `normalizeChangedInPlaceAttributes` (7)
- `model.ts:478` `normalizeAttribute` (3)
- `model.ts:490` `normalizeValueFor` (3)
- `model.ts:504` `_normalizationDecorator` (17)

74 code lines. `packages/activerecord/src/normalization.ts` already exists
(116 lines) and is the destination. `packages/activerecord/src/base.ts:4796-4808`
already documents the arrangement in prose — _"normalizeChangedInPlaceAttributes
now lives on Model.prototype … Reference it directly so parity:api credits
base.ts without a wrapper"_ — which is the ledger entry this story retires.

Also in scope: `packages/activemodel/src/type/normalized-value.ts` scores 5
novel names with `[no Rails counterpart]` in
`pnpm parity:api:extra --package activemodel`; its Rails counterpart is
`normalization.rb`'s `NormalizedValueType`, i.e. it belongs in `activerecord`
too. Move the file, keep the class name.

## Acceptance criteria

- The five members above are defined in
  `packages/activerecord/src/normalization.ts` at their Rails names, and
  `model.ts` no longer mentions normalization.
- `type/normalized-value.ts` moves to `packages/activerecord/src/` (path per
  `docs/ruby-ts-conventions.md`; it is `NormalizedValueType` inside
  `normalization.rb`, so fold it in rather than keeping a standalone file
  unless the file-path table says otherwise).
- `base.ts:4796-4808`'s explanatory comment block goes away with the thing it
  explained.
- `Base` reaches the methods via `include()` / `Included<>` per CLAUDE.md
  "Module mixins" — no hand-written delegation wrappers.
- `pnpm parity:api:extra --package activemodel` drops the `normalizes`,
  `normalizeAttribute`, `normalizeValueFor`,
  `normalizeChangedInPlaceAttributes` rows from `model.ts`.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative for **both**
  packages; `pnpm parity:api:calls` / `:args` clean, no reseed.

## Verification

```bash
pnpm vitest run packages/activerecord/src/normalization.test.ts packages/activemodel/src/model.test.ts
pnpm parity:api --package activemodel && pnpm parity:api --package activerecord
```
