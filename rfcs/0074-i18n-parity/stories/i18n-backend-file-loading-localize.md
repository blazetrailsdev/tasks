---
title: "i18n-backend-file-loading-localize"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5995
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/backend/base.ts` ports `I18n::Backend::Base` except for the
translation-file lane and `localize`:

- `vendor/i18n/lib/i18n/backend/base.rb` — `load_translations`, `load_file`,
  `load_rb`, `load_yml` (+ `load_yaml` alias), `load_json`, `localize`,
  `translate_localization_format`.
- `vendor/i18n/lib/i18n/backend/simple.rb` — `init_translations` currently only
  flips `@initialized`; it must call `load_translations` first.
- `vendor/i18n/lib/i18n/backend/transliterator.rb` — the `Base` mixin.

Blockers to solve: no `node:*` imports and async-fs-only (so `load_file` needs
an injected reader or a fs abstraction), and no new third-party runtime deps
(so YAML needs a hand-rolled reader or a vendored-safe subset). `load_rb` has
no JS analogue — decide whether it maps to dynamic `import()` of a `.js`
locale module or is dropped with a `SKIP_GROUPS` entry.

## Acceptance criteria

- `load_translations` / `load_file` / `load_json` / `load_yml` land on
  `Backend::Base`, raising `UnknownFileType` and `InvalidLocaleData` as the gem
  does, and `Simple#initTranslations` calls `loadTranslations`.
- `localize` + `translate_localization_format` ported.
- The `simple load_translations:` / `simple load_rb:` / `simple load_yml:` /
  `simple load_json:` tests from `vendor/i18n/test/backend/simple_test.rb` are
  ported with their Rails names, plus the `test_data/locales` fixtures.
