---
title: "Run test_help's hooks per test: ActiveSupport::TestCase instance lifecycle, ActionDispatch.test_app, boot-app e2e"
status: in-progress
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activesupport", "actionpack"]
deps: []
deps-rfc: []
est-loc: 350
priority: 5
pr: trails#8149
claim: "2026-09-26T16:32:02Z"
assignee: "normalize-erb-in-test-compare-descriptions"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/test-help.ts` ports `railties/lib/rails/test_help.rb` onto
`run_load_hooks` seats (`active_support_test_case`, `action_controller_test_case`,
`action_dispatch_integration_test`). It includes `TestFixtures` into
`ActiveSupport::TestCase` and sets `fixture_paths` and the routes `before_setup`,
but nothing in trails _runs_ those per test yet:

- `packages/activesupport/src/test-case.ts` drives the suite through module-level
  vitest `beforeEach`/`afterEach` that call the STATIC `TestCase.beforeSetup` /
  `afterTeardown`. Minitest instantiates the test class per test and calls the
  instance `before_setup` chain, which is where `TestFixtures#before_setup`
  (`activerecord/lib/active_record/test_fixtures.rb`) and test_help's
  `before_setup` overrides (`test_help.rb:35-47`) run. So an app's
  `fixtures :all` never loads a row.
- `IntegrationTest` (`packages/actionpack/src/action-dispatch/testing/integration.ts`)
  is not an `ActiveSupport::TestCase` subclass, so it inherits no
  `fixture_paths` class_attribute (test_help.ts guards with `?? []`) and nobody
  calls its `beforeSetup`.
- `ActionDispatch.test_app` (`actionpack/lib/action_dispatch.rb:127`, set at
  `action_dispatch/railtie.rb:80`) is unported, so `IntegrationTest.app`
  (`integration.rb:676-682`) has no fallback to the booted application.
- `maintain_test_schema` loads the schema through a temporary pool
  (`Migration.loadSchemaBang`, `packages/activerecord/src/migration.ts`), which
  a `:memory:` sqlite database (the boot-app fixture's
  `config/database.ts`) never sees.

## Acceptance criteria

- A per-test instance of `ActiveSupport::TestCase` runs its instance
  `before_setup`/`after_teardown` chain, so an included `TestFixtures` loads and
  rolls back fixtures per test.
- `ActionDispatch.testApp` is ported and seated by the ActionDispatch trailtie;
  `IntegrationTest.app` falls back to it.
- A boot-app fixture test uses only the generated `test/test-helper.ts` plus a
  `test/fixtures/<table>.yml` and passes a model test, a controller test that
  renders a view, and an integration test routed through the app's own
  `config/routes.ts` (the remaining AC of `port-rails-test-help-for-applications`).
