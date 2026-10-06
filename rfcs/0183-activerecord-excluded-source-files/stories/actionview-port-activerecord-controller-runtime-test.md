---
title: "actionview: port test/activerecord/controller_runtime_test.rb and the active_record_unit harness"
status: in-progress
updated: 2026-10-06
rfc: "0183-activerecord-excluded-source-files"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8592
claim: "2026-10-06T18:33:17Z"
assignee: "actionview-port-activerecord-controller-runtime-test"
blocked-by: null
closed-reason: null
---

## Context

`activerecord-port-railties-controller-runtime` un-excluded
`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/controller_runtime.rb`; its unported-files row named
`controller_runtime_test.rb` as the test, but no such file exists under `activerecord/test/cases`. The Rails test is
`vendor/rails/v8.0.2/actionview/test/activerecord/controller_runtime_test.rb` (`ControllerRuntimeLogSubscriberTest`,
5 tests), which `parity:test --package actionview` expects at
`packages/actionview/src/activerecord/controller-runtime.test.ts` and reports as 0/5.

Nothing under `actionview/test/activerecord/` is ported. The test needs `active_record_unit`
(`vendor/rails/v8.0.2/actionview/test/active_record_unit.rb`: `ActiveRecordTestConnector`, an in-memory sqlite3
connection, the actionview fixture schema and `fixtures/project`), `ActionController::TestCase` with `with_routes`,
`ActiveSupport::LogSubscriber::TestHelper`, and `render inline:` of a TSE template. `packages/actionview/package.json`
has no dependency on `@blazetrails/activerecord` or `@blazetrails/actionpack`, so the harness has to decide how an
actionview test reaches both (a devDependency, as Rails' `active_record_unit.rb:16-27` loads AR from the sibling gem).

## Acceptance criteria

- [ ] `active_record_unit.rb`'s `ActiveRecordTestConnector` is ported for actionview tests, with the `Project` fixture
      model and its fixture rows mirrored from `vendor/rails/v8.0.2/actionview/test/fixtures/`.
- [ ] `packages/actionview/src/activerecord/controller-runtime.test.ts` ports all five tests with Rails' names
      (`log with active record`, `runtime reset before requests`, `log with active record when post`,
      `log with active record when redirecting`, `include time query time after rendering`) and Rails' assertions.
- [ ] `ActionController::Base.include(ActiveRecord::Railties::ControllerRuntime)`
      (`controller_runtime_test.rb:9`) is the test file's own include, as in Rails.
- [ ] `pnpm parity:test --package actionview` credits the file 5/5.
