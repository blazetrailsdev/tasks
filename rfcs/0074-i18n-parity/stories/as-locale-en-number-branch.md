---
title: "Port the number branch of active_support/locale/en.yml"
status: blocked
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-03T19:32:42Z"
assignee: "as-locale-en-number-branch"
blocked-by: "Already implemented by open PR #6008 (branch i18n-consolidate-activesupport-shim-d9f4, commit 4c721f386 'feat(activesupport): port the number branch of the en locale'), which also adds the prerequisite packages/activesupport/src/locale/en.ts — that file does not exist on origin/main, so there is nothing to build against here and duplicating it would stack on an unmerged PR. Unblock once #6008 merges; verify the number branch is present and close as done against #6008."
closed-reason: null
---

## Context

`packages/activesupport/src/locale/en.ts` (added by
`i18n-consolidate-activesupport-shim`) mirrors
`vendor/rails/activesupport/lib/active_support/locale/en.yml` for the `date`,
`time`, `support` and `number.nth` branches only. The whole `number.format` /
`number.currency` / `number.percentage` / `number.precision` / `number.human`
tree of en.yml (`vendor/rails/activesupport/lib/active_support/locale/en.yml:36-146`)
is still missing: in trails those values live only in
`NumberConverter::DEFAULTS`
(`packages/activesupport/src/number-helper/number-converter.ts`), so storing
them into the backend changes what
`NumberConverter#i18nFormatOptions` reads back (it currently finds nothing for
`en` and falls through to `defaultFormatOptions`).

Rails has both: `DEFAULTS` in
`vendor/rails/activesupport/lib/active_support/number_helper/number_converter.rb`
_and_ the en.yml tree, and `i18n_format_options` merges over the defaults with
identical values.

## Acceptance criteria

- The `number` branch of `active_support/locale/en.yml` is present in
  `packages/activesupport/src/locale/en.ts`, keyed exactly as the YAML is
  (snake_case), including `storage_units` / `decimal_units`.
- `NumberConverter` keeps its `DEFAULTS` (Rails has both); the number-helper
  suites stay green with the locale data in place.
