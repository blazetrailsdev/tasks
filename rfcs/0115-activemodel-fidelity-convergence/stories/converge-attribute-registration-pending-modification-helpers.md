---
title: "Converge attribute-registration.ts's pending-modification helpers"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6781
claim: "2026-08-20T18:00:06Z"
assignee: "converge-attribute-methods-copy-on-write-and-alias-helpers"
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

## The mixin idiom to use (RFC finding F0)

All three mechanisms this story needs are already ported and exported, and
activemodel currently uses none of them — see this RFC's F0. Do not hand-roll a
fourth spelling:

- **`classAttribute()`** — `packages/activesupport/src/class-attribute.ts:70`,
  exported from the package index (`:387`). Its contract is exactly Rails'
  `class_attribute`: _"reads walk the constructor chain; writes are local to the
  class"_. It has **zero** callers in activemodel today.
- **`extend()` / `Extended<>`** — `packages/activesupport/src/include.ts:335`.
  The TS spelling of `extend SomeModule`, i.e. the `ClassMethods` half of a
  Concern. **Zero** callers in activemodel; 65 in activerecord.
- **`include()` / `Included<>`** — `include.ts:184`, plus the symbol-keyed
  `[included]` / `[extended]` hooks fired at `include.ts:193,272,371`, which are
  the TS spelling of an `included do` block. The hooks are keyed by
  `Symbol.for(...)`, so they never surface to `parity:api:extra` and do not
  collide with the `SKIP_GROUPS` ban on a string-named `included` member
  (`scripts/parity/conventions.ts:444`, `tsMirrorIsDrift: true`). CLAUDE.md's
  "Module mixins" section still says these hooks have no TS equivalent; that is
  stale for `included`/`extended` and true only for `inherited`.

## Acceptance criteria

- Pending modifications are held in one `classAttribute()`-backed collection,
  as `attribute_registration.rb` has it; `registerWithSuperclass`
  (`attribute-registration.ts:402`) — the third of the package's five
  copy-on-first-write spellings (F0) — and the replay helpers are deleted.
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
