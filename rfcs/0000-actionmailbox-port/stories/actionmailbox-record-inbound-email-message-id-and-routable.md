---
title: "Port ActionMailbox::Record, InboundEmail, its MessageId and Routable concerns, RoutingJob and the migration"
status: draft
updated: 2026-11-03
rfc: "0000-actionmailbox-port"
cluster: amb-core
packages: ["actionmailbox"]
deps:
  [
    "actionmailbox-package-and-parity-enrollment",
    "actionmailbox-mail-ext",
    "activestorage-attached-model-and-one",
    "activestorage-blob-and-downloader",
    "activestorage-migrations-and-test-database",
    "port-activejob-enqueuing-and-configured-job",
    "mail-date-and-message-id-fields-and-field-specs-remainder",
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionmailbox/app/models/action_mailbox/record.rb:4-9`: abstract `Record < ActiveRecord::Base`,
  then `run_load_hooks :action_mailbox_record`.
- `app/models/action_mailbox/inbound_email.rb:27-55`: includes
  `Incineratable, MessageId, Routable`; `has_one_attached :raw_email,
service: ActionMailbox.storage_service`; `enum :status, %i[ pending
processing delivered failed bounced ]`; `mail` (memoized
  `Mail.from_source(source)`), `source` (memoized `raw_email.download`),
  `processed?`, `instrumentation_payload`; `run_load_hooks
:action_mailbox_inbound_email`.
- `inbound_email/message_id.rb:12-41`: class methods
  `create_and_extract_message_id!` (SHA1 checksum, `create!`, `rescue
ActiveRecord::RecordNotUnique` → `nil`) and private `extract_message_id`,
  `generate_missing_message_id` (`Mail::MessageIdField`, `Socket.gethostname`,
  a `logger.warn`; `Mail::MessageIdField` is on main at
  `packages/mail/src/fields/message-id-field.ts`), `create_and_upload_raw_email!` (`Blob.create_and_upload!`
  with `service_name: ActionMailbox.storage_service`).
- `inbound_email/routable.rb:8-24`: `after_create_commit :route_later, if:
:pending?`, `route_later` (`RoutingJob.perform_later self`), `route`
  (`ApplicationMailbox.route self`).
- `app/jobs/action_mailbox/routing_job.rb:6-12`: `queue_as {
ActionMailbox.queues[:routing] }`, `perform` calls `inbound_email.route`.
- `db/migrate/20180917164000_create_action_mailbox_tables.rb`: the
  `action_mailbox_inbound_emails` table, its uniqueness index, and private
  `primary_key_type` from `Rails.configuration.generators`.

`Incineratable` is included here as the module it is, and its body is ported
by `actionmailbox-incineration-and-inbound-email-tests`.

Tests: `test/unit/inbound_email/message_id_test.rb` (2),
`test/models/table_name_test.rb` (1), `test/migrations_test.rb` (2).

## Acceptance criteria

- Each file is ported at its Rails path; `InboundEmail` is
  `ActionMailbox::InboundEmail` seated on the namespace.
- `source`, `mail` and `create_and_extract_message_id!` are async, per the
  RFC's Design section "Reading the raw email is async"; `mail` keeps its
  `@mail ||=` memo.
- `route` reads `TopLevel.ApplicationMailbox!` at call time (RFC Design,
  "Constants Rails resolves at call time"), with no guard.
- `MessageId` is a Concern whose `ClassMethods` go through `extend()`; its
  privates are `private` + `@internal`.
- The migration is a `.ts` migration under the package's `db/migrate`, run by
  the package's test setup together with ActiveStorage's.
- The three test files pass, names verbatim.
