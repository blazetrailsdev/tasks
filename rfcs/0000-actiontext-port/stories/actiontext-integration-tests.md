---
title: "Port the controller, job and mailer render integration tests"
status: draft
updated: 2026-11-03
rfc: "0000-actiontext-port"
cluster: at-engine
packages: ["actiontext"]
deps: ["actiontext-engine", "actionmailer-base-mail-and-collector"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/test/integration/controller_render_test.rb` (6),
  `job_render_test.rb` (1), `mailer_render_test.rb` (1).
- Dummy app pieces they need: `test/dummy/app/controllers/{messages_controller.rb,admin/**}`,
  `app/jobs/broadcast_job.rb`, `app/mailers/{application,messages}_mailer.rb`,
  `app/views/{messages,admin/messages,messages_mailer,layouts,people}/**`.
- The mailer test needs ActionMailer (RFC 0204,
  `actionmailer-base-mail-and-collector`).

## Acceptance criteria

- The dummy controllers, job, mailer and views are mirrored as written
  (views as `.tse`).
- The 8 tests pass; they exercise `Content.with_renderer` through the
  engine's `around_action` and the default `action_controller_renderer`.
