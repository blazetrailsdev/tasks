---
title: "Extractor emits resolved interface (declaredIn) members with params: []"
status: draft
updated: 2026-09-26
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ts-api.ts` resolves the members of a class merged
with an interface (for example `interface Base extends Context, HelperMethods`
in `packages/actionview/src/base.ts`) through the type checker. It pushes each
foreign member with `params: []` and `bodyless: true`, plus `declaredIn` naming
the declaring file (the `instanceMethods.push({ name: propName, ..., params: [] ... })`
arm, ~line 4015). The real signature is on the declaring side: the
`helpers/index.ts` re-export of `contentTag` records
`block?: () => unknown, admitsFunction: true`.

trails#8137 hit this in the block-param gate. Rails' `UrlHelper` / `DebugHelper`
/ `TextHelper` include `TagHelper` and `CaptureHelper`, so `content_tag`,
`capture`, `content_for`, `provide` and `with_output_buffer` were paired with
`base.ts`'s empty-param copies and reported as dropped blocks: 15 false rows.
The fix there was to leave `declaredIn` members out of `tsBlockSigsByFileName`
(`scripts/api-compare/compare.ts`). That is a skip, not a signature.

The same empty `params` still feed `tsParamsByName`, which the arity and
param-name comparisons read, beside `tsBlockSigsByFileName`. Every resolved
interface member contributes an empty signature there.

## Converged shape

The extractor copies the resolved declaration's parameter list onto the
foreign member (`checker.getSignaturesOfType` on the property's type, or the
`declaredIn` entry's own `params`), so every gate sees the real signature. The
block-signature skip in `compare.ts` then becomes unnecessary and is removed.

## Acceptance criteria

- A `declaredIn` member in `ts-api.json` carries its declaration's `params`.
- `compare.ts` no longer special-cases `declaredIn` for block signatures, and
  `pnpm parity:api:blocks` stays at its tightened mark.
- The arity and params figures move only by rows that the empty signatures were
  masking or inventing, and the PR lists each one.
