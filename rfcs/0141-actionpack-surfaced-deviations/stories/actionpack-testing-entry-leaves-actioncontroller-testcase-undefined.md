---
title: "Importing @blazetrails/actionpack/testing leaves ActionController.TestCase undefined"
status: draft
updated: 2026-11-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

At trails 1d8d3725a3, `packages/actionpack/lib/namespaces.ts` registers `ActionController.autoload("TestCase")`. Importing `@blazetrails/actionpack/testing` (`lib/testing.ts`) only adds `action_controller/test_case` to `ActionDispatch.loadPath`. `ActionController.TestCase` stays `undefined`, so `class X extends ActionController.TestCase {}` throws "Class extends value undefined". Found in trailmap#151: `test/support/controller-test-case.ts` now imports `TestCase` from `@blazetrails/actionpack/testing` instead of using the namespace.

Rails: `ActionController` autoloads `TestCase` (`actionpack/lib/action_controller.rb`), and referencing `ActionController::TestCase` loads it.

## Expected shape

After `import "@blazetrails/actionpack/testing"`, `ActionController.TestCase` is defined: the testing entry resolves the autoload it registers, as `rails/test_help` makes the constant reachable.

## Acceptance criteria

- `import "@blazetrails/actionpack/testing"`, then `ActionController.TestCase` is the class. A test pins it.
