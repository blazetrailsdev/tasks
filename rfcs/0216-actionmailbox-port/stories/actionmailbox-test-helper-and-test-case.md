---
title: "Port ActionMailbox::TestHelper and ActionMailbox::TestCase"
status: draft
updated: 2026-11-03
rfc: "0216-actionmailbox-port"
cluster: amb-core
packages: ["actionmailbox"]
deps: ["actionmailbox-record-inbound-email-message-id-and-routable"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/test_helper.rb:6-95`: `create_inbound_email_from_fixture`
(`:9-11`, `file_fixture(name).read`), `create_inbound_email_from_mail`
(`:63-69`, `Mail.new(mail_options, &block)`, `mail[:bcc].include_in_headers =
true`), `create_inbound_email_from_source` (`:72-74`), and the three
`receive_inbound_email_from_*` forms (`:79-93`) that `tap(&:route)`. Every
`status:` kwarg defaults to `:processing`. `test_case.rb:7-12` is
`ActiveSupport::TestCase` including it, then
`run_load_hooks :action_mailbox_test_case`.

The gem's own `test/test_helper.rb` boots `test/dummy`, whose
`app/mailboxes/application_mailbox.rb` and `messages_mailbox.rb` the suite
routes to, and `test/fixtures/files/*.eml` are its fixtures.

Test: `test/unit/test_helper_test.rb` (1, "multi-part mail can be built in
tests using a block").

## Acceptance criteria

- `TestHelper` is a plain-object module `include()`d by `TestCase`; the
  `create_*` / `receive_*` methods are async and keep the `status` kwarg
  default.
- `create_inbound_email_from_mail`'s block is ported in the settled
  trailing-block shape.
- The package's test support seats the dummy app's two mailboxes on
  `TopLevel` and copies `test/fixtures/files` verbatim.
- `test_helper_test.rb` passes, name verbatim.
