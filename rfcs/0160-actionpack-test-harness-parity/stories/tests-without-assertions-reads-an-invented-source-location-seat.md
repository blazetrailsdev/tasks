---
title: "TestsWithoutAssertions#after_teardown reads an invented sourceLocation seat where Rails calls method(name).source_location"
status: in-progress
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8411
claim: "2026-10-02T17:22:05Z"
assignee: "tests-without-assertions-reads-an-invented-source-location-seat"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping trails PR 8373.

Rails' `ActiveSupport::Testing::TestsWithoutAssertions#after_teardown` reads the test's location by reflection (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/tests_without_assertions.rb:13`):

```ruby
file, line = method(name).source_location
```

trails' port (`packages/activesupport/src/testing/tests-without-assertions.ts`) reads `const [file, line] = this.sourceLocation`, a field on the `Minitest::Test` stand-in (`packages/activesupport/src/testing/assertions.ts`, `Test#sourceLocation`) that `packages/activesupport/src/testing/autorun.ts` writes from the vitest task (`task.file.filepath`, `task.location.line`) before `afterTeardown()`.

`sourceLocation` is a member Minitest does not have. It exists because a vitest test is the `it()` callback, not a method named `name` on the test case, and ruby-compat's `Method` (`packages/ruby-compat/src/method.ts`, `rbObjMethod`) has no `source_location`.

## Converged shape

The body reads `rbObjMethod(this, this.name).sourceLocation()` (or the ruby-compat spelling of `Method#source_location`, `vendor/ruby/v3.3.11/proc.c` `rb_method_location`), with the runner defining the running test as a method on the test case whose `Method` carries the task's file and line. `Test#sourceLocation` is deleted.

## Acceptance criteria

- `TestsWithoutAssertions#afterTeardown` makes the `method(name)` and `source_location` calls Rails makes; no `sourceLocation` field on `Minitest.Test`.
- "without assertions" (`packages/activesupport/src/testing/test-without-assertions.test.ts`) stays green and still prints the test file and line.
- If a JS function cannot carry a source location by any route, block the story with that specific reason rather than receipting the field.
