---
title: "Extract I18n::Base methods from the i18n umbrella file"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6092
claim: "2026-08-04T20:56:04Z"
assignee: "i18n-date-subx-cb-decomposition"
blocked-by: null
closed-reason: null
---

## Context

PR #5978 enrolled i18n in `parity:api`. The comparison now reports the
facade file as:

```text
../i18n.rb    i18n.ts    0    3    3   0%
```

A 3-method denominator — but `vendor/i18n/lib/i18n.rb` defines 19 `def`s
plus 3 aliases inside `module I18n; module Base`. Only the three aliases
(`t`, `t!`, `l`) are extracted. The other 19 are invisible to the
comparison:

- `vendor/i18n/lib/i18n.rb:212` `translate`
- `vendor/i18n/lib/i18n.rb:231` `translate!`
- `vendor/i18n/lib/i18n.rb:255` `interpolation_keys`
- `vendor/i18n/lib/i18n.rb:266` `exists?`
- `vendor/i18n/lib/i18n.rb:325` `transliterate`
- `vendor/i18n/lib/i18n.rb:336` `localize`
- `vendor/i18n/lib/i18n.rb:347` `with_locale`
- `vendor/i18n/lib/i18n.rb:364` `normalize_keys`
- `vendor/i18n/lib/i18n.rb:376` `locale_available?`
- `vendor/i18n/lib/i18n.rb:381` `enforce_available_locales!`
- `vendor/i18n/lib/i18n.rb:387` `available_locales_initialized?`
- `vendor/i18n/lib/i18n.rb:393` `translate_key`
- `vendor/i18n/lib/i18n.rb:423` `handle_exception`
- `vendor/i18n/lib/i18n.rb:441` `normalize_key`
- `vendor/i18n/lib/i18n.rb:465` `interpolation_keys_from_translation`
- plus `config`, `config=`, `reload!`, `eager_load!`
  (`vendor/i18n/lib/i18n.rb:57`, `:63`, `:84`, `:92`)

Cause: `scripts/api-compare/extract-ruby-api.rb:341` `scan_umbrella_file`
deliberately harvests only module-level singleton config
(`singleton_class.attr_accessor` and the `class << self; attr_accessor`
block form), attributing it to `<Module>::Base`. That is correct for
Rails, where `lib/active_record.rb` is an autoload manifest carrying no
real method bodies. The i18n gem is different: `lib/i18n.rb` is where
`I18n::Base` — the whole public facade — is actually defined.

Consequence: `i18n-facade-translate-interpolate` can port `translate` /
`localize` / `with_locale` and the parity number will not move, because
the denominator does not contain them. The measurement reads as done
against surface it never saw. This is the same class of silent gap the
`interpolate/ruby.rb` override in #5978 fixed, one layer up.

## Acceptance criteria

- `extract-ruby-api.rb` fully extracts method definitions from an
  umbrella file when the file defines real methods, rather than only
  singleton config. Rails' umbrella files must keep their current
  behavior — the existing `<Module>::Base` attribution and the
  junk-drawer-bucket avoidance it was built for stay intact (a
  package-scoped opt-in is acceptable if a general rule regresses Rails).
- `parity:api` reports `../i18n.rb` against a denominator of 22
  (19 defs + 3 aliases), not 3.
- No other package's totals move; confirm against a pre-change run.
- Extractor unit coverage for the new path in
  `scripts/api-compare/`, and the number recorded in the PR.
