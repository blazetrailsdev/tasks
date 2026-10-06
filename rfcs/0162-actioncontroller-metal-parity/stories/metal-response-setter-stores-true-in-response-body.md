---
title: "Metal#response= stores true in @_response_body and accepts a Rack response"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Metal#response=`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal.rb:263-270`):

```ruby
def response=(response)
  set_response!(response)

  # Force `performed?` to return true:
  @_response_body = true
end
```

and `set_response!` (`metal.rb:254-261`) closes the previous response's body
before replacing it. The assigned value may be a Rack triplet or a
`Rack::Response`, not only an `ActionDispatch::Response`
(`vendor/rails/v8.0.2/actionpack/test/controller/new_base/bare_metal_test.rb:12-18`).

trails' setter (`packages/actionpack/src/action-controller/metal.ts`,
`set response`) calls the invented `markPerformed()` instead of storing `true`
in `_responseBody`, so `controller.responseBody` reads `null` where Rails reads
`true`. Its parameter is typed `Response`, so a triplet or a `Rack::Response`
does not type-check, and `setResponseBang` has no close arm. `markPerformed` /
`_performed` (`packages/actionpack/src/abstract-controller/base.ts`) have no
Rails counterpart; `api.ts` calls `markPerformed` twice.

Storing `true` widens `responseBody`'s getter type, which reds a dozen test
call sites that pass it as a `string` (`render-json.test.ts`,
`json-rendering.test.ts`, `rendering.test.ts`, actionview's `layout.test.ts`).
That is why it was not done in the PR that ported `bare_metal_test.rb`. It
overlaps `metal-response-body-setter-flattens-instead-of-wrapping`, which
changes the same getter.

Two tests in
`packages/actionpack/src/action-controller/controller/new-base/bare-metal.test.ts`
are parked on this story: "can assign response array as part of the controller
execution" and "can assign response object as part of the controller
execution".

## Acceptance criteria

- `Metal#response=` mirrors `metal.rb:263-270`: `setResponseBang(response)`,
  then `_responseBody = true`. It accepts a Rack triplet and a `Rack::Response`.
- `Metal#setResponseBang` mirrors `metal.rb:254-261`, close arm included.
- `markPerformed` and `_performed` are deleted; `performed?` reads
  `response_body || response.committed?` (`metal.rb:245-247`).
- The two parked tests in `new-base/bare-metal.test.ts` are un-skipped with
  their Rails bodies and pass.
