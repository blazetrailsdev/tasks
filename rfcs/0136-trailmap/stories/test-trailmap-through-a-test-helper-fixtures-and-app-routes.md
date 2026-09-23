---
title: "Test trailmap through one test helper, fixtures and the application's own routes"
status: draft
updated: 2026-09-23
rfc: "0136-trailmap"
cluster: null
packages: ["trailties", "activerecord"]
deps: ["port-rails-test-help-for-applications"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From the trailmap Rails-idiom audit. trailmap's suite builds its own harness in
every file, where a Rails app has one `test/test_helper.rb`, fixtures, and
integration tests against the app's own routes:

- `test/models/schema.ts:13-17`, `migrateScratchDatabase()`, calls
  `Base.establishConnection({ adapter: "sqlite3", database: ":memory:", pool: 1 })`
  and runs `MigrationContext` by hand. 18 test files call it, then
  `loadModelSchemas()`, in `beforeAll`.
- Controller tests re-prepend view paths per file
  (`test/controllers/home-controller.test.ts:10-12`, `dashboard-controller.test.ts:22`,
  `backlog-page.test.ts`, `test/views/status-badge.test.ts:5`) because the
  suite never boots the application.
- Data comes from `Model.create(...)` in each file's `beforeAll`
  (`test/controllers/rfc-pages-controller.test.ts:15-64`,
  `backlog-page.test.ts:25-63`, and others) and from raw SQL
  (`test/models/barrel-registration.test.ts:58-64`). No `test/fixtures/*`
  exist, although the generator created the directory.
- `test/routes.test.ts:5-9` draws a private `new RouteSet()` from the exported
  `drawRoutes` and asserts on `route.controller` strings. Rails asserts
  `assert_recognizes` / `assert_routing` against the application's routes, or
  exercises them through `ActionDispatch::IntegrationTest`.
- The request-body tests that hand-build a rack env
  (`test/controllers/mutations-controller.test.ts`,
  `read-models-controller.test.ts`) are already owned by
  `bump-vendored-trails-for-testcase-request-bodies`. This story leaves them
  there.

Rails' shape: `test/test_helper.rb` sets the env, boots `config/environment`,
requires `rails/test_help` and declares `fixtures :all`
(`railties/lib/rails/generators/rails/app/templates/test/test_helper.rb.tt:1-21`).
`test_help` maintains the test schema, loads `test/fixtures`, and points
controller and integration tests at `Rails.application.routes`
(`railties/lib/rails/test_help.rb:13-47`). trails has no port of that yet:
`port-rails-test-help-for-applications` (0142), which this story depends on.

## Acceptance criteria

- A `test/test-helper.ts` in the shape of the generated one, loaded by vitest
  as a setup file, boots the app in `test` against a test database from
  `config/database.ts` and loads fixtures. `migrateScratchDatabase`,
  per-file `prependViewPath` and per-file `loadModelSchemas` calls are gone.
- The shared rows the controller and model tests seed by hand become
  `test/fixtures/<table>` files. A test that needs a one-off row may still
  create it inline.
- `test/routes.test.ts` asserts recognition against the application's route
  set, using the route assertions trails ports.
- `test/models/barrel-registration.test.ts` is deleted if
  `eager-scan-registers-app-models-for-string-association-targets` (0142) has
  landed, since its premise goes away. Otherwise it stays.
- `pnpm test` passes with no assertion changes beyond harness plumbing.
