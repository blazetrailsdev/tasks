---
title: "parity:api pairs an instance-level def new action with a TS new() method, not the constructor"
status: draft
updated: 2026-11-12
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rubyMethodToTsWithoutUnderscore` (`scripts/parity/conventions.ts`, the `if (name === "initialize" || name === "new") return ["constructor"]` arm) maps every Ruby `new` that has no `initialize` sibling to `constructor`. That includes an instance-level `def new` that is a controller action, such as `Rails::Conductor::ActionMailbox::InboundEmailsController#new` (`vendor/rails/v8.0.2/actionmailbox/app/controllers/rails/conductor/action_mailbox/inbound_emails_controller.rb:11`) and `InboundEmails::SourcesController#new` (`.../inbound_emails/sources_controller.rb:7`). The faithful TS port is an instance method `new()`, because routing dispatches the action by its name. `parity:api` scores both as missing (trails#10038). Only a class's own `self.new` / `ClassMethods#new` is the constructor (`OWN_NEW_TS_CANDIDATES`).

## Acceptance criteria

- An instance-method `new` in `rails-api.json` pairs with a TS instance method `new`. A class-level `new` still pairs with `constructor`.
- `scripts/parity/conventions.test.ts` covers both arms. The test "maps any new that is not a class's own to the constructor only away from initialize" is updated to cover the instance arm.
- The two conductor files score 100% on `parity:api`.
