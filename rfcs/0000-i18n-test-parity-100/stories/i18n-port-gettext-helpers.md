---
title: "i18n: port I18n::Gettext and Gettext::Helpers with api_test.rb and gettext_plural_keys_test.rb"
status: draft
updated: 2026-11-17
rfc: "0000-i18n-test-parity-100"
cluster: gettext
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `gettext` exclusion (`scripts/parity/unported-files/i18n.ts`, "A Ruby
toolchain concern with no trails consumer") is a deferral, not a ratified limit.

- Lib: `vendor/i18n/v1.14.8/lib/i18n/gettext.rb` (28 lines: `PLURAL_SEPARATOR`,
  `CONTEXT_SEPARATOR`, `plural_keys`) and `vendor/i18n/v1.14.8/lib/i18n/gettext/helpers.rb`
  (75 lines: `gettext`/`_`, `sgettext`/`s_`, `pgettext`/`p_`,
  `ngettext`/`n_`, `nsgettext`/`ns_`, `npgettext`/`np_`).
- Tests: `vendor/i18n/v1.14.8/test/gettext/api_test.rb` (34 tests) and
  `vendor/i18n/v1.14.8/test/i18n/gettext_plural_keys_test.rb` (3 tests). `api_test.rb` loads
  translations with `store_translations`, not from a `.po` file, so this
  story needs no parser.
- Names: `_`, `s_`, `n_` &c. follow `docs/ruby-ts-conventions.md`. Check
  `SKIP_GROUPS` before you pick a spelling for `_`.

## Acceptance criteria

- [ ] `packages/i18n/lib/gettext.ts` and `packages/i18n/lib/gettext/helpers.ts`
      mirror the Ruby files.
- [ ] All 37 tests are ported under the Rails names.
- [ ] The `gettext` exclusion is narrowed to `gettext/po_parser.rb` and
      `backend/gettext.rb` (and `gettext/backend_test.rb`). The
      `gettext_plural_keys_test.rb` row is deleted.
