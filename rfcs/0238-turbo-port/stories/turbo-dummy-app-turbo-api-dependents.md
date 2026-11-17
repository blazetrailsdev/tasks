---
title: "turbo-dummy-app-turbo-api-dependents"
status: blocked
updated: 2026-11-17
rfc: "0238-turbo-port"
cluster: null
packages: []
deps:
  - turbo-broadcastable-class-methods-and-callbacks
  - turbo-broadcastable-instance-broadcasts
  - turbo-package-helpers-and-turbo-stream-format
  - turbo-frames-native-and-request-id
  - turbo-broadcasts-and-streams-channel
  - turbo-test-helpers
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-17T21:21:49Z"
assignee: "turbo-dummy-app-turbo-api-dependents"
blocked-by: "waits on the deps: none of Broadcastable, turbo_stream format, Native::Navigation/current_request_id, StreamsChannel or test helpers is ported (packages/turbo/lib/turbo-trails.ts is empty)"
closed-reason: null
---

## Context

`turbo-dummy-test-app` ported `vendor/turbo-rails/v2.0.23/test/dummy` into
`packages/turbo/test/dummy/`, but every piece that calls a turbo-rails API
not yet ported was left out, since it cannot be written without that API:

- `app/models/article.rb:6` `broadcasts "overriden-stream", target: ...`,
  `app/models/board.rb:2` `broadcasts_refreshes`, `app/models/comment.rb:6-9`
  `broadcasts_to ...`, `app/models/users/profile.rb:4`
  `include Turbo::Broadcastable` (needs the Broadcastable port).
- `app/controllers/messages_controller.rb:16-21` (`create`, `format.turbo_stream`),
  `notifications_controller.rb:2-6` and `posts_controller.rb:2-6` (`create`):
  need the `turbo_stream` Mime type and `render turbo_stream:`.
- `app/controllers/trays_controller.rb` (`recede_or_redirect_to` &c., Turbo::Native::Navigation)
  and `request_ids_controller.rb` (`Turbo.current_request_id`).
- `app/channels/section_channel.rb`, `app/channels/application_cable/*.rb`, and
  `require "action_cable/engine"` in `config/application.rb:4` (the activerecord
  vitest project cannot resolve `@blazetrails/trailties/health-controller` today).
- `config/initializers/turbo.rb` and `inspect_helpers.rb`.
- `test/test_helper.rb:15-41`: the `ActiveSupport::TestCase` setup resetting
  `Turbo.current_request_id`, `with_production_debouncer`, and
  `ActionViewTestCaseExtensions`, in `packages/turbo/test/test-helper.ts`.

## Acceptance criteria

- Each item above is added to `packages/turbo/test/dummy/` (or the test
  helper) by the story that ports the API it calls, verbatim to the gem.
- `packages/turbo/test/dummy/boot.trails.test.ts` still passes.
- With `trays_controller.rb` in place, the `Turbo::DriveHelperTest` integration tests
  (`vendor/turbo-rails/v2.0.23/test/drive/drive_helper_test.rb:3-19`) are ported into
  `packages/turbo/test/drive/drive-helper.test.ts`. With `inspect_helpers.rb` in place,
  `test/initializers/helpers_test.rb` is ported too. trails#10274 ported the unit half.
