---
title: "MiddlewareStack#build drops the instrumenting arm; build_instrumented and InstrumentationProxy are unported"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7518, which ported
`ActionDispatch::MiddlewareStack::Middleware` as a real class for the first
time (`stack.rb:21-50`) and stopped there: `build_instrumented` is the one
member of that class body still missing, and the branch that calls it is
missing with it.

Rails
(`vendor/rails/actionpack/lib/action_dispatch/middleware/stack.rb:46-48,52-76,166-175`):

```ruby
def build_instrumented(app)                       # :46-48
  InstrumentationProxy.new(build(app), inspect)
end

class InstrumentationProxy                        # :52-76
  EVENT_NAME = "process_middleware.action_dispatch"

  def initialize(middleware, class_name)
    @middleware = middleware
    @payload = { middleware: class_name }
  end

  def call(env)
    ActiveSupport::Notifications.instrument(EVENT_NAME, @payload) do
      @middleware.call(env)
    end
  end
end

def build(app = nil, &block)                      # :166-175
  instrumenting = ActiveSupport::Notifications.notifier.listening?(InstrumentationProxy::EVENT_NAME)
  middlewares.freeze.reverse.inject(app || block) do |a, e|
    if instrumenting
      e.build_instrumented(a)
    else
      e.build(a)
    end
  end
end
```

`packages/actionpack/src/action-dispatch/middleware/stack.ts`'s `build` has
only the `e.build(a)` arm — no `listening?` check, no proxy — so
`process_middleware.action_dispatch` is never emitted and nothing subscribing
to it sees a middleware. `InstrumentationProxy` does not exist anywhere in
`packages/actionpack/src` (grep: zero hits). `Middleware#inspect` was ported by
PR #7518 and currently has no caller, because `build_instrumented` is its only
one.

`middlewares.freeze` is also dropped, a separate small arm of the same body.

## Converged shape

- `InstrumentationProxy` as its own class in `middleware/stack.ts`, at
  `stack.rb:52-76`'s position — `EVENT_NAME`, the `{ middleware: className }`
  payload built in the constructor, and a `call` that wraps the inner `call`
  in `instrument()` from `@blazetrails/activesupport`.
- `Middleware#build_instrumented` (`stack.rb:46-48`) as `buildInstrumented`,
  passing `this.inspect()` as the class name, which gives the ported `inspect`
  its Rails caller back.
- `MiddlewareStack#build` gains the `instrumenting` local and the two-arm
  `inject`, resolving `listening?` through the notifier the repo already has.

## Acceptance criteria

- [ ] `build` branches on `listening?(InstrumentationProxy.EVENT_NAME)` and
      calls `buildInstrumented` when it answers true, matching
      `stack.rb:166-175`.
- [ ] `InstrumentationProxy` carries Rails' `EVENT_NAME` string verbatim.
- [ ] A test subscribes to `process_middleware.action_dispatch` and asserts one
      event per middleware carrying the class name, mirroring Rails'
      `actionpack/test/dispatch/middleware_stack_test.rb`'s instrumentation
      cases.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra` do not regress.
