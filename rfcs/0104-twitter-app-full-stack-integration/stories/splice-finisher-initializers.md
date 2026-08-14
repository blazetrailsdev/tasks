---
title: "Splice Finisher into Application#initializers"
status: done
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6504
claim: "2026-08-14T01:35:18Z"
assignee: "splice-finisher-initializers"
blocked-by: null
closed-reason: null
---

## Context

`Application#initializers` never splices the Finisher initializers, so an
app booted through `Trailties.Application` builds no middleware stack and
loads no routes.

- `packages/trailties/src/application.ts:98-102`:

  ```ts
  get initializers(): Collection {
    const bootstrap = Bootstrap.initializersFor(this);
    const inherited = super.initializers;
    return bootstrap.plus(inherited);
  }
  ```

  The JSDoc at line 92-97 says "Finisher splicing lands in PR 2.5b once
  `Configuration` + the middleware stack supply the host methods Finisher
  requires." That PR never landed.

- `packages/trailties/src/application/finisher.ts:54` — `export class
Finisher extends Initializable {}` with six initializers registered
  (`add_generator_templates`, `add_internal_routes`, `build_middleware_stack`,
  `define_main_app_helper`, `add_to_prepare_blocks`, `run_prepare_callbacks`).
  Its header comment at line 6-8 says it "stands alone so tests can" exercise
  it, i.e. it is deliberately unwired.
- `packages/trailties/src/application/default-middleware-stack.ts` exists
  (104 lines) and nothing in a boot path calls it.

Rails: `vendor/rails/railties/lib/rails/application.rb`, `def initializers`:

```ruby
def initializers
  Bootstrap.initializers_for(self) +
  railties_initializers(super) +
  Finisher.initializers_for(self)
end
```

## Acceptance criteria

- `Application#initializers` returns
  `Bootstrap.initializersFor(this).plus(super.initializers).plus(Finisher.initializersFor(this))`,
  matching the Rails three-way splice and its order.
- `Configuration` supplies whatever host methods `FinisherHost` declares
  (`packages/trailties/src/application/finisher.ts:44`) so the splice
  type-checks without casts.
- `build_middleware_stack` actually produces the stack from
  `default-middleware-stack.ts`.
- A test boots an `Application` subclass and asserts the middleware stack is
  non-empty and routes are drawn.
