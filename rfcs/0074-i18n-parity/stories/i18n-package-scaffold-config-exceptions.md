---
title: "Scaffold packages/i18n and port Config + exceptions"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 1
pr: 5969
claim: "2026-08-03T13:44:01Z"
assignee: "i18n-package-scaffold-config-exceptions"
blocked-by: null
closed-reason: null
---

# Scaffold packages/i18n and port Config + exceptions

## Context

There is no TS home for the i18n gem — `vendor/sources.ts` vendors
`vendor/i18n` (ruby-i18n/i18n v1.14.8) with `compareApi: false` /
`compareTests: false` because the package-name → `packages/<name>/src`
derivation (`scripts/api-compare/config.ts:46` `packageSrcDir`) cannot
resolve. Today's shims live in `packages/activesupport/src/i18n.ts` and
`packages/activemodel/src/i18n.ts` with divergent backends.

Port targets:

- `vendor/i18n/lib/i18n/config.rb:9-161` — `locale`, `backend`,
  `default_locale`, `available_locales(_set)`, `default_separator`,
  `exception_handler`, `missing_interpolation_argument_handler`, `load_path`,
  `enforce_available_locales`, `interpolation_patterns`.
- `vendor/i18n/lib/i18n/exceptions.rb` — `ArgumentError`, `Disabled`,
  `InvalidLocale`, `InvalidLocaleData`, `MissingTranslation(.Base)`,
  `MissingTranslationData`, `InvalidPluralizationData`,
  `MissingInterpolationArgument`, `ReservedInterpolationKey`,
  `UnknownFileType`. Note the existing partial port of
  `MissingInterpolationArgument` at `packages/activemodel/src/i18n.ts:29-40`.

## Acceptance criteria

- New workspace package `packages/i18n` (`@blazetrails/i18n`) wired into the
  monorepo build/typecheck/vitest the same way `packages/did-you-mean` is.
- `packages/i18n/src/config.ts` and `packages/i18n/src/exceptions.ts` mirror
  the gem files method-for-method; error `name` handling per repo convention.
- Unit tests alongside as `*.test.ts`; existing shims untouched (consolidation
  is a later story).
- Do NOT flip the compare flags yet (that is the enrollment story).
