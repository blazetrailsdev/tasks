---
title: "converge-connection-management-onto-executor-and-body-proxy"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
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

`packages/activerecord/src/connection-adapters/connection-management.ts` exports
a `ConnectionManagement` class. Rails has no such constant — it was removed in
Rails 5, and `connection_management_test.rb:143-148` builds the middleware
inline out of two pieces Rails already has:

```ruby
def middleware(app)
  lambda do |env|
    a, b, c = executor.wrap { app.call(env) }
    [a, b, Rack::BodyProxy.new(c) { }]
  end
end
```

so the surface the test exercises is `ActiveSupport::Executor#wrap` plus
`Rack::BodyProxy`, not an ActiveRecord middleware class. trails' file also
carries its own `BodyProxy` (which scores `moved` against `Rack::BodyProxy`) and
a private `clearActiveConnections` doing by hand what the executor's
`ActiveRecord::QueryCache`/connection-release hooks do.

`ConnectionManagement` carries a `@noRailsEquivalent CONVERGEABLE` receipt
pointing here (RFC 0130, `receipt-connection-adapters-and-sqlite-drivers`). Its
consumers today are `packages/activerecord/src/index.ts` and
`packages/activerecord/src/connection-management.test.ts`.

## Acceptance criteria

- `connection-management.test.ts` builds its middleware the way
  `connection_management_test.rb:143` does — through the executor and the
  `BodyProxy` port — rather than through an ActiveRecord middleware class.
- `ConnectionManagement` and its `index.ts` export are gone; `BodyProxy` either
  moves to the file mirroring `Rack::BodyProxy` or is shown to be the port of it.
- `pnpm parity:api:extra --package activerecord --novel-only` no longer lists
  `connection-adapters/connection-management.ts`.
