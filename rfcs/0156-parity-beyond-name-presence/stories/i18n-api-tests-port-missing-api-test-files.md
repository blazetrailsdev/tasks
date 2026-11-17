---
title: "i18n: port the cascade, lazy_loadable, memoize and pluralization api suites"
status: draft
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: [i18n]
deps:
  [
    i18n-port-backend-cascade,
    i18n-port-backend-memoize,
    i18n-port-backend-pluralization,
    i18n-port-backend-lazy-loadable,
    i18n-api-tests-port-localization-procs,
    i18n-api-tests-port-interpolation-and-link,
  ]
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

`I18n::Tests::*` is enrolled in `LIB_TEST_MODULES` (`scripts/test-compare/extract-ruby-tests.rb`) by the
`i18n-api-tests-mount-lib-test-modules-unmeasured` PR, so every `vendor/i18n/v1.14.8/test/api/*_test.rb`
now measures the mounted tests. That PR ported Basics, Defaults, Lookup and Pluralization as registrars
in `packages/i18n/test/support/tests/*.ts` (`testsBasics()` etc.), enrolled in `REQUIRED_TEST_MODULES`
in `scripts/test-compare/extract-ts-core.ts`, and mounted them in `packages/i18n/test/api/{chain,fallbacks,key-value,simple}.test.ts`.

Remaining: `vendor/i18n/v1.14.8/test/api/{all_features,cascade,lazy_loadable,memoize,pluralization}_test.rb` have no TS twin under `packages/i18n/test/api/`; each mounts the full `I18n::Tests::*` set (~143 tests each).

**Narrowed by the `i18n-test-parity-100` RFC.** `api/all_features_test.rb` is permanently
unportable, because its backend includes `I18n::Backend::Cache` and
`Metadata` (`all_features_test.rb:11-18`). It is dropped from this story.
Each remaining suite needs its backend mixin first, hence the deps. The api
suites are a few dozen lines each, since they only mount registrars that
already exist.

## Acceptance criteria

- [ ] Create the missing api test files with their Rails setup and own tests, mounting the already-ported registrars.
- [ ] Each registrar is added to `REQUIRED_TEST_MODULES` in `scripts/test-compare/extract-ts-core.ts` and mounted in every
      `packages/i18n/test/api/*.test.ts` whose Rails twin `include`s the module.
- [ ] `pnpm parity:test:assertions` stays green.
- [ ] Port `api/{cascade,lazy_loadable,memoize,pluralization}_test.rb` only, and
      delete their unported-files rows.
