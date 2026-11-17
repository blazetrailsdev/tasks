---
title: "i18n: port I18n::Tests::Localization::Procs into the api suites"
status: draft
updated: 2026-11-17
rfc: "0245-i18n-test-parity-100"
cluster: api-mixins
packages: [i18n]
deps: [i18n-api-tests-port-localization-datetime-and-time]
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

`vendor/i18n/v1.14.8/lib/i18n/tests/localization/procs.rb` has 9 tests (`:7-63`) that store
lambdas as `:proc` formats and as `day_names` / `month_names` /
`abbr_month_names` (`setup_time_proc_translations`, `:86-118`). They assert on
`Procs.inspect_args(args, kwargs)` (`:67-83`), which renders Ruby `inspect`
of a Date / DateTime / Time and a Hash. Use `rbInspect` so the rendered string
matches Ruby's.

Mounted by `vendor/i18n/v1.14.8/test/api/{chain,fallbacks,simple}_test.rb`. `key_value_test.rb:14`
comments it out, so do not mount it in `key-value.test.ts`.

trails: the proc-format arm is `Base#translateLocalizationFormat` and
`resolve` (`packages/i18n/lib/backend/base.ts:311`, `:364-395`).

## Acceptance criteria

- [ ] `testsLocalizationProcs()` under the Rails names, in `REQUIRED_TEST_MODULES`,
      mounted in chain / fallbacks / simple only.
- [ ] `inspect_args` is ported as a helper beside the registrar, with the Ruby
      body's branches.
- [ ] `pnpm parity:test -- --package i18n`: the chain, fallbacks and simple
      rows reach Miss = 0, provided Phase 1's other stories have landed.
