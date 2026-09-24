---
title: "i18n hand-rolls Ruby inspect in exceptions.ts and fallbacks.ts instead of rbInspect"
status: draft
updated: 2026-09-24
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

i18n renders its error messages with Ruby's `inspect`: `InvalidLocale`
(`vendor/i18n/lib/i18n/exceptions.rb:34`), `MissingTranslation`'s Proc options (`:54`),
`InvalidPluralizationData` (`:94`), `MissingInterpolationArgument` (`:102`),
`ReservedInterpolationKey` (`:110`), `Backend::Base#localize` (`backend/base.rb:82`),
and `Locale::Fallbacks#inspect` (`locale/fallbacks.rb:86-88`,
`"#<#{self.class.name} @map=#{@map.inspect} @defaults=#{@defaults.inspect}>"`).

trails hand-rolls that renderer instead of using ruby-compat's `rbInspect`:
`inspect` / `inspectString` / `inspectSymbol` / `inspectSymbolOrString` in
`packages/i18n/src/exceptions.ts` (a second `String#inspect` escaper and a hash
renderer that treats every string key as a Symbol), and `inspectSymbol` /
`inspectLocales` in `packages/i18n/src/locale/fallbacks.ts`. trails#8041 routed only
the scalar fallthrough through `rbInspect`.

The divergence is the Symbol model: i18n keys and locales are Ruby Symbols, which
CLAUDE.md ports as `":name"` strings, so `rbInspect` renders them with no helper.

## Acceptance criteria

- The i18n message sites call `rbInspect` (or the value's own ported `inspect`) on
  values that carry Ruby's Symbol-ness as `":name"` strings. The hand-rolled
  renderers in `exceptions.ts` and `locale/fallbacks.ts` are deleted.
- The i18n exception and fallbacks tests keep their Rails-verbatim messages.
