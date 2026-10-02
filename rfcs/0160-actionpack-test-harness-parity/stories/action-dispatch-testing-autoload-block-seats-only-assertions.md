---
title: 'ActionDispatch''s autoload_under "testing" block seats only Assertions: IntegrationTest, TestProcess, TestRequest, TestResponse and AssertionResponse are unseated'
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8406 (`action-dispatch-assertions-is-not-an-includable-module`).

Rails autoloads seven constants under `testing`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch.rb:128-136`):

```ruby
autoload_under "testing" do
  autoload :Assertions
  autoload :Integration
  autoload :IntegrationTest, "action_dispatch/testing/integration"
  autoload :TestProcess
  autoload :TestRequest
  autoload :TestResponse
  autoload :AssertionResponse
end
```

`packages/actionpack/src/namespaces.ts` mirrors one of them:
`ActionDispatch.autoloadUnder("testing", () => { ActionDispatch.autoload("Assertions"); })`,
seated by `testing/assertions.ts` with `rbModConstSet(ActionDispatch, "Assertions", Assertions)`.
`IntegrationTest`, `TestProcess`, `TestRequest`, `TestResponse` and
`AssertionResponse` exist as classes / modules in
`packages/actionpack/src/action-dispatch/testing/` but are neither autoloaded on
nor seated at `ActionDispatch`, so `ActionDispatch.IntegrationTest` is undefined
and each is anonymous to `rbModName`. `Integration` (the module holding
`RequestHelpers`, `Session`, `Runner`, `integration.rb:14-463`) has no trails
constant at all; that half belongs to `integration-runner-merged-into-session`.

`ActionController`'s `autoload_at "action_controller/test_case"` block
(`action_controller.rb:69-73`) is the converged precedent in the same file.

## Acceptance criteria

- The `autoloadUnder("testing")` block in `namespaces.ts` lists the constants
  `action_dispatch.rb:128-136` lists, in that order, with `loadPath` entries,
  except `Integration`, which is added by the story that ports it.
- Each is seated by its defining module with `rbModConstSet(ActionDispatch, "<Name>", …)`,
  and `ActionDispatch`'s type carries it.
- A test asserts each seat and its `ActionDispatch::<Name>` path.
- The built `dist` modules for `testing/integration.js`, `test-process.js`,
  `test-request.js`, `test-response.js` and `assertion-response.js` each import
  as an entry module.
