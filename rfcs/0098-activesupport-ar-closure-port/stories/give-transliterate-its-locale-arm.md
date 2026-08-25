---
title: "transliterate has no locale arm, so parameterize cannot forward locale:"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6564
claim: "2026-08-15T13:45:02Z"
assignee: "wave-1c-relation-calculations-rows"
blocked-by: null
closed-reason: null
---

## Context

`Inflector.parameterize` (`inflector/transliterate.rb:123-147`) opens with:

```ruby
parameterized_string = transliterate(string, locale: locale)
```

and its own signature is
`parameterize(string, separator: "-", preserve_case: false, locale: nil)`.
`Inflector.transliterate` (`transliterate.rb:57-97`) uses that locale to look up
`i18n.transliterate.rule` in the I18n backend, so an app can register
locale-specific romanisation (Rails' own docs use the German `ü → ue` rule).

PR #6556 moved `parameterize` from `inflector.ts` to `transliterate.ts` and
rewrote it against the Rails body, but could not forward `locale:` — trails'
`transliterate` (`packages/activesupport/src/transliterate.ts`) has the
signature `transliterate(str, replacement = "?")` with no locale arm and no
I18n lookup at all. Its APPROXIMATIONS table is a fixed map. The gap is noted in
`parameterize`'s JSDoc; both functions are otherwise faithful.

## Converged shape

Give `transliterate` its Rails signature and body — `transliterate(string,
replacement = "?", locale: nil)` — including the
`I18n.transliterate` / `i18n.transliterate.rule` lookup that lets a locale
override the default approximations, then restore `locale` to `parameterize`'s
signature and forward it at the call site, so the first line reads as the Ruby
does. trails already has `I18n` in this package, so the lookup has a backend to
ask.

Read `vendor/rails/activesupport/lib/active_support/inflector/transliterate.rb`
and its test (`vendor/rails/activesupport/test/transliterate_test.rb`) before
writing — the locale-rule tests are the acceptance evidence.

## Acceptance criteria

- [ ] `transliterate` takes and honours `locale`, resolving
      `i18n.transliterate.rule` through I18n.
- [ ] `parameterize` forwards `locale:` to it, matching transliterate.rb:125.
- [ ] The JSDoc note in `parameterize` recording the missing locale arm is
      deleted (the gap is closed, not re-justified).
- [ ] Rails' transliterate locale tests are ported at their verbatim names.
