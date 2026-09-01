---
title: "converge-static-positional-path"
status: done
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 46
pr: 7353
claim: "2026-09-01T18:42:23Z"
assignee: "converge-configuration-root-lazy-find-root"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Static` takes its path positionally in Rails
(`vendor/rails/actionpack/lib/action_dispatch/middleware/static.rb:21`):

```ruby
def initialize(app, path, index: "index", headers: {})
```

and `FileHandler` likewise (`static.rb:55`, `def initialize(root, index:, ...)`).
The trails port collapses both into a single options object —
`constructor(app: RackApp, options: StaticOptions)` with a `root` key
(`packages/actionpack/src/action-dispatch/middleware/static.ts:47`), so every
call site passes `{ root, index, headers }`.

`Application::DefaultMiddlewareStack#buildStack`
(`packages/trailties/src/application/default-middleware-stack.ts`) has to
follow that shape instead of Rails'
`middleware.use ::ActionDispatch::Static, paths["public"].first, index: ..., headers: ...`
(`default_middleware_stack.rb:32`), and carries a JSDoc note saying so.

## Acceptance criteria

- `Static` and `FileHandler` take the path positionally with `index` /
  `headers` kwargs, matching `static.rb:21` and `:55`.
- `DefaultMiddlewareStack#buildStack` passes
  `paths.get("public")?.toAry()[0]` positionally and the deviation note is
  deleted.
- `static.test.ts` call sites updated; test names unchanged.
