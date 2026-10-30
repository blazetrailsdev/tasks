---
title: "Port Rails::MailersController (mailer previews)"
status: ready
updated: 2026-10-30
rfc: "0000-trailties-port"
cluster: tt-surface
packages: ["trailties", "actionmailer"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/mailers_controller.rb` (122 lines) has no TS file:
0/12. It serves `ActionMailer::Preview` at `/rails/mailers`, with its views
under `railties/lib/rails/templates/rails/mailers`. It depends on
actionmailer's `Preview` (RFC 0204). If `Preview` is unported, block this
story on that 0204 story by id.

## Acceptance criteria

- `packages/trailties/src/mailers-controller.ts` ports the controller and its
  templates. It is routed in development as
  `vendor/rails/v8.0.2/actionmailer/lib/action_mailer/railtie.rb:87-89` routes it.
- `vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb` is ported once the
  isolation harness lands, as a separate story if this one is too large.
