---
title: "Port ActionView::Helpers::TranslationHelper + translation_helper_test"
status: claimed
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-10-17T19:55:14Z"
assignee: "activejob-arguments-serialize-accepts-a-hash"
blocked-by: null
closed-reason: null
---

## Context

`TranslationHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/translation_helper.rb`: `translate`/`t`, `localize`/`l`, `raise_on_missing_translations`, `debug_missing_translation`, privates `scope_key_by_partial`, `missing_translation`) has no trails file; the register excuses it as "trails ports the I18n gem itself, not the view wrappers", which is a scope choice, not a reason. `actionview/test/template/translation_helper_test.rb` is unported.

## Acceptance criteria

- [ ] `helpers/translation-helper.ts` as a live Module on `Helpers`, using `@blazetrails/i18n`: html-safe `_html` keys, lazy `.key` lookup via the template's virtual path, missing-translation span.
- [ ] `translation_helper_test.rb` ported; parity row 0 missing.
