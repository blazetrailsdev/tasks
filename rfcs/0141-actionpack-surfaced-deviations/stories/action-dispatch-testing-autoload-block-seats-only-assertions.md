---
title: 'ActionDispatch''s autoload_under "testing" block misses IntegrationTest, TestRequest and AssertionResponse'
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
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

`packages/actionpack/src/namespaces.ts:93-98` now autoloads four of them:
`Assertions`, `Integration`, `TestProcess` and `TestResponse`. Three are still
missing from the block and unseated at `ActionDispatch`, so
`ActionDispatch.IntegrationTest` is undefined and each is anonymous to
`rbModName`:

- `IntegrationTest` (`autoload :IntegrationTest, "action_dispatch/testing/integration"`)
- `TestRequest` (`packages/actionpack/src/action-dispatch/testing/test-request.ts`)
- `AssertionResponse` (`packages/actionpack/src/action-dispatch/testing/assertion-response.ts`)

The block also lists them out of Rails' order (`TestRequest` sits between
`TestProcess` and `TestResponse`). `ActionController`'s
`autoload_at "action_controller/test_case"` block (`action_controller.rb:69-73`)
is the converged precedent.

## Acceptance criteria

- The `autoloadUnder("testing")` block in `namespaces.ts` lists all seven
  constants in `action_dispatch.rb:128-136`'s order, with the explicit
  `"action_dispatch/testing/integration"` path for `IntegrationTest`.
- `IntegrationTest`, `TestRequest` and `AssertionResponse` are each seated by
  their defining module with `rbModConstSet(ActionDispatch, "<Name>", …)`, and
  `ActionDispatch`'s type carries them.
- A test asserts each seat and its `ActionDispatch::<Name>` path.
- The built `dist` modules for `testing/integration.js`, `test-request.js` and
  `assertion-response.js` each import as an entry module.

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
