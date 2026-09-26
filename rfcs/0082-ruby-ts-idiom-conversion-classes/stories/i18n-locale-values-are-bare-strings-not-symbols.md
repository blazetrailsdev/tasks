---
title: "I18n.locale and friends answer bare strings where Ruby answers Symbols"
status: draft
updated: 2026-09-26
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
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

Ruby's `I18n::Config#locale=` stores `locale && locale.to_sym`
(`vendor/i18n/v1.14.8/lib/i18n/config.rb:14-17`), so `I18n.locale`,
`I18n.default_locale` and the fallbacks chain are Symbols. trails' i18n package
types `Locale = string` (`packages/i18n/src/i18n.ts:9`) and stores the bare
spelling (`"en"`, `config.ts` `defaultLocale ??= "en"`), where the repo-wide
convention (CLAUDE.md "A Ruby Symbol is a JS string") spells a Symbol `":en"`.

trails#8141 had to convert at the consumer: `packages/actionview/src/lookup-context.ts`'s
`registerDetail("locale", ...)` maps `I18n.locale()`, `I18n.fallbacks().get(...)`
and `I18n.defaultLocale()` through `stringToSym`, where Rails'
`register_detail(:locale)` (`actionview/lib/action_view/lookup_context.rb:43-49`)
uses them as-is.

## Converged shape

`I18n.locale` / `default_locale` / `available_locales` / fallbacks answer
colon-spelled Symbols, `locale=` performs `to_sym`, and the `stringToSym` maps in
`lookup-context.ts`'s locale detail are deleted.

## Acceptance criteria

- `I18n.locale()` answers `":en"` by default; `setLocale("de")` then `locale()` answers `":de"`.
- `lookup-context.ts`'s locale detail is the Rails block with no `stringToSym`.
- i18n's own suite green (locale-keyed translation lookups still resolve).
