---
title: "activemodel: acceptance-validation.test.ts's 9 TS-only tests move to the .trails.test.ts sibling"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package activemodel` still reports **9 extra (TS only)**, all in
`packages/activemodel/src/validations/acceptance-validation.test.ts` (mirrors
`vendor/rails/v8.0.2/activemodel/test/cases/validations/acceptance_validation_test.rb`, 10 cases at
`:14-121`). They were split out of `activemodel-relocate-ts-only-tests-to-trails-siblings`, whose PR
moved the other six validation files and stopped at the LOC ceiling. No
`acceptance-validation.trails.test.ts` exists yet.

The nine, by describe:

- `AcceptanceValidationTest` (in the Rails-named describe, after "lazy attributes respond to?"):
  - "validates acceptance with a scalar accept option" duplicates Rails'
    `test_terms_of_service_agreement_with_accept_value` (`acceptance_validation_test.rb:46`), already
    ported in the same file. Delete.
  - "validates acceptance with an iterable (Set) accept option" has no Rails counterpart (a JS `Set`). Move.
  - "setup! auto-defines attribute when not explicitly declared". Move.
  - "setup! virtual attribute excluded from attributeNames and serialization". Move.
  - "setup! does not override explicitly declared attribute". Move.
- `LazilyDefineAttributes#matches?` > "matches the writer name as well as the reader". Move.
- `acceptance skips nil` > "skips nil by default" duplicates
  `test_terms_of_service_agreement_no_acceptance` (`:14`). Delete.
- `acceptance options pass-through` > "passes custom interpolation vars through to errors.add" and
  "reserved key accept does not appear in error options". Move.

The six siblings already moved (`absence-`, `confirmation-`, `format-`, `inclusion-`, `presence-`,
`with-validation.trails.test.ts`) show the shape: a `describe("<RailsClass> (trails-only)")` for the
tests lifted out of the Rails-named describe, the trailing describes moved verbatim, and the
now-unused imports and `eslint-disable` header dropped from the Rails-named file.

## Acceptance criteria

- [ ] The seven TS-only tests live in `validations/acceptance-validation.trails.test.ts`; the two duplicates of an already-ported Rails case are deleted. No test is renamed.
- [ ] `acceptance-validation.test.ts` holds only Rails' 10 cases, with no unused import left behind.
- [ ] `pnpm parity:test --package activemodel` reports no `extra (TS only)` and still 1012/1020, 56/56 files.

## Verification

```bash
pnpm vitest run packages/activemodel/src/validations/acceptance-validation
pnpm parity:test --package activemodel --missing && pnpm parity:test:assertions
```
