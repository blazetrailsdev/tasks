---
title: "activestorage-fixture-set-lazy-off-server-path"
status: draft
updated: 2026-11-13
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

`scripts/layout/server-path-closure.ts` reaches `packages/activesupport/dist/testing/file-fixtures.js` from `@blazetrails/actionmailbox/engine` → `activestorage/dist/engine.js` → `activestorage/dist/fixture-set.js`. `ActiveStorage::FixtureSet` includes `ActiveSupport::Testing::FileFixtures` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/fixture_set.rb:3`), but Rails autoloads it (`vendor/rails/v8.0.2/activestorage/lib/active_storage.rb:43`) and names it only inside the `on_load(:active_record_fixture_set)` / `on_load(:active_support_test_case)` blocks of `active_storage.fixture_set` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:191-203`), so the server path never loads it. trails imports it eagerly from `packages/activestorage/lib/index.ts:35`, `lib/engine.ts:39` and `lib/constants.generated.ts`. It is also reachable through the `./*` wildcard export as `./fixture-set`.

Split out of `server-path-activesupport-test-case-and-behaviors`, which cleared the `executor/test-helper.js` row.

## Acceptance criteria

- [ ] No non-testing export of the built tree, including each `./*` wildcard expansion, reaches `activesupport/dist/testing/file-fixtures.js`.
- [ ] The `activestorage-fixture-set-lazy-off-server-path` row is deleted from `scripts/layout/server-path-closure-exclude.json`.
