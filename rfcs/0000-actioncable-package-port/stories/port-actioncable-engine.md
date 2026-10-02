---
title: "Port ActionCable::Engine into trailties"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["trailties", "actioncable", "actionpack"]
deps:
  [
    "port-actioncable-helper",
    "port-actioncable-channel-base",
    "port-actioncable-connection-base",
    "port-actioncable-inline-async-and-test-adapters",
    "rack-handler-node-offers-rack-hijack-on-upgrade",
  ]
deps-rfc: []
est-loc: 500
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/engine.rb` (98 lines), ported at
`packages/trailties/src/trailties/action-cable.ts` beside
`active-record.ts` and `global-id.ts`, as a subclass of trailties'
`Engine` (`packages/trailties/src/engine.ts:41`). trailties takes
`@blazetrails/actioncable` as a plain dependency.

- `config.action_cable = ActiveSupport::OrderedOptions.new`, with
  `mount_path = INTERNAL[:default_mount_path]` and
  `precompile_assets = true` (`:11-13`).
- Eight initializers: `action_cable.deprecator` (`before:
:load_environment_config`), `.helpers`, `.logger`,
  `.health_check_application`, `.asset`, `.set_configs`, `.routes`,
  `.set_work_hooks` (`:15-96`).

Rails tests, in railties: `vendor/rails/v8.0.2/railties/test/application/configuration_test.rb:3632-3638`
("ActionCable.server.config.cable is set when missing configuration for the
current environment") and the `ActionCable.deprecator` assertion inside
"Rails.application.deprecators includes framework deprecators" (`:4265-4270`).
`engine_test.rb:1546` lists `ActionCable::Engine` in the railtie load order.
Port the first if its file is ported in trailties, add the assertion to the
second, and say in the PR which of the three already exist.

**`rails/all`.** `vendor/rails/v8.0.2/railties/lib/rails/all.rb:12` requires
`action_cable/engine` between `active_job/railtie` and
`action_mailbox/engine`. trailties' port
(`packages/trailties/src/all.ts`) imports each railtie module in that
order; add `./trailties/action-cable.js` at its Rails position, so a booted
app loads the engine. Rails wraps each require in `rescue LoadError`; the
package is a plain dependency of trailties, so the import is unconditional,
and an app that skips Action Cable does so through its own framework list.

Once the engine is seated on `TopLevel.ActionCable`, the authentication
generator's `TopLevel.ActionCable?.Engine !== undefined` check
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts:55`)
turns true.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/engine.rb`

## Rails tests owned by this story

- `vendor/rails/v8.0.2/railties/test/application/configuration_test.rb` (trailties' `parity:test` population):
  - [ ] `ActionCable.server.config.cable is set when missing configuration for the current environment (:3632)`
  - [ ] `Rails.application.deprecators includes framework deprecators (:4265; the ActionCable.deprecator assertion at :4269)`

## Fidelity traps (predicted at authoring)

- [ ] **`on_load(:action_cable)` blocks run with `self` as the Configuration** (`server/base.rb:107` passes `Base.config`). `self.logger ||= ::Rails.logger`, `self.cable = …`, `self.connection_class = …` and `send("#{k}=", v)` are all configuration writers.
- [ ] **`set_configs` order** (`:43-60`): the development default for `allowed_request_origins` (`/https?:\/\/localhost:\d+/`, only if unset); `app.paths.add "config/cable", with: "config/cable.yml"`; then inside the hook, `cable = app.config_for(config_path).to_h.with_indifferent_access` if the file exists; the `connection_class` wrapper; `filter_parameters +=`; and last `options.each { |k, v| send("#{k}=", v) }`, so an explicit `config.action_cable.x` wins.
- [ ] **`config_for` is async in trails** (`packages/trailties/src/application.ts:312`) and an `on_load` block is not awaited. Decide where the cable config is read so it is in place before the first request, and say so at the call.
- [ ] **The config file.** Rails reads `config/cable.yml`; `trails new` writes `config/cable.ts` (`packages/trailties/src/generators/app-generator.ts:600-606`). Use whatever `config_for` resolves for the app's other config files, and keep the path registered under `"config/cable"`.
- [ ] **The `connection_class` wrapper** captures the previous lambda: `-> { "ApplicationCable::Connection".safe_constantize || previous_connection_class.call }`. It is evaluated per request, so a reloaded class is picked up.
- [ ] **`set_work_hooks`** (`:73-96`): `Worker.set_callback :work, :around, prepend: true` wrapping in `app.executor.wrap(source: "application.action_cable")` and running `inner.call` only `unless stopping?` (the block's `self` is the worker); the same `wrap` lambda on `Channel::Base`'s `:subscribe` and `:unsubscribe`; and `app.reloader.before_class_unload { ActionCable.server.restart }`.
- [ ] **`executor.wrap` must cover the awaited work.** `ExecutionWrapper.wrap` (`packages/activesupport/src/execution-wrapper.ts:99-125`) already defers `complete!` until a thenable block settles. Pass it the promise `inner.call` returns (do not `void` it), and assert in a test that the executor's `complete` hook runs after an async channel action finishes.
- [ ] **A halted worker returns nothing.** `unless stopping?; inner.call; end` leaves the around callback without calling `inner`, which halts the `:work` chain: the posted task is dropped silently.
- [ ] **`restart` returns a promise**; `before_class_unload` must await it or the reload races the old connections closing.
- [ ] **The `routes` initializer** runs in `after_initialize`, skips when `mount_path` is nil, and `app.routes.prepend { mount ActionCable.server => path, internal: true, anchor: true }` (`packages/actionpack/src/action-dispatch/routing/route-set.ts:964`, `mapper.ts:1490`). trails' `mount` takes the path as `at:`; `MountOptions` (`mapper.ts:2251-2254`) must accept `internal` and `anchor`.
- [ ] **The health check** is `->(env) { Rails::HealthController.action(:show).call(env) }` (`packages/trailties/src/health-controller.ts:4`).
- [ ] **The `asset` initializer** appends to `app.config.assets.precompile` only if `app.config.respond_to?(:assets)`. trails has no Sprockets; port the guard, which is then false.
- [ ] **`deprecators[:action_cable]`** is the bare-keyed `actionCable` per RFC 0149.
- [ ] **CI gate.** trailties imports actioncable from this story on, so add `actioncable` to `TRAILTIES_PKGS_RE` (`.github/workflows/ci.yml:119`) here.
- [ ] **`Rails.env.development?`** is `TopLevel.Trails!.env`.

## Acceptance criteria

- [ ] `engine.rb` reads complete in `parity:api` at its trailties path, with all eight initializers under their Rails names.
- [ ] `packages/trailties/src/all.ts` imports the engine at its `rails/all` position.
- [ ] A booted fixture app answers a WebSocket upgrade at `/cable` with a welcome message, and `config.action_cable.mount_path = nil` removes the route.
- [ ] Both `configuration_test.rb` cases listed above are credited in `parity:test` for trailties: the first ported, the second carrying its `ActionCable.deprecator` assertion.
- [ ] A plain-node import of the built engine module as the entry module succeeds.

## Definition of done

An engine that wires the server without the executor wrap, or one that reads the cable config after the first request, does not close this story.

## Verification

```bash
pnpm vitest run packages/trailties/src/trailties/action-cable.test.ts packages/trailties/src/all.trails.test.ts
pnpm build && node -e "import('./packages/trailties/dist/trailties/action-cable.js')"
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # engine.rb at 100%
pnpm parity:test   # the two railties cases credited for trailties
```
