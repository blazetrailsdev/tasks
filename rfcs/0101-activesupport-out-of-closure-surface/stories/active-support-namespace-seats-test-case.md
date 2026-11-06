---
title: "ActiveSupport namespace seats TestCase (ActiveSupport::TestCase autoload)"
status: draft
updated: 2026-11-06
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails autoloads `ActiveSupport::TestCase` (`vendor/rails/v8.0.2/activesupport/lib/active_support.rb`, `autoload :TestCase`), so generated test files name it `ActiveSupport::TestCase` (`railties/lib/rails/generators/test_unit/plugin/templates/%file_name%_test.rb.tt:3`). trails' `ActiveSupport` namespace object (`packages/activesupport/src/index.ts`) has no `TestCase` seat, so the `test_unit:plugin` template added in trails#9789 imports `TestCase` from `@blazetrails/activesupport/test-case` instead of reading `ActiveSupport.TestCase`.

## Acceptance criteria

- `test-case.ts` seats itself on the namespace (`ActiveSupport.TestCase = TestCase`), with a declared `TestCase` property on the namespace type, following the RFC 0151 seat shape.
- `packages/trailties/src/generators/test-unit/plugin/templates/%file_name%.test.ts.tt` extends `ActiveSupport.TestCase`.
