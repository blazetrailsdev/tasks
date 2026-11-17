---
title: "i18n: port I18n::Tests::Procs and ::Localization::Date into the api suites"
status: draft
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 500
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

Remaining: `I18n::Tests::Procs` (`vendor/i18n/v1.14.8/lib/i18n/tests/procs.rb`) and `I18n::Tests::Localization::{Date,DateTime,Time,Procs}` (`lib/i18n/tests/localization/*.rb`, ~450 lines). Bare registrar names `date`/`time`/`procs` collide with other helpers (the TS extractor matches registrar calls by bare identifier), so use `testsProcs`, `testsLocalizationDate` etc.

**Narrowed by the `i18n-test-parity-100` RFC.** This story now covers `Tests::Procs` (9 tests,
`procs.rb:6-56`; chain, fallbacks and simple, since `key_value_test.rb:9`
comments it out) and `Tests::Localization::Date` (21 tests, `localization/date.rb:13-100`;
all four suites). DateTime and Time are
`i18n-api-tests-port-localization-datetime-and-time`, and
`Localization::Procs` is `i18n-api-tests-port-localization-procs`.
`procs: lookup ... :resolve => false` asserts `.class == Proc`, so port it as
`typeof … === "function"`.

## Acceptance criteria

- [ ] Port `Tests::Procs` and `Tests::Localization::Date` under the Rails test names, as `testsProcs()` and `testsLocalizationDate()`.
- [ ] Each registrar is added to `REQUIRED_TEST_MODULES` in `scripts/test-compare/extract-ts-core.ts` and mounted in every
      `packages/i18n/test/api/*.test.ts` whose Rails twin `include`s the module.
- [ ] `pnpm parity:test:assertions` stays green.
