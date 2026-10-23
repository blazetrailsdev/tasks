---
title: "activerecord: TestFixtures as a plain module beneath ActiveSupport::TestCase's module lifecycle"
status: done
updated: 2026-10-23
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9247
claim: "2026-10-22T19:08:28Z"
assignee: "globalid-locate-many-composite-key-distinct-from-string"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::TestFixtures` (`packages/activerecord/src/test-fixtures.ts`) is still a ruby-compat `Module`. trails#9178 converted it to a plain module, then reverted the change.

`railties/lib/rails/test_help.rb:19` includes it into `ActiveSupport::TestCase` from `on_load(:active_support_test_case)` (`packages/trailties/src/test-help.ts:36`). trails' `ActiveSupport::TestCase` (`packages/activesupport/src/test-case.ts:81-99`) defines its own `beforeSetup` / `afterTeardown`, which inline the earlier modules' bodies. A plain-module copy cannot sit beneath a class's own method, so `TestFixtures#before_setup` / `#after_teardown` (`activerecord/lib/active_record/test_fixtures.rb:9-18`) never ran, and `packages/trailties/src/boot-app-test-help.trails.test.ts` went red.

In Rails, `ActiveSupport::TestCase` has no `before_setup` of its own. Those methods come from included modules, so `TestFixtures`, included later, sits above them.

## Acceptance criteria

- `ActiveSupport::TestCase`'s lifecycle methods come from its modules, as in Rails, rather than as own members. Then `TestFixtures` becomes a plain module whose `super` is `rbCallSuper`.
- No `new Module` remains in `test-fixtures.ts`, and `boot-app-test-help.trails.test.ts` is green.
