---
title: "metal-response-body-setter-flattens-instead-of-wrapping"
status: ready
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
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

Rails' `ActionController::Metal#response_body=`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal.rb:234-242`):

```ruby
def response_body=(body)
  if body
    body = [body] if body.is_a?(String)
    response.body = body
    super
  else
    response.reset_body!
  end
end
```

A String is wrapped in `[body]`, the Array/enumerable goes to `response.body=`,
and `super` (`AbstractController::Base#response_body=`) records it.

trails' setter (`packages/actionpack/src/action-controller/metal.ts`,
`override set responseBody`) instead flattens its input TO a string: an Array is
`join("")`ed, a `Buffer` or `SafeBuffer` is `toString()`ed, and the string is
stored in `_responseBody` and handed to `response.body=`. There is no `super`
call, so the enumerable body shape Rails passes to `Response#body=` (and reads
back through `response_body`) never exists. trails#8174 added the `SafeBuffer`
arm (the stand-in for Ruby's `is_a?(String)`) without converging the rest.

## Acceptance criteria

- `Metal#responseBody=` mirrors `metal.rb:234-242`: a String (or `SafeBuffer`)
  is wrapped in `[body]`, `response.body = body` receives the enumerable, and
  the value is recorded through `super`.
- `response_body` reads back what Rails' `AbstractController::Base` stores, and
  callers that relied on the flattened string are moved to `response.body`.
- No new `Metal`-only surface is introduced.
