---
title: "i18n: test/api/*_test.rb mount I18n::Tests::* lib modules that parity:test does not measure"
status: draft
updated: 2026-10-03
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `lint-test-runs-lint-tests-against-compliant-model` PR, which taught
`scripts/test-compare/extract-ruby-tests.rb` to follow an `include` of a module of
`def test_*` methods that a gem's LIB defines (`collect_lib_modules`), behind the
only-grow enrollment set `LIB_TEST_MODULES` (`ActiveModel::Lint::Tests` only), with
`LIB_TEST_MODULES` in `scripts/test-compare/extract-ts-core.ts` as its TS twin.

i18n has the same shape and is not enrolled. `vendor/i18n/*/lib/i18n/tests/*.rb`
(`basics.rb`, `defaults.rb`, `interpolation.rb`, `link.rb`, `localization.rb` and
`localization/*.rb`, `lookup.rb`, `pluralization.rb`, `procs.rb`) define the
`I18n::Tests::*` modules, and `vendor/i18n/*/test/api/*_test.rb` mount them with
`include I18n::Tests::Basics` and friends (109 `include I18n::Tests` lines). Because
the extractor never followed them, `api/chain_test.rb`, `api/fallbacks_test.rb`,
`api/key_value_test.rb` and `api/simple_test.rb` each measure 1 test and read as
fully ported. With every `::`-qualified lib module resolved, a trial run measured
143, 143, 125 and 143 Rails tests in those four files (about 550 unmeasured tests).

## Acceptance criteria

- [ ] `I18n::Tests::*` is enrolled in `LIB_TEST_MODULES` (Ruby) and its TS twin, so
      `pnpm parity:test` measures the mounted tests in every `test/api/*_test.rb`.
- [ ] The mounted tests are ported under the Rails names in the matching
      `packages/i18n/src/api/*.test.ts`, or the population is split into follow-up
      stories sized to the PR ceiling.
- [ ] `pnpm parity:test:assertions` stays green.

## Verification

```bash
pnpm parity:test && pnpm parity:test:assertions
```
