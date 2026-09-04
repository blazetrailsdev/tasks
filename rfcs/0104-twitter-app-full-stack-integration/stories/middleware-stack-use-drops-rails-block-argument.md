---
title: "MiddlewareStack#use/unshift/insert drop Rails' &block; three @missingRailsArgs PERMANENT receipts are wrong"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MiddlewareStack#use`, `#unshift` and `#insert` in
`packages/actionpack/src/action-dispatch/middleware/stack.ts` call
`this.buildMiddleware(klass, args)` with two arguments where Rails passes
three.

Rails (`actionpack/lib/action_dispatch/middleware/stack.rb:184-186` and its
callers at `:113-140`):

```ruby
def use(klass, *args, &block)
  middlewares.push(build_middleware(klass, args, block))
end

def build_middleware(klass, args, block)
  Middleware.new(klass, args, block)
end
```

Each of `use` / `unshift` / `insert` takes `&block` and forwards it. The three
trails methods drop the parameter entirely, so the third argument is missing.

PR #7310 landed three `@missingRailsArgs build_middleware — PERMANENT`
receipts at those call sites, on the reasoning that Ruby's `&block` has no
positional spelling beside `*args`. **That reasoning is wrong and the
PERMANENT claim should not stand.** The same PR then ported Rails'
`BlockMiddleware` test
(`actionpack/test/controller/new_base/middleware_test.rb`) and proved a block
DOES arrive positionally: `buildMiddleware`'s trailing-hash pop tests
`typeof last === "object"`, so a function passes straight through into the
constructor's last position, matching `Middleware#build`'s
`klass.new(app, *args, &block)` (`stack.rb:43-45`). See
`packages/actionpack/src/action-controller/new-base/middleware.test.ts`, the
`middleware stack accepts block arguments` case.

So the block already works end-to-end through the positional path; only the
three signatures and the forwarding call are missing.

## Converged shape

- `use`, `unshift` and `insert` each take Rails' trailing `block` and pass it
  as `buildMiddleware`'s third argument, so the call matches `stack.rb:113-140`.
- `useWithBlock` — trails' app-wrapper spelling, a different concept from
  Ruby's constructor `&block` — is reviewed at the same time: either it keeps
  its own name for the wrapper case, or it folds into `use` if the wrapper
  arm turns out to be reachable through the same trailing callable.
- The three `@missingRailsArgs build_middleware — PERMANENT` receipts are
  deleted, not downgraded.

## Acceptance criteria

- `use` / `unshift` / `insert` forward a trailing block to `build_middleware`,
  matching `stack.rb:113-140`.
- No `@missingRailsArgs build_middleware` receipt remains in
  `middleware/stack.ts`.
- `pnpm parity:api:calls:args` is green with no new baseline row.
- The ported `middleware stack accepts block arguments` cases still pass, and
  a case covers a block reaching a middleware registered through `unshift` or
  `insert`.
