---
title: "turbo-dummy-inspect-helpers-initializer"
status: draft
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/test/dummy/config/initializers/inspect_helpers.rb` records
`ActionController::Base.ancestors` and `_helpers.ancestors` into globals while initializers run, and
`test/initializers/helpers_test.rb` ("AC::Base has the helpers in place when initializers run") asserts
`Turbo::Streams::TurboStreamsTagBuilder` / `Turbo::StreamsHelper` are in them. trails loads initializers through
`Engine#loadConfigInitializer` (`packages/trailties/lib/engine.ts:525`), so the recorded values need a seat a test
can read (the Ruby globals). Left over from `turbo-dummy-app-turbo-api-dependents`.

## Acceptance criteria

- `packages/turbo/test/dummy/config/initializers/inspect-helpers.ts` ports `inspect_helpers.rb`.
- `packages/turbo/test/initializers/helpers.test.ts` ports `Turbo::HelpersInInitializersTest` with the Rails test name.
