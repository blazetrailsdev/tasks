---
title: "activemodel/activerecord/trailties/actionpack: callback hosts include Callbacks and call the class methods"
status: claimed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "activerecord", "trailties", "actionpack"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-10-03T22:54:59Z"
assignee: "callbacks-hosts-outside-activesupport-call-the-class-methods"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `activesupport-callbacks-free-target-functions-are-not-class-methods`,
which converted the activesupport hosts. Hosts in the other packages still import
the free target-taking functions from `@blazetrails/activesupport` and pass
`this.prototype`, where Rails calls `define_callbacks` / `set_callback` /
`run_callbacks` on a class that includes `ActiveSupport::Callbacks`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:691-945`):

- `packages/activemodel/src/callbacks.ts:58,112,127,143` (`active_model/callbacks.rb:109-155`), `validations.ts:93`, `validations/callbacks.ts:63`, `model.ts:146` (free `runCallbacks(this, "initialize", …)`).
- `packages/activerecord/src/transactions.ts:80,182,195,214`, `base.ts:1718,1772,1849`, `callbacks.ts:40,51,62,84`, `core.ts:391,392,803`, `associations/has-many-through-association.ts:210`.
- `packages/trailties/src/engine.ts:418` (`defineCallbacks(Engine.prototype, "load_seed")`, `railties/lib/rails/engine.rb:440-441`).
- `packages/actionpack/src/abstract-controller/callbacks.ts:3-6` and `action-dispatch/middleware/callbacks.ts:8` (`class CallbacksBase extends CallbacksMixin()`, `action_dispatch/middleware/callbacks.rb:6-8` is `include ActiveSupport::Callbacks`).
- Tests: `activemodel/src/callbacks.trails.test.ts` (~79 calls), `activemodel/src/callbacks.test.ts`, `validations/*.test.ts`, `activerecord/src/persistence-save-block.trails.test.ts`, `connection-pool.trails.test.ts`, and the association tests that call `runCallbacks(record, …)`.

`Model` already `include`s `ASCallbacks` and declares `setCallback` / `runCallbacks`
(`activemodel/src/model.ts:87-89,157`).

## Acceptance criteria

- [ ] No file under `packages/{activemodel,activerecord,trailties,actionpack}/src` imports the free `defineCallbacks` / `setCallback` / `skipCallback` / `resetCallbacks` / `runCallbacks` or `CallbacksMixin` from activesupport.
- [ ] Each host `include(X, Callbacks)`s where Rails does and calls `X.defineCallbacks(…)` / `this.runCallbacks(…)`.
- [ ] If it exceeds one PR, split by package, one story each.
