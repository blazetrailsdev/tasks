---
title: "port-log-subscriber-remaining-subscribe-log-level"
status: claimed
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-03T12:50:47Z"
assignee: "port-log-subscriber-remaining-subscribe-log-level"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::LogSubscriber`
(`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb`) declares
eight `subscribe_log_level` registrations, one per logging method:

- `:start_processing, :info` (`:24`)
- `:process_action, :info` (`:45`)
- `:halted_callback, :info` (`:50`)
- `:send_file, :info` (`:55`)
- `:redirect_to, :info` (`:60`)
- `:send_data, :info` (`:65`)
- `:unpermitted_parameters, :debug` (`:75`)
- the `:#{method}, :info` inside the `%w(write_fragment ...).each` loop (`:86`)

`packages/actionpack/src/action-controller/log-subscriber.ts` had none until PR
7377, which added the `start_processing` one alongside its port of that body
(`log_subscriber.rb:9-27`). The other seven are still missing, so those events
are published without the level check `LogSubscriber.silenced` reads
(`activesupport/lib/active_support/log_subscriber.rb:126`,
`packages/activesupport/src/log-subscriber.ts:126`).

The idiom is settled — `packages/actionpack/src/action-dispatch/log-subscriber.ts:18`
is `LogSubscriber.subscribeLogLevel("redirect", "info")`, and PR 7377 added the
`start_processing` twin at the bottom of the ActionController file.

Note `log_subscriber.rb:80-88` also defines the `write_fragment` /
`read_fragment` / `exist_fragment?` / `expire_fragment` / `expire_page` /
`write_page` methods themselves through `class_eval`, and the port has no
counterpart for those bodies either; registering their level is only meaningful
once they exist.

## Acceptance criteria

- Each `subscribe_log_level` in `log_subscriber.rb` has a
  `LogSubscriber.subscribeLogLevel(...)` counterpart at the Rails method name
  and level, for every method the port actually defines.
- The `:86` loop's registrations land with the `class_eval`-defined bodies, or
  the story states plainly that those bodies are unported and files that
  separately.
- `pnpm parity:api:calls` shows no new rows; the actionpack suite is green.
