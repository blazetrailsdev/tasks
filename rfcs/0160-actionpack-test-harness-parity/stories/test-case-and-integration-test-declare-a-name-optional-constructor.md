---
title: "ActionController::TestCase and IntegrationTest declare a name-optional constructor Rails does not have"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8380. `ActionController::TestCase`
(`packages/actionpack/src/action-controller/test-case.ts`) and
`ActionDispatch::IntegrationTest`
(`packages/actionpack/src/action-dispatch/testing/integration.ts:71`) each declare

```ts
constructor(name?: string) {
  super(name!);
}
```

Rails defines no `initialize` on either class
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:368-697`,
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb`).
`Minitest::Runnable#initialize(name)` takes a required name, and trails'
`Minitest.Test` constructor (`packages/activesupport/src/testing/assertions.ts:61`)
does too. The override exists only to let about 70 test call sites write
`new TestCase()` / `new SomeControllerTest()` with no name, and it is the one member
left in `TestCase`'s class body that Rails does not have.

## Acceptance criteria

- Neither class declares a constructor.
- Call sites that build a test case by hand pass the test name, as
  `Minitest::Runnable#initialize` requires, or go through the runner.
- `parity:api:extra --package actioncontroller` and `--package actiondispatch` do
  not grow.
