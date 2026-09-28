---
title: "Port Capybara::DSL and Capybara::Minitest::Assertions as far as SystemTestCase reaches"
status: draft
updated: 2026-09-27
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: ["vendor-capybara-and-port-its-driver-and-server-registry"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::SystemTestCase` includes `Capybara::DSL` and
`Capybara::Minitest::Assertions`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_test_case.rb:115-116`),
and the rest of Rails' system-testing layer reaches, beyond the registry:
`Capybara.app = Rack::Builder.new …` (`system_test_case.rb:129`),
`Capybara.current_session.server_url` (`:185`), `Capybara.save_path` and
`page.save_page` / `page.save_screenshot`
(`system_testing/test_helpers/screenshot_helper.rb:95,112,116`), and
`Capybara.reset_sessions!` (`test_helpers/setup_and_teardown.rb:16`). Capybara's DSL
(`lib/capybara/dsl.rb` in the vendored gem) forwards each session method to
`page`; the assertions module (`lib/capybara/minitest.rb`) wraps the matchers.

This story ports only the members those Rails files and the four
`test/dispatch/system_testing/*_test.rb` files reach; the rest of Capybara is a
non-goal of RFC 0166.

## Acceptance criteria

- `Capybara::DSL` and `Capybara::Minitest::Assertions` exist in the `capybara` package at their Ruby names, and `Capybara.app`, `current_session`,
  `reset_sessions!`, `save_path` and the `Session#save_page` /
  `#save_screenshot` / `#server_url` that `page` returns exist — the calls
  listed above and nothing beyond them.
- `SystemTestCase` includes both with `include()`.
- Anything the Rails files call that is still missing is filed as a story in
  RFC 0166, not stubbed.
