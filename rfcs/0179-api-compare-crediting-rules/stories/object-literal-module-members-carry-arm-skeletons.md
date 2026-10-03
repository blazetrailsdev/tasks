---
title: "api-compare: object-literal module members carry skeletons, keyed by owner"
status: ready
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`harvestObjectLiteralMethods` (`scripts/api-compare/extract-ts-api.ts`) records `calls` / `callSeq` /
`callArgs` for an object-literal module member (`export const ClassMethods = { validatesWith() {} }`)
but no `skeleton`. So every Rails method ported into a `ClassMethods` / `HelperMethods` object
literal is invisible to `pnpm parity:api:arms:report` and `parity:api:arms:throws`. trails#8422
stopped the comparer pairing such a member with a same-named top-level body's skeleton
(`skeletonIsAnotherOwners`, `scripts/api-compare/compare.ts`), but did not measure them.

Emitting the skeleton was tried in #8422 and backed out because it widens the population:

- about 20 new activemodel invented-arm rows, among them `attribute-methods.ts#defineAttributeMethods`,
  `#aliasAttribute`, `#attributeMethodPatternsMatching`, `attribute-registration.ts#attribute`,
  `validations.ts#validate`, `#validators`, `#isAttributeMethod`,
  `validations/helper-methods.ts#_mergeAttributes`
- two missing-throw rows that red `parity:api:arms:throws`:
  `actiondispatch middleware/session/abstract-store.ts` and
  `activesupport message-pack/extensions.ts`

Skeletons are keyed by (file, name), so once both a module member and a top-level function carry
one, `tsSkeletons.length === 1` fails and both pairs drop. Keying by owner, as `callArgs` already
is, avoids that.

## Acceptance criteria

- [ ] `harvestObjectLiteralMethods` emits `skeleton` for method and function-valued members, with a
      test, and `tsSkeletonByFileName` is keyed by owner so `with.ts`'s instance and `ClassMethods`
      `validatesWith` each pair with their own Rails body.
- [ ] The two missing-throw rows are converged (the Rails raise ported) before this lands, so
      `parity:api:arms:throws` stays green without raising a mark.
- [ ] The newly measured invented-arm rows are filed against their package's parity RFC.
