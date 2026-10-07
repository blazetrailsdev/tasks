---
title: "actionview: port ActiveRecordTestCase, SQLCounter and the remaining active_record_unit fixtures"
status: draft
updated: 2026-10-06
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
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

`vendor/rails/v8.0.2/actionview/test/active_record_unit.rb` has two halves. The connector,
`ActiveRecordTestConnector` (`:6-78`), is ported at
`packages/actionview/src/test-helpers/active-record-unit.ts` with the actionview sqlite schema
(`test-helpers/fixtures/db_definitions/sqlite.sql`), `fixtures/project.ts` and `projects.yml`.

The other half is not ported: `class ActiveRecordTestCase < ActionController::TestCase`
(`active_record_unit.rb:80-131`) with `include ActiveRecord::TestFixtures`, its `tests`
override reading `controller::ROUTES`, `fixture_paths` / `use_transactional_tests = false`,
the `fixtures` and `run` guards on `ActiveRecordTestConnector.connected`, `capture_sql` and
`SQLCounter` subscribed to `sql.active_record`; and the
`ActiveSupport::Testing::Parallelization.after_fork_hook { ActiveRecordTestConnector.reconnect }`
registration (`:135-137`). The remaining fixture models (`company.rb`, `developer.rb`,
`mascot.rb`, `reply.rb`, `topic.rb`) and their `.yml` rows under
`vendor/rails/v8.0.2/actionview/test/fixtures/` are not mirrored either.

`controller_runtime_test.rb` needs none of that, but every other file under
`vendor/rails/v8.0.2/actionview/test/activerecord/` subclasses `ActiveRecordTestCase` or
`ActionView::TestCase` with those fixtures.

## Acceptance criteria

- [ ] `ActiveRecordTestCase` and `SQLCounter` are ported into
      `packages/actionview/src/test-helpers/active-record-unit.ts` at their Rails names.
- [ ] The remaining fixture models and `.yml` files are mirrored under
      `packages/actionview/src/test-helpers/fixtures/`.
- [ ] One Rails test file under `actionview/test/activerecord/` that subclasses
      `ActiveRecordTestCase` is ported on top of it and credited by `pnpm parity:test --package actionview`.
