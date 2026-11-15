---
title: "activestorage-fixture-set-autoload-in-app-test-process"
status: draft
updated: 2026-11-15
rfc: "0223-package-layout-mirrors-a-rails-gem"
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

`ActiveStorage::FixtureSet` is autoloaded (`vendor/rails/v8.0.2/activestorage/lib/active_storage.rb:43`) and first named inside the synchronous `on_load(:active_record_fixture_set)` / `on_load(:active_support_test_case)` hooks of the `active_storage.fixture_set` initializer (`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:191-203`). Ruby's autoload loads it at that read. Since trails#10122 the port keeps it off the server path: `packages/activestorage/lib/engine.ts` reads the `ActiveStorage.FixtureSet` seat, and `lib/active-storage.ts`'s `loadPath` maps `active_storage/fixture_set` to the testing export `@blazetrails/activestorage/testing/fixture-set`. But an ESM `import()` is async, and nothing in a generated app's test process (`packages/trailties/lib/test-help.ts`, mirroring `vendor/rails/v8.0.2/railties/lib/rails/test_help.rb`, which does not name FixtureSet) awaits that load before the hooks fire. So in an app with Active Storage, loading AR fixtures hits a TypeError on the unset seat. activestorage's own tests import `lib/fixture-set.js` in `test/support/database/setup.ts`.

## Acceptance criteria

- [ ] A generated app's test process has `ActiveStorage.FixtureSet` seated before the `active_record_fixture_set` / `active_support_test_case` hooks read it, without putting `activesupport/dist/testing/file-fixtures.js` on the server path.
- [ ] The loading step is placed where an awaited step is legitimate (cf. CLAUDE.md § "An adapter file is loaded by an awaited step"), and is covered by a test that fails without it.
