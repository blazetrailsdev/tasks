---
title: "test_help's before_setup reopenings capture the prior method instead of calling super"
status: done
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8373
claim: "2026-10-02T01:22:05Z"
assignee: "arel-dot-accept-requires-collector"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping `active-support-test-case-carries-setup-and-teardown-instance-side` (trails PR 8362).

Rails' `test_help` reopens the two test classes with a `before_setup` that calls `super` (`vendor/rails/v8.0.2/railties/lib/rails/test_help.rb:35-47`):

```ruby
ActiveSupport.on_load(:action_controller_test_case) do
  def before_setup
    @routes = Rails.application.routes
    super
  end
end

ActiveSupport.on_load(:action_dispatch_integration_test) do
  def before_setup
    @routes = Rails.application.routes
    super
  end
end
```

trails' `packages/trailties/src/test-help.ts:52-64` reads `this.prototype.beforeSetup` when the hook runs, keeps it in a `superBeforeSetup` local, and assigns a wrapper that calls `superBeforeSetup?.call(this)`. Two differences from `super`:

- The captured function is fixed at load-hook time. A module included onto the class or onto `ActiveSupport::TestCase` afterwards is not reached, where Ruby's `super` resolves at call time.
- The `?.` is a guard Rails does not have. Since PR 8362 `ActiveSupport::TestCase` always answers `beforeSetup`, so it can never be absent.

The integration wrapper also awaits `reloadRoutesUnlessLoaded()`, which is `lazy-route-set-method-missing-resends-in-line`'s debt and not this story's.

## Converged shape

Each reopening defines `beforeSetup` on the class and reaches the next method at call time, with no captured local and no optional call: a ruby-compat `Module` whose `beforeSetup` is `this.routes = …; return Mod.superMethod(this, "beforeSetup")!()`, included at the load hook, or the equivalent that resolves `super` when called.

## Acceptance criteria

- `test-help.ts` has no `superBeforeSetup` capture and no `?.call`.
- A module included onto `ActionController::TestCase` after `test_help` loads is still reached from the reopened `beforeSetup`, covered by a test.
- `packages/trailties/src/boot-app-test-help.trails.test.ts` stays green.
