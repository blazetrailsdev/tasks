---
title: "ControllerRuntime#initialize does not seat db_runtime to nil"
status: done
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7528
claim: "2026-09-05T18:47:06Z"
assignee: "controller-runtime-initialize-does-not-seat-db-runtime"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Railties::ControllerRuntime#initialize`
(`activerecord/lib/active_record/railties/controller_runtime.rb:26-29`) is

```ruby
def initialize(...)
  super
  self.db_runtime = nil
end
```

and its ActionController twin does the same for `view_runtime`
(`actionpack/lib/action_controller/metal/instrumentation.rb:23-26`).

trails' port (`packages/activerecord/src/trailties/controller-runtime.ts`) has
no counterpart. Nothing breaks today, because every reader spells
`this.dbRuntime ?? 0` and an absent property reads the same as `null` — but the
attribute is then undeclared on a controller instance, so a reader that does
not carry the `??` sees `undefined` where Rails guarantees `nil`, and the
member is invisible to anything enumerating the instance's own properties.
`viewRuntime` IS declared (`packages/actionpack/src/action-controller/base.ts:221`,
`viewRuntime: number | null = null`), so the two halves of the same pattern
disagree.

Surfaced porting the rest of the module in #7509, whose story scoped the payload
keys, `log_process_action` and the controller wiring.

## Converged shape

The include installs the same seat `viewRuntime` has — `dbRuntime` reading
`null` on a freshly constructed controller, set where Rails' `initialize` sets
it rather than left to each reader's `??`.

## Acceptance criteria

- A controller with `ControllerRuntime` included answers `dbRuntime === null`
  before any action runs.
- `controller-runtime.trails.test.ts` asserts it on a fresh instance.
