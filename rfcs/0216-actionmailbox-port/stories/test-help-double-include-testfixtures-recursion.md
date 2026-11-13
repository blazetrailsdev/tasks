---
title: "test_help double-includes TestFixtures and rbCallSuper recurses"
status: ready
updated: 2026-11-13
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps:
  - testfixtures-subclass-then-parent-include-super-cycle
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

Loading `@blazetrails/trailties/test-help` (Rails `railties/lib/rails/test_help.rb`) inside the vitest "activerecord" project OOMs. `activerecord/src/cases/helper.ts` registers ActiveRecord's TestCase (which already includes `TestFixtures`) as the default spec class; test-help then includes `TestFixtures` into `ActiveSupport::TestCase` again (`vendor/rails/v8.0.2/railties/lib/rails/test_help.rb:20-30`), and `rbCallSuper` in `TestFixtures#before_setup` recurses on the duplicate seat until the heap is exhausted. Ruby's `include` of an already-included module is a no-op (`vendor/ruby/v3.3.11/class.c:1253` include_modules_at skips modules already in the ancestry).
Surfaced while building actionmailbox's dummy app (actionmailbox-test-dummy-app-and-transactional-tests), which had to call `Migration.maintainTestSchemaBang()` directly instead of loading test-help.

## Acceptance criteria

- Including `TestFixtures` into a class whose ancestry already has it is a no-op, as in Ruby; `rbCallSuper` does not self-recurse.
- actionmailbox's `test-helpers/test-helper.ts` can import `@blazetrails/trailties/test-help` as Rails' `test_helper.rb` requires `rails/test_help`.
