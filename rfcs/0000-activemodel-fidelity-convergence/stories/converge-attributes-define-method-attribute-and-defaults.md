---
title: "Converge attributes.ts's define_method_attribute and default-building residue"
status: draft
updated: 2026-08-19
rfc: "0000-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
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

## Acceptance criteria

- `setDefineMethodAttribute` is no longer public surface on
  `packages/activemodel/src/index.ts`; the hook is installed where the class is
  defined.
- Its JSDoc cites CLAUDE.md's "Generated attribute readers are properties"
  section as the ratified rule, per that section's own instruction.
- `buildDefaultAttributes` converges onto `_defaultAttributes` /
  `resetDefaultAttributes` in `attribute-registration.ts`.
- `typeOptions` is inlined at its caller if Rails inlines it.
- `pnpm parity:api:extra --package activemodel` shows `attributes.ts` at
  ≤ 1 novel, and `index.ts` down by `setDefineMethodAttribute` and
  `defineDirtyAttributeMethods`.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/attributes.test.ts packages/activemodel/src/attribute-registration.test.ts packages/activemodel/src/model.test.ts
```
