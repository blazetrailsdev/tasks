---
title: "activemodel: the 32 TS-only tests in Rails-named files move to .trails.test.ts siblings"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: tests
packages: ["activemodel"]
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

`pnpm parity:test` counts **32 extra (TS only)** activemodel tests — tests inside a Rails-mirroring
convention file that no Rails test consumed: `validations/acceptance-validation.test.ts` 9,
`validations/confirmation-validation.test.ts` 7, `validations/with-validation.test.ts` 4,
`validations/format-validation.test.ts` 3, `validations/inclusion-validation.test.ts` 3,
`errors.test.ts` 2, `validations/presence-validation.test.ts` 2, `attributes.test.ts` 1,
`validations/absence-validation.test.ts` 1. Convention: a TS-only test lives in the
`.trails.test.ts` sibling, so the Rails-named file holds only Rails' tests.

## Acceptance criteria

- [ ] Each extra is moved to the `.trails.test.ts` sibling, or — where it is a Rails test under a drifted name — matched to the Rails name via its describe path (never renaming a Rails-named test).
- [ ] Duplicates of a Rails test already ported are deleted.
- [ ] `pnpm parity:test` activemodel `extra (TS only)` **0**.

## Verification

```bash
pnpm parity:test --package activemodel --missing && pnpm parity:test:assertions
```
