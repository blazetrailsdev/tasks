---
title: "activesupport: TestCase hand-assigns Assertions/Deprecation/ConstantStubbing/TimeHelpers as statics instead of including the modules"
status: draft
updated: 2026-10-04
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8477, which moved `ErrorReporterAssertions` onto `include()`.
`packages/activesupport/src/test-case.ts` still hand-assigns the other mixins' methods as statics:
`static assertNot = assertNot` through `assertNoChanges` (Testing::Assertions),
`assertDeprecated` / `assertNotDeprecated` / `collectDeprecations` (Testing::Deprecation),
`stubConst` (Testing::ConstantStubbing), and `travel` / `travelTo` / `travelBack` / `freezeTime` /
`unfreezeTime` (Testing::TimeHelpers).

Rails includes the modules, so the methods are INSTANCE methods of the test
(`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:147-151`):

```ruby
include ActiveSupport::Testing::Assertions
include ActiveSupport::Testing::ErrorReporterAssertions
include ActiveSupport::Testing::Deprecation
include ActiveSupport::Testing::ConstantStubbing
include ActiveSupport::Testing::TimeHelpers
```

CLAUDE.md § "Module mixins" names the `static x = x` shape as the one to replace with `include()`.
`ErrorReporterAssertions` and `FileFixtures` show the converged shape: a module object in the Rails
file, `include(TestCase, Module)`, and a `declare` per member on the class.

## Acceptance criteria

- [ ] `Assertions`, `Deprecation`, `ConstantStubbing` and `TimeHelpers` are module objects in their
      Rails-named files and reach `TestCase` through `include()`, in `test_case.rb:147-151`'s order.
- [ ] The hand-assigned statics are gone from `test-case.ts`; callers of `TestCase.assertX` are moved to
      the instance method or the bare export.
- [ ] `parity:api:extra --package activesupport` lists nothing new on `test-case.ts`.
