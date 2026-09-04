---
title: "ActionController::MiddlewareStack::Middleware is not ported; valid? sits on the shared ActionDispatch entry type"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails models an ActionController middleware entry as its own class:

```ruby
# actionpack/lib/action_controller/metal.rb:18-29
class MiddlewareStack < ActionDispatch::MiddlewareStack
  class Middleware < ActionDispatch::MiddlewareStack::Middleware
    def initialize(klass, args, actions, strategy, block)
      @actions = actions
      @strategy = strategy
      super(klass, args, block)
    end

    def valid?(action)
      @strategy.call @actions, action
    end
  end
```

`valid?` exists only on that subclass; a plain
`ActionDispatch::MiddlewareStack::Middleware` (`middleware/stack.rb:30-50`)
has no such method, which is why `ActionDispatch::MiddlewareStack#build`
(`stack.rb:166-175`) never asks about it and only the ActionController
`build` (`metal.rb:31-37`) does.

trails has no `Middleware` subclass. PR #7310 put an optional
`valid?(action)` on the shared `MiddlewareEntry` interface
(`packages/actionpack/src/action-dispatch/middleware/stack.ts`), and
`ActionController::MiddlewareStack#build`
(`packages/actionpack/src/action-controller/metal.ts`) tests
`if (middleware.valid && !middleware.valid(action)) continue`. So the
ActionDispatch-layer type carries a member that only exists on the
ActionController layer in Rails, and the guard has to be nullable to
compensate.

`packages/actionpack/src/action-controller/metal.ts` also has a `Middleware`
class already, but it holds only `klass` and `args` — it is not the entry
type the stack stores, and `Metal.buildMiddleware` returns it decorated with
a `valid` function rather than an `actions`/`strategy` pair.

## Converged shape

- `ActionDispatch::MiddlewareStack::Middleware` becomes the entry type the
  stack stores (`stack.rb:30-50`), and `MiddlewareEntry` loses `valid?`.
- `ActionController::MiddlewareStack::Middleware` extends it with the Rails
  constructor `(klass, args, actions, strategy, block)` and the `valid?`
  method (`metal.rb:19-29`).
- `ActionController::MiddlewareStack#build`'s guard becomes the unconditional
  `middleware.valid?(action)` of `metal.rb:35`, with no nullable check.
- `Metal.buildMiddleware`'s `only`/`except` extraction keeps its
  `metal.rb:44-52` body but constructs the subclass rather than decorating a
  bare object.

## Acceptance criteria

- `valid?` is declared on the ActionController `Middleware` subclass only;
  nothing in `action-dispatch/middleware/stack.ts` mentions it.
- `ActionController::MiddlewareStack#build` calls `middleware.valid?(action)`
  with no existence check, matching `metal.rb:35`.
- `actionpack/test/controller/new_base/middleware_test.rb`'s ported cases
  (`packages/actionpack/src/action-controller/new-base/middleware.test.ts`)
  still pass, `middleware stack accepts only and except as options` included.
- `pnpm parity:api:calls` and `pnpm parity:api:extra` do not regress.
