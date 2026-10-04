---
title: "parity: LIB_TEST_MODULES is defined twice and the TS fold matches a bare namespace name"
status: draft
updated: 2026-10-04
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Trails PR 8465 taught both test extractors to follow a lib module of tests, each behind its
own enrollment constant:

- `LIB_TEST_MODULES = %w[ActiveModel::Lint::Tests]` in
  `scripts/test-compare/extract-ruby-tests.rb`, keyed by the Ruby constant path;
- `LIB_TEST_MODULES = { Tests: "packages/activemodel/src/lint.ts" }` in
  `scripts/test-compare/extract-ts-core.ts`, keyed by the bare TS namespace name.

Nothing ties the two together, so enrolling a module on one side only makes every mounted
test an assertion-count mismatch (Ruby only) or folds assertions Rails never counted (TS
only). And `helperCalleeName` matches a call by the bare namespace name alone, so any
`Tests.testFoo(...)` call folds `lint.ts`'s body whatever module `Tests` was imported from.
A second enrolled module named `Tests` (i18n's `I18n::Tests::*`, story
`i18n-api-tests-mount-lib-test-modules-unmeasured`) cannot be expressed.

## Acceptance criteria

- [ ] One enrollment table (Ruby constant path -> TS file and namespace) is the source for
      both extractors, or a scripts test fails when the two disagree.
- [ ] The TS fold resolves the namespace through the test file's import of the enrolled lib
      file, not by bare name.
- [ ] A scripts test covers a same-named namespace imported from another file not folding.

## Verification

```bash
pnpm vitest run scripts/test-compare/lib-test-modules.test.ts && pnpm parity:test:assertions
```
