---
title: "Port rails/test_help for applications: the generated test helper is a stub with no boot, schema, fixtures or app routes"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 300
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. trailties has no port of
`rails/test_help`, and the generated test helper is a stub:

```ts
// packages/trailties/src/generators/app-generator.ts:763-771 → test/test-helper.ts
export async function setupTestDatabase(): Promise<void> {
  // Configure test database connection
}
```

So every trails app hand-builds its own test harness, and trailmap shows what
that costs:

- `test/models/schema.ts:13-17` establishes a `:memory:` connection and runs
  `MigrationContext` itself. Nearly every model and controller test calls it in
  `beforeAll`, then separately calls `loadModelSchemas()`.
- Every controller test re-prepends `app/views`
  (`test/controllers/home-controller.test.ts:10-12`,
  `test/views/status-badge.test.ts:5`, and the rest) because nothing boots the
  application for the suite.
- Test data is `Model.create(...)` in `beforeAll` and raw
  `INSERT` SQL (`test/models/barrel-registration.test.ts:58-64`). There are no
  `test/fixtures/*` files, because nothing would load them.
- `test/routes.test.ts:5-9` draws its own `new RouteSet()` from `drawRoutes`
  instead of asserting against the application's routes.

Rails' generated `test/test_helper.rb`
(`railties/lib/rails/generators/rails/app/templates/test/test_helper.rb.tt:1-21`)
sets `RAILS_ENV=test`, requires `config/environment` (booting the app, view
paths included), requires `rails/test_help`, and declares `fixtures :all`.
`railties/lib/rails/test_help.rb` then:

- `:13`: requires `rails/testing/maintain_test_schema` (load the schema if
  migrations are pending);
- `:15-24`: includes `ActiveRecord::TestFixtures` into
  `ActiveSupport::TestCase` with `fixture_paths << "#{Rails.root}/test/fixtures/"`;
- `:26-28`: shares those fixture paths with `ActionDispatch::IntegrationTest`;
- `:35-47`: points `@routes` at `Rails.application.routes` for both
  `ActionController::TestCase` and `ActionDispatch::IntegrationTest`.

trails has the parts (`ActiveRecord::TestFixtures`, `IntegrationTest` in
`packages/actionpack/src/action-dispatch/testing/integration.ts:67`, the
migration context). What's missing is the app-facing assembly. Note that
`IntegrationTest` defaults `routes` to a fresh `new RouteSet()` (`:68`), not the
application's. The `integration_test` generator is also absent from
`packages/trailties/src/generators/rails/`, while Rails has
`railties/lib/rails/generators/rails/integration_test/`.

## Acceptance criteria

- A trails port of `rails/test_help`, importable by an app's test helper, that
  boots the application in the `test` env, maintains the test schema from the
  env's database config (`maintain_test_schema`), loads fixtures from
  `test/fixtures/`, and points `ActionController::TestCase` /
  `IntegrationTest` routes at the application's route set. Each arm cites its
  `test_help.rb` line.
- The generated `test/test-helper.ts` mirrors `test_helper.rb.tt`: env, boot,
  test_help, `fixtures :all`. It is no longer a stub.
- A boot-app fixture test uses only the generated helper plus a
  `test/fixtures/<table>` file, and passes a model test, a controller test
  that renders a view, and an integration test that routes through the app's
  own `config/routes.ts`.
- The `integration_test` generator is either ported or filed as its own
  story.
