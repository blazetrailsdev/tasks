---
title: "converge-attribute-definitions-activemodel-readers"
status: claimed
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T03:10:24Z"
assignee: "converge-attribute-definitions-activemodel-readers"
blocked-by: null
closed-reason: null
---

## Context

Split 1/4 of `converge-attribute-definitions-onto-default-attributes`, which the
reader inventory showed is far past a single PR: `_attributeDefinitions` has 129
non-test occurrences across 24 files on `origin/main` (measured 2026-08-18).

This slice is the **ActiveModel** half — the map's declaration-time home:

- `packages/activemodel/src/attribute-registration.ts:35` (the host-interface
  member), `:101`, `:114`, `:128-134` (the copy-on-write eager write in
  `pendingAttributeModifications`' apply path), `:394`, `:426`
- `packages/activemodel/src/model.ts` (6), `attributes.ts` (5),
  `attribute-methods.ts` (4), `serialization.ts` (2), `secure-password.ts` (2)

Rails has no such map. `vendor/rails/activemodel/lib/active_model/attribute_registration.rb`
carries `_default_attributes` (memoized `AttributeSet`, seeded then replayed
through the pending chain) and derives `attribute_types` from it
(`attribute_registration.rb`, `ActiveModel::AttributeRegistration::ClassMethods`).
Each reader here should resolve through `_default_attributes` / `attribute_types`.

## Acceptance criteria

- [ ] Every `_attributeDefinitions` reader in `packages/activemodel/src/**`
      resolves through `_default_attributes` / `attribute_types`.
- [ ] The eager copy-on-write write in `attribute-registration.ts:128-134` is
      gone; `PendingDecorator#applyTo` remains the single apply path for the
      ActiveModel side.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] activemodel suites pass; activerecord `attributes` / `model-schema` /
      `dirty` suites unaffected (the AR readers are later slices and may still
      hold the map at this point).

## Dependencies

None. The AR slices (2-4) follow.
