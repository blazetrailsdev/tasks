---
title: "Converge attribute-registration.ts's pending-modification helpers"
status: draft
updated: 2026-08-19
rfc: "0000-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/attribute_registration.rb` is 90
code lines; `packages/activemodel/src/attribute-registration.ts` is 242, of
which 87 map onto Rails members and **66 do not**:

`isDecoratorReplay` (`:379`), `inDecoratorReplay` (`:393`),
`registerWithSuperclass` (`:402`), `collectPendingModifications` (`:417`),
`replayOwnPendingDecorators` (`:445`), `pushPendingType` (`:471`),
`pushPendingDefault` (`:485`), `pushPendingDecorator` (`:499`).

Rails' model is a single `pending_attribute_modifications` array
(`attribute_registration.rb`, `apply_pending_attribute_modifications`) which is
applied lazily and inherited via `class_attribute`. trails re-implements the
inheritance and replay by hand — `registerWithSuperclass` and
`replayOwnPendingDecorators` exist because the array is not a `class_attribute`
— and splits one `pending_attribute_modifications <<` into three typed push
helpers.

`pnpm parity:api:extra --package activemodel` scores the file 4 novel / 1
moved, and `registerWithSuperclass` and `pushPendingDecorator` are two of the
27 novel names leaking out through `packages/activemodel/src/index.ts`.

Related evidence already in the repo:
`packages/activerecord/src/base.ts:1222` and `:1264` comment on the replay
mechanism ("replays every pending decorator (serialize/normalizes/encrypts)"),
which is the AR-side consumer to keep working.

## Acceptance criteria

- Pending modifications are held in one `class_attribute`-backed collection, as
  `attribute_registration.rb` has it; the hand-rolled superclass registration
  and replay helpers are deleted.
- The three `pushPending*` helpers collapse into the single Rails append.
- None of the eight names is exported from
  `packages/activemodel/src/index.ts`.
- `pnpm parity:api:extra --package activemodel` shows
  `attribute-registration.ts` at ≤ 1 novel and `index.ts` down by at least two
  novel rows.
- `activemodel/attribute-registration.json`'s row shrinks or holds.
- Parity deltas non-negative for activemodel **and** activerecord (AR's
  `serialize` / `normalizes` / `encrypts` replay depends on this).

## Verification

```bash
pnpm vitest run packages/activemodel/src/attribute-registration.test.ts packages/activemodel/src/attributes.test.ts
pnpm vitest run packages/activerecord/src/attributes.test.ts
```
