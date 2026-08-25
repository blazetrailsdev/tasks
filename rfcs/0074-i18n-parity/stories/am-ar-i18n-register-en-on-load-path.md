---
title: "Register Active Model's and Active Record's en locales on I18n.load_path"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6084
claim: "2026-08-04T18:21:59Z"
assignee: "am-ar-i18n-register-en-on-load-path"
blocked-by: null
closed-reason: null
---

# Register Active Model's and Active Record's `en` locales on `I18n.load_path`

## Context

Sibling arms of `as-i18n-register-en-on-load-path` (#6017), which converges the
same deviation in Active Support. Both remaining framework packages still store
their locale straight into the backend instead of appending it to the load path:

- `packages/activemodel/src/i18n.ts:21` — `I18n.backend().storeTranslations("en", en);`
- `packages/activerecord/src/i18n.ts:16` — same

Rails appends instead, from an `ActiveSupport.on_load(:i18n)` hook at the bottom
of `activemodel/lib/active_model.rb` and `activerecord/lib/active_record.rb`, in
the shape `activesupport/lib/active_support/i18n.rb:16-17` uses:

```ruby
I18n.load_path << File.expand_path("locale/en.yml", __dir__)
```

`I18n::Backend::Simple#init_translations`
(`vendor/i18n/lib/i18n/backend/simple.rb:83-86`) then reads the path on first
use and after every `I18n.reload!`. Both trails headers already name this as
debt to retire "once the load hook lands"; the file-loading lane
(`i18n-backend-file-loading-localize`) and the reload re-read
(`i18n-reload-rereads-load-path`, #6030) have since landed, so the original
justification no longer holds.

Fallout this deviation is currently forcing, found while wiring
`Backend::Fallbacks` into AR (#6034):

- `packages/activerecord/src/test-helpers/i18n.ts` cannot port
  `reset_i18n_load_path` faithfully. Rails snapshots and restores both halves at
  `activerecord/test/cases/validations/i18n_generate_message_validation_test.rb:17-25`:

  ```ruby
  @old_load_path, @old_backend = I18n.load_path.dup, I18n.backend
  I18n.load_path.clear
  I18n.backend = Backend.new
  yield
  ensure
    I18n.load_path.replace @old_load_path
    I18n.backend = @old_backend
  ```

  `resetI18nLoadPath` in
  `packages/activerecord/src/validations/i18n-generate-message-validation.test.ts`
  snapshots the backend only, because there is no load path to clear or replace.

- `resetI18n` carries an invented `backend` parameter so a case can install a
  mixin over `Simple`. With the locales on the load path, the stand-in collapses
  into Rails' own two statements and the parameter goes away.
- `I18n.reloadBang()` drops each framework's translations permanently rather
  than re-reading them.

## Acceptance criteria

- Active Model's and Active Record's `en` locales reach the backend through
  `I18n.load_path`, matching the shape `as-i18n-register-en-on-load-path`
  settles on for Active Support; the direct `storeTranslations` calls in
  `packages/activemodel/src/i18n.ts` and `packages/activerecord/src/i18n.ts` are
  gone, along with the header paragraphs excusing them.
- `I18n.reloadBang()` re-reads both locales instead of dropping them.
- `packages/activerecord/src/test-helpers/i18n.ts` loses the `backend`
  parameter on `resetI18n`, and `resetI18nLoadPath` snapshots, clears and
  restores the load path as well as the backend, per the Ruby above.
- No new baseline row, `@noRailsEquivalent` tag or skip is added.

## Notes

`as-i18n-register-en-on-load-path` has landed (PR #6017, merged) — follow the
pattern it established rather than inventing a second one.
