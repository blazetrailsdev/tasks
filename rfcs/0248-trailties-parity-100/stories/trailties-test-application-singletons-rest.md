---
title: "trailties-test-application-singletons-rest"
status: ready
updated: 2026-11-25
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps:
  - activesupport-port-evented-file-update-checker
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

`trailties-test-application-singletons` ported backtrace_cleaner (both files),
url_generation, watcher, view_reloading, current_attributes_integration,
json_params_parsing and rendering's first test. Still
Miss, each with what blocked it:

- `vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb:580` "locale menu selects correct option":
  `config.i18n.available_locales` is never applied, `I18n::Railtie.initialize_i18n` is unported
  (`activesupport/lib/active_support/i18n_railtie.rb:34-80`; story `i18n-railtie-initialize-i18n-applies-config`).
- `application/action_view_test_integration_case_test.rb:33` "can use url helpers": an
  `ActionView::TestCase` built with `Isolation` overflows the stack in
  `spliceMethodMissing`'s `get` trap (`packages/actionpack/lib/action-dispatch/testing/assertions/routing.ts:291-306`):
  the miss on `@_controller` re-enters `receiver.controller`.
- `application/rendering_test.rb:47` "New formats and handlers are detected from initializers":
  a handler registered in an initializer needs the build-time view pipeline
  (packages/actionview/CLAUDE.md, "Templates are precompiled").
- `application/integration_test_case_test.rb` (2), run through `bin/trails test`: "resets Action
  Mailer test deliveries" fails with `cannot load such file -- <app>/.trails/views/base-mailer/welcome.html.tse.js`
  (the generated mailer's views are not built before the run); "app method of integration tests
  returns test_app by default" overflows the stack in the same `spliceMethodMissing` trap as above
  when an `IntegrationTest` is constructed in the app.
- `system_test_case_test.rb` (3), `active_job_adapter_test.rb` (3), `per_request_digest_cache_test.rb` (2),
  `bin_setup_test.rb` (2), `active_storage/validating_service_test.rb` (1),
  `active_storage/uploads_integration_test.rb` (1), `railties/test/path_generation_test.rb` (1):
  not started. `active_job_adapter` and `bin_setup` run `bin/trails test` / `bin/setup`
  through the harness's `trails()`, which works (see `test-runner.test.ts`).

## Acceptance criteria

- [ ] Every listed test is matched in `pnpm parity:test -- --package trailties`, or parked `PERMANENT-SKIP:` naming a CLAUDE.md section.
- [ ] Lib fixes land with the tests or are filed.
