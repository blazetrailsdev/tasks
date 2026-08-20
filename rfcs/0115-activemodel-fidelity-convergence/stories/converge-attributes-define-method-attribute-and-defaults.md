---
title: "Converge attributes.ts's define_method_attribute and default-building residue"
status: done
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6780
claim: "2026-08-20T17:45:03Z"
assignee: "converge-attribute-assignment-hash-guards"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/attributes.rb` is 58 code lines;
`packages/activemodel/src/attributes.ts` is 211. Only 37 lines map onto
`attributes.rb` members; 34 belong to `attribute_methods.rb` (already covered
by the fan-out stories) and **57 have no Rails counterpart**:

`setDefineMethodAttribute` (`:221`, 23 code lines), `buildDefaultAttributes`
(`:315`, 17), `typeOptions` (`:296`, 9), `defineDirtyAttributeMethods`
(`:201`), `isAttributeAliases` (`:376`), `isAttributeMethodPatterns` (`:386`).

`pnpm parity:api:extra --package activemodel` scores the file 3 novel / 9
moved, the 9 moved being the `attribute_methods.rb` members.

`setDefineMethodAttribute` is the installer for the hook CLAUDE.md's
"Generated attribute readers are properties" section ratifies — ActiveModel
needs a `define_method_attribute` where Rails has none. **That hook is
ratified repo-wide and is not up for re-litigation.** What is in scope is that
the _installer_ is 23 lines of mutable-module-state plumbing exported from
`packages/activemodel/src/index.ts`, and that `defineMethodAttribute` itself is
assigned onto `Model` as a static (`model.ts:313`). Code implementing the
ratified rule cites that CLAUDE.md section — it does not need a separate
public setter on the package's index.

`buildDefaultAttributes` duplicates `_default_attributes` /
`resetDefaultAttributes` (`attribute_registration.rb`), both of which the
sibling file already ports.

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

- `setDefineMethodAttribute` is no longer public surface on
  `packages/activemodel/src/index.ts`; the hook is installed where the class is
  defined.
- Its JSDoc cites CLAUDE.md's "Generated attribute readers are properties"
  section as the ratified rule, per that section's own instruction.
- `buildDefaultAttributes` converges onto `_defaultAttributes` /
  `resetDefaultAttributes` in `attribute-registration.ts`.
- `typeOptions` is inlined at its caller if Rails inlines it.
- `attributes.rb:35-37`'s `included do attribute_method_suffix "=", parameters: "value" end`
  is issued from the `[included]` hook (F0), not by hard-coding the second
  `AttributeMethodPattern` into `Model`'s static initializer
  (`model.ts:284-287`).
- `pnpm parity:api:extra --package activemodel` shows `attributes.ts` at
  ≤ 1 novel, and `index.ts` down by `setDefineMethodAttribute` and
  `defineDirtyAttributeMethods`.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/attributes.test.ts packages/activemodel/src/attribute-registration.test.ts packages/activemodel/src/model.test.ts
```
