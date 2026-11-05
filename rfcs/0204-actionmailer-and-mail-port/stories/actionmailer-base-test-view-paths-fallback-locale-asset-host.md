---
title: "actionmailer-base-test-view-paths-fallback-locale-asset-host"
status: draft
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Still unported from `vendor/rails/v8.0.2/actionmailer/test/base_test.rb` into `packages/actionmailer/src/base.test.ts`:

- `:418` implicit multipart with fallback locale (needs `I18n::Backend::Fallbacks` and `implicit_with_locale.de-AT.text` / `.de.html` fixtures)
- `:442` implicit multipart with several view paths uses the first one with template; `:453` ... inexistent templates uses the next view path (`fixtures/another.path/base_mailer/welcome.erb`)
- `:584` calling deliver, ActionMailer should yield back to mail to let it call :do_delivery on itself
- `:625` you can specify the template path for implicit lookup (`BaseMailer#welcome_from_another_path`)
- `:633`, `:642` asset_host tests (`mailers/asset_mailer.rb`, `fixtures/asset_mailer/welcome.html.erb`)

## Acceptance criteria

- Each test ported under its Rails name with the matching `BaseMailer` / `AssetMailer` actions and fixtures.
