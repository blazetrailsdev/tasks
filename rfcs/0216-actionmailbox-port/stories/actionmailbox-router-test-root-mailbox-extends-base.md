---
title: "Router test RootMailbox extends ActionMailbox::Base"
status: ready
updated: 2026-11-07
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps:
  - actionmailbox-base-and-callbacks
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionmailbox/src/unit/router.test.ts` defines `RootMailbox` as a test-local class answering `static receive` and `process`, because `ActionMailbox::Base` was unported when trails#9829 landed. Rails' `vendor/rails/v8.0.2/actionmailbox/test/unit/router_test.rb:5-10` has `class RootMailbox < ActionMailbox::Base` with only `process`; `receive` is `Base.receive` (`actionmailbox/lib/action_mailbox/base.rb`).

## Acceptance criteria

- After `actionmailbox-base-and-callbacks` lands, `RootMailbox` extends `ActionMailbox.Base` and defines only `process`, reading `this.mail` as Rails does.
- The test-local `receive` and constructor are deleted; all 15 router tests still pass.
