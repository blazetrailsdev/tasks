---
title: "ActionMailer::Base.descendants misses bare subclasses in delivery_job_filter"
status: draft
updated: 2026-11-07
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TestHelper#delivery_job_filter` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/test_helper.rb:258-262`) is `Base.descendants.map(&:delivery_job).include?(job_class)`. trails#9805 converged `packages/actionmailer/src/test-helper.ts` `deliveryJobFilter` onto that shape.

`ActionMailer.Base.descendants` answers `[]` for a bare `class M extends ActionMailer.Base {}` that never writes a class attribute, because a subclass is seated only on its first own write (CLAUDE.md § "`Class#subclasses` is seated on a class's first own write"). The old `[Base, ...descendants]` arm hid this, since every mailer inheriting the default `deliveryJob` matched through `Base`. A mailer that writes nothing on itself is now invisible to `assert_enqueued_emails` / `assert_no_enqueued_emails` filtering.

## Acceptance criteria

- A test with a bare `ActionMailer::Base` subclass, ported from the Rails `test_helper_test.rb` enqueued-email cases, enqueues a delivery, and `assertEnqueuedEmails(1)` passes.
- `deliveryJobFilter` stays `ActionMailer.Base.descendants.map(...)`.
