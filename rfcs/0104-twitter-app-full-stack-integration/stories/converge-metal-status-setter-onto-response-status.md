---
title: "converge-metal-status-setter-onto-response-status"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
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

Surfaced while converging `Metal#to_a` onto `response.to_a` in #7376, which
made every other `Metal` status/header/content-type member a plain delegation;
the symbol arm is the one that did not move because the error message and the
table are load-bearing for existing tests.

## Acceptance criteria

- `Response#status=` accepts a number or a Symbol-shaped string and resolves it
  through `statusCode()` from `@blazetrails/rack` (`Rack::Utils.status_code`),
  mirroring `response.rb:247-249`.
- `Metal#status=` is a plain delegation with no lookup of its own
  (`metal.rb:183-184`), and `Metal#head`'s `self.status = status`
  (`head.rb:39`) goes through it.
- The unknown-symbol raise is Rack's `ArgumentError` with Rack's message, not
  `Error("Unknown status: ...")`; the tests asserting the old message move onto
  the Rails one, keeping their names.
- `metal/status-codes.ts`'s table and `Metal.resolveStatus` are removed in
  favour of rack's, or the remaining caller is named.
