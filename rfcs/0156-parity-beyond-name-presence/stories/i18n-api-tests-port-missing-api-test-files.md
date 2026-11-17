---
title: "i18n-api-tests-port-missing-api-test-files"
status: draft
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
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

`I18n::Tests::*` is enrolled in `LIB_TEST_MODULES` (`scripts/test-compare/extract-ruby-tests.rb`) by the
`i18n-api-tests-mount-lib-test-modules-unmeasured` PR, so every `vendor/i18n/v1.14.8/test/api/*_test.rb`
now measures the mounted tests. That PR ported Basics, Defaults, Lookup and Pluralization as registrars
in `packages/i18n/test/support/tests/*.ts` (`testsBasics()` etc.), enrolled in `REQUIRED_TEST_MODULES`
in `scripts/test-compare/extract-ts-core.ts`, and mounted them in `packages/i18n/test/api/{chain,fallbacks,key-value,simple}.test.ts`.

Remaining: `vendor/i18n/v1.14.8/test/api/{all_features,cascade,lazy_loadable,memoize,pluralization}_test.rb` have no TS twin under `packages/i18n/test/api/`; each mounts the full `I18n::Tests::*` set (~143 tests each).

## Acceptance criteria

- [ ] Create the missing api test files with their Rails setup and own tests, mounting the already-ported registrars.
- [ ] Each registrar is added to `REQUIRED_TEST_MODULES` in `scripts/test-compare/extract-ts-core.ts` and mounted in every
      `packages/i18n/test/api/*.test.ts` whose Rails twin `include`s the module.
- [ ] `pnpm parity:test:assertions` stays green.
