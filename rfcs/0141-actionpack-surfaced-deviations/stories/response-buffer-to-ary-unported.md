---
title: "response-buffer-to-ary-unported"
status: draft
updated: 2026-09-29
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

Surfaced in trails#8238. Rails' `ActionDispatch::Response::Buffer#to_ary`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:108-112`):

```ruby
def to_ary
  @buf.respond_to?(:to_ary) ?
    @buf.to_ary :
    @buf.each
end
```

`Response::RackBody#to_ary` (`response.rb:522-524`) forwards to
`@response.stream.to_ary`, and `ActionController::Live::Buffer` does
`undef_method :to_ary` (`action_controller/metal/live.rb:179`) so a live body
is never buffered by Rack middleware.

trails' `ResponseBuffer` (`packages/actionpack/src/action-dispatch/http/response.ts`)
defines no `toAry`, so `Live::Buffer`'s undef is vacuous: the Live side is
correct only because the base is missing. `RackBody` forwards `toAry` only when
the stream answers it (`BODY_METHODS`), where Rails always defines it.

## Acceptance criteria

- `ResponseBuffer#toAry` ports `response.rb:108-112`.
- `Live::Buffer` undefines it, as `live.rb:179` does (an own `undefined`
  value, which `basicObjRespondTo` reads as an undefined method), with a test
  asserting a plain buffer answers `toAry` and a Live buffer does not.
- `RackBody#toAry` mirrors `response.rb:522-524`.
