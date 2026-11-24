---
title: "trailties-test-application-configuration-part-2-mailer-and-encoding"
status: ready
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
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

Unported from `vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb`:

- `:1322` / `:1335` "registers (multiple) interceptors with ActionMailer" and `:1387` / `:1400` "registers (multiple) observers with ActionMailer"
  assert `::Mail.class_variable_get(:@@delivery_interceptors)` / `:@@delivery_notification_observers`.
  `packages/mail/lib/mail.ts:118-119` keeps both as module-private `const` arrays, so nothing can read them.
  The test file also needs the top-level `MyMailInterceptor` / `MyMailObserver` classes (`configuration_test.rb:7-24`).
- `:1348` / `:1361` "registers (multiple) preview interceptors with ActionMailer" (`ActionMailer::Base.preview_interceptors`).
- `:699` / `:704` "skipping config.encoding still results in 'utf-8' as the default" / "config.encoding sets the default encoding"
  assert `Encoding.default_external` / `default_internal` (`configuration_test.rb:694-697`); `packages/ruby-compat/lib/encoding.ts:184-190` keeps them as `#private` statics.

## Acceptance criteria

- [ ] Mail's interceptor/observer registries are readable as Rails' class variables are, and the six ActionMailer tests are ported and pass.
- [ ] The two `config.encoding` tests are ported and pass, or are parked under a ratified CLAUDE.md section.
