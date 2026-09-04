---
title: "converge-metal-status-setter-onto-response-status"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Metal` does not resolve status symbols. It delegates:

```ruby
delegate :status=, to: "@_response"   # metal.rb:183-184
```

and `ActionDispatch::Response#status=` is the one place the symbol becomes a
number (`vendor/rails/actionpack/lib/action_dispatch/http/response.rb:247-249`):

```ruby
def status=(status)
  @status = Rack::Utils.status_code(status)
end
```

`Rack::Utils.status_code` raises `ArgumentError` with the message
`Unrecognized status code <symbol>` for an unknown symbol
(`vendor/rack/lib/rack/utils.rb:589-599`), and it also honours the obsolete
symbol table.

trails splits this the other way. `Metal`'s setter
(`packages/actionpack/src/action-controller/metal.ts`) does the lookup itself
against a local `STATUS_CODES` table and throws a bespoke
`Error("Unknown status: ...")`, while `Response#status=`
(`action-dispatch/http/response.ts`) takes `number` only and stores it
unchanged. So a caller writing `this.response.status = "not_found"` — the shape
Rails documents — stores the string; only `this.status = "not_found"` resolves.
`Metal.resolveStatus` and `metal/status-codes.ts` are the trails-side table that
`packages/rack`'s `statusCode()` already duplicates.

#7376 landed the seam itself: `Response#status=` now resolves through
`statusCode()` (`Rack::Utils.status_code`), `Metal#status=` is a plain
delegation, and `redirect_to`'s `_extract_redirect_to_status`
(`redirecting.rb:213-221`) calls `statusCode()` too. What is left is the
trails-side table it made redundant.

## Acceptance criteria

- The three remaining `resolveStatus` call sites — `action-controller/
renderer.ts`, `action-controller/metal/rendering.ts` — resolve through
  `statusCode()` from `@blazetrails/rack` instead, matching every Rails
  `Rack::Utils.status_code` site.
- `resolveStatus`'s 500-for-an-unknown-symbol fallback goes with them: Rack
  raises `ArgumentError` (`vendor/rack/lib/rack/utils.rb:592`), so the
  `it("resolveStatus with unknown symbol returns 500")` test in
  `controller/metal.test.ts` is retired rather than re-pointed.
- `metal/status-codes.ts` and the `Metal.resolveStatus` static — a trails
  invention with no Rails counterpart — are deleted.
