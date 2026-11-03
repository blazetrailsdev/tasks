---
title: "Port InboundEmail::Incineratable, Incineration and IncinerationJob, and the InboundEmail tests"
status: draft
updated: 2026-11-03
rfc: "0216-actionmailbox-port"
cluster: amb-core
packages: ["actionmailbox"]
deps: ["actionmailbox-base-and-callbacks", "port-activejob-exceptions"]
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

- `vendor/rails/v8.0.2/actionmailbox/app/models/action_mailbox/inbound_email/incineratable.rb:6-20`:
  `after_update_commit :incinerate_later, if: -> { ActionMailbox.incinerate &&
status_previously_changed? && processed? }`, `incinerate_later`
  (`IncinerationJob.schedule self`), `incinerate` (`Incineration.new(self).run`).
- `incineratable/incineration.rb:8-25`: `run` (`destroy!` if `due? &&
processed?`), private `due?` (`updated_at < incinerate_after.ago.end_of_day`)
  and `processed?`.
- `app/jobs/action_mailbox/incineration_job.rb:12-24`: `queue_as {
ActionMailbox.queues[:incineration] }`, `discard_on
ActiveRecord::RecordNotFound`, `self.schedule` (`set(wait:
ActionMailbox.incinerate_after).perform_later`), `perform`.

Tests: `test/unit/inbound_email/incineration_test.rb` (4),
`test/jobs/incineration_job_test.rb` (1), `test/unit/inbound_email_test.rb` (7).

## Acceptance criteria

- The three files are ported line for line; the `if:` lambda reads
  `ActionMailbox.incinerate` with Ruby truthiness.
- `incinerate`, `run` and `perform` are async.
- The three test files pass, names verbatim, with time travel through
  activesupport's `travel` helpers.
