---
title: "Test that the generated tzinfo-data2 fixtures match scripts/generate-tzinfo-data.ts"
status: ready
updated: 2026-11-20
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10110 added `scripts/generate-tzinfo-data.ts`, which translates a Format2 tzinfo-data tree
(`vendor/tzinfo/v2.0.6/test/tzinfo-data2/tzinfo/data/**.rb`) into TS modules plus `load-path.ts`.
Its output is checked in at `packages/tzinfo/test/tzinfo-data2/` and formatted with prettier
afterwards. Nothing verifies that the checked-in output still matches what the generator produces,
so a change to the generator or to the fixtures can drift silently. The sibling generators
(`scripts/generate-tzdata-abbreviations.test.ts`, `scripts/generate-tzdata-isdst.test.ts`)
each have a test that reruns them and compares against the committed output.

## Acceptance criteria

- [ ] `scripts/generate-tzinfo-data.test.ts` runs `generate()` into a temp dir, formats each file
      with prettier's API, and asserts the result is byte-identical to `packages/tzinfo/test/tzinfo-data2/`.
- [ ] The test is registered wherever scripts tests are enrolled (vitest project include, CI suite coverage).
