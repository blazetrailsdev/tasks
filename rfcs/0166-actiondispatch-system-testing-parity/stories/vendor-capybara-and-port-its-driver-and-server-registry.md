---
title: "Vendor Capybara 3.40.0 and port the driver and server registry Rails reaches"
status: draft
updated: 2026-09-27
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: []
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

Rails' system testing calls Capybara directly:

- `SystemTestCase` includes `Capybara::DSL` and `Capybara::Minitest::Assertions`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_test_case.rb:115-116`)
- `SystemTesting::Driver#register` → `Capybara.register_driver`, and `#setup` →
  `Capybara.current_driver = name` (`system_testing/driver.rb`)
- `SystemTesting::Server#set_server` / `#set_port` →
  `Capybara.server`, `Capybara.servers[:default]`,
  `Capybara.always_include_port` (`system_testing/server.rb:24-29`)
- the Rails tests read `Capybara.current_driver`, `Capybara.server` and
  `Capybara.always_include_port`
  (`test/dispatch/system_testing/{server,system_test_case}_test.rb`)

trails has no Capybara (`grep -rl Capybara packages/*/src` finds only one test).
Rails pins `capybara (3.40.0)` (`vendor/rails/v8.0.2/Gemfile.lock:160`).

## Acceptance criteria

- Capybara 3.40.0 is a vendored source (`vendor/sources.ts`, procedure in
  `vendor/README.md`).
- A new `capybara` package ports, at Ruby names from `lib/capybara.rb` and
  `lib/capybara/config.rb` / `session_config.rb`: `register_driver`, `drivers`, `current_driver` / `current_driver=`, `default_driver`, `javascript_driver`,
  `use_default_driver`, `register_server`, `servers`, `server` / `server=`,
  `always_include_port`, `app_host`, `server_host`, `server_port`. The
  `Capybara::DSL` / `Capybara::Minitest::Assertions` modules are
  `port-capybara-dsl-and-minitest-assertions-modules`.
- The package is registered everywhere a new package needs to be (workspace,
  tsconfig references, CI, the parity package list); `parity:api` compares it
  against the vendored lib.
- If the registry does not fit beside the vendoring and package setup, ship the
  vendoring and package here and file the registry remainder in this RFC.
