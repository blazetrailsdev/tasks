---
title: "Remove dead validations/association-helpers.ts module"
status: draft
updated: 2026-06-12
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during RFC 0022 b3-migrate-singular-readers (PR #3139). The module
`packages/activerecord/src/validations/association-helpers.ts` exports
`resolveAssociation`, `filterDestroyed`, and `isAssociation`, but **nothing in
the repo imports them** (`grep -rn "resolveAssociation\b|filterDestroyed" packages`
returns only the definitions). The live validation reader is
`validations.ts` `readAttributeForValidation`; `resolveAssociation` is a stale
parallel copy of the same cache-resolution logic that was never wired up.

b3 migrated `resolveAssociation` to read through the holder for AC consistency,
but the module remains dead. Confirm it is genuinely unused (including across
`activemodel` / other packages) and delete it, or, if a caller is intended,
wire it in and add a test. There is no Rails analog — Rails' validation reads
go through `read_attribute_for_validation` (`send(attribute)`), which maps to
`readAttributeForValidation`, not this helper.

## Acceptance criteria

- [ ] Confirm `resolveAssociation`, `filterDestroyed`, `isAssociation` have zero
      importers across all packages.
- [ ] Delete `validations/association-helpers.ts` (and its `.test.ts` if any), or
      wire the helper into a real caller with a covering test if a use is found.
- [ ] Full validation + autosave suites pass; `api:compare` delta non-negative.
