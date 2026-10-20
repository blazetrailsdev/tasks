---
title: "extra-surface-gate-double-counts-plain-module-members"
status: draft
updated: 2026-10-20
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
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

Converting a carrier `Module` to a plain-object module (RFC 0197) raises
`parity:api:extra:gate`'s `internal` dimension even though no surface is added.
On branch `actionpack-module-super-inlined-into-includers-db42` (activemodel
`rbCallSuper` slice plus the activerecord super-chain cascade), activerecord's
`internal` count went from 2427 to 2440. Comparing the extractor output from
main against the branch shows three effects, all measurement artifacts:

- **+13 on `Base`.** `export interface Base extends AutosaveAssociation, …`
  (`packages/activerecord/src/base.ts:1813`) already declared the autosave
  helpers (`saveBelongsToAssociation`, `isAssociationValid`, …). Once
  `AutosaveAssociation` (`packages/activerecord/src/autosave-association.ts:64`)
  is a plain object literal, the extractor reads the `@internal` tags on its
  members and counts them on `Base` too.
- **+3 on `Persistence`** (`createOrUpdate`, `destroyRow`, `initInternals`):
  each is counted once as a file-level function and again as a member of the
  `Persistence` object literal it is assigned into (`Object.assign(Persistence, {…})`).
- **−3 on `Base`:** `save`, `saveBang`, `destroy` stop counting.

The extractor is `scripts/api-compare/extract-ts-api.ts`; the gate is
`scripts/api-compare/lint-extra-surface-ratchet.ts` with marks in
`scripts/api-compare/extra-surface-internal-mark.json`.

## Acceptance criteria

- A plain-object module's member that is the same declaration as a file-level
  function is counted once, not twice.
- Members reached through `interface X extends <plain module>` are not
  re-counted on `X` when they were already measured on the module.
- Converting a carrier `Module` to a plain object with the same members leaves
  every extra-surface dimension unchanged (a fixture test in the extractor's
  test suite shows this).
- No mark is raised; any mark the fix lowers is tightened with
  `pnpm parity:api:extra:tighten`.
