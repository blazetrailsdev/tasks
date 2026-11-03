---
title: "Port the mailbox and action_mailbox:install generators and the install task"
status: draft
updated: 2026-11-03
rfc: "0000-actionmailbox-port"
cluster: amb-engine
packages: ["actionmailbox", "trailties"]
deps:
  [
    "actionmailbox-engine-routes-and-trailties-wiring",
    "trailties-generators-test-case-and-behavior",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionmailbox/lib/rails/generators/mailbox/mailbox_generator.rb:5-31`:
  `Rails::Generators::MailboxGenerator < NamedBase`, `check_class_collision
suffix: "Mailbox"`, `create_mailbox_file` (and `application_mailbox.rb`
  when missing), `hook_for :test_framework`, private `file_name` and
  `application_mailbox_file_name`; templates `application_mailbox.rb.tt`,
  `mailbox.rb.tt`, and `USAGE`.
- `lib/rails/generators/test_unit/mailbox_generator.rb:5-19` and
  `templates/mailbox_test.rb.tt`.
- `lib/generators/action_mailbox/install/install_generator.rb:7-27`:
  `create_action_mailbox_files`, `add_action_mailbox_production_environment_config`,
  `create_migrations` (`railties:install:migrations
FROM=active_storage,action_mailbox`).
- `lib/tasks/install.rake:4-6`: `action_mailbox:install`.
- RFC 0212's Non-goals leave ActionMailbox's "generator hooks" unowned:
  `railties/lib/rails/generators.rb:158` hides `action_mailbox:install`, and
  `railties/lib/rails/commands/app/update_command.rb:72` passes
  `skip_action_mailbox: !defined?(ActionMailbox::Engine)`.

Tests: `test/generators/mailbox_generator_test.rb` (6) and railties'
`test/generators/action_mailbox_install_generator_test.rb` (3), which
`port-remaining-generator-tests-onto-test-case` (RFC 0212) lists and this
story takes over.

## Acceptance criteria

- The three generators are ported on trailties' generator base with `.ts.tt`
  templates, emitting a TypeScript mailbox and mailbox test per
  `packages/trailties/CLAUDE.md` § "The application loader is Zeitwerk".
- `generators.rb:158` and `update_command.rb:72` name ActionMailbox as Rails
  does, wherever trailties already ports those lists.
- Both test files pass on trailties' `Generators::TestCase`, names verbatim.
