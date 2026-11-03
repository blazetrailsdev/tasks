---
title: "Port Warden::Manager, the Warden module and the spec request helper"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-core
packages: ["warden"]
deps: ["port-warden-proxy"]
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `lib/warden/manager.rb:1-149`. `extend Warden::Hooks` (`:12`),
  `attr_accessor :config` (`:14`), `initialize(app, options = {})` (`:19-25`:
  `options.delete(:default_strategies)`, `Config.new(options)`, `yield @config
if block_given?`; the block is a trailing block parameter, the settled
  ruby-compat `block()` shape).
- `call(env)` (`:30-48`): the downstream-instance guard, `env["warden"] =
Proxy.new(env, self)`, `catch(:warden) { env["warden"].on_request;
@app.call(env) }`, then `case result` over `Array` / `Hash` /
  `Rack::Response`. The app's `call` may return a promise, so the block is
  async and `kernelCatch`'s async arm (RFC 0148 Design §1.6) settles it.
  Follow how `packages/rack/src/builder.ts` and the other ported rack
  middleware already type an app whose `call` may return a promise; do not
  invent a second convention.
- `_run_callbacks` (`:51-53`), the `class << self` block (`:55-93`):
  `serialize_into_session` / `serialize_from_session` define and remove
  `#{scope}_serialize` / `_deserialize` on `SessionSerializer` with
  `rbModDefineMethod` (`packages/ruby-compat/src/object.ts:966`). The
  `send :remove_method` at `:87-89` has no class-level helper: ruby-compat's
  only `removeMethod` is a member of the `Module` carrier
  (`packages/ruby-compat/src/include.ts:454`), which RFC 0197 is deleting and
  which `SessionSerializer` (a class) is not. It is written inline as
  `rb_mod_remove_method`'s body (`vendor/ruby/v3.3.11/vm_method.c:1728`):
  `delete SessionSerializer.prototype[methodName]`, behind Ruby's own
  `method_defined?` guard (`:87`, `rbModMethodDefined`). Deleting the own
  property is exactly `remove_method`'s effect (an inherited method shows
  through again), and the guard makes its `NameError` arm unreachable here. No
  ruby-compat story is needed; if the call gate flags `remove_method`, the
  remedy is a `@missingRailsCall remove_method — PERMANENT` tag citing this
  story, not a new helper.
- Private: `handle_chain_result` (`:97-103`), `intercept_401?`,
  `process_unauthenticated` (`:112-133`, the `:custom` / `:redirect` /
  default arms and `before_failure` callbacks), `call_failure_app`
  (`:136-146`, setting `PATH_INFO` to `attempted_path` and `REQUEST_METHOD`).
- `lib/warden.rb:1-47`: the `Warden` module, `NotAuthenticated < StandardError`
  (`:14`) and the `Test` autoloads (`:16-20`). Seat `Warden` per CLAUDE.md
  § "Call-time constant resolution" (plain imports; a namespace seat only for
  a module-eval read). `test_mode!` (`:34-46`) is `port-warden-test-helpers`.
- Spec support: `request-helper.ts` (created with `env_with_params` by
  `port-warden-strategies`) gains `setup_rack`, `valid_response`,
  `failure_app` and `success_app` (`spec/helpers/request_helper.rb`); the
  Manager-driven spec stories use them.

Un-skip the `config_spec` and `scoped_session_serializer` examples parked
for this story.

## Acceptance criteria

- `manager.ts` and `warden.ts` port every `def`; `parity:api` credits both
  files.
- `request-helper.ts`'s `setup_rack` builds a `Rack::Builder` stack
  with `Manager` mounted.
- A `Manager#call` around an async app that throws `:warden` reaches the
  failure app (TS-only test in `manager.trails.test.ts`).
