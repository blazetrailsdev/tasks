---
title: "Port Warden::Strategies registry, Strategies::Base and Mixins::Common"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-core
packages: ["warden"]
deps: ["warden-package-setup"]
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `lib/warden/mixins/common.rb:1-45`: `session` (`env["rack.session"]`),
  `alias raw_session session` (`:14`), `request` (`Rack::Request.new(env)`
  memoized), `warden_cookies`, `params`, `reset_session!` (`:39-42`). Included
  by `Proxy` (`proxy.rb:17`) and `Strategies::Base` (`base.rb:41`): a
  plain-object module through `include()`.
- `lib/warden/strategies.rb:1-48`: `add(label, strategy = nil, &block)`
  (`:7-22`): `strategy ||= Class.new(Warden::Strategies::Base)`,
  `strategy.class_eval(&block) if block`, then raise `NoMethodError` unless
  `method_defined?(:authenticate!)` and `ArgumentError` unless
  `ancestors.include?(base)`; `update` (`:24-30`), `[]`, `clear!`,
  `_strategies`. RFC Design §3 and Open question 2 set the shape: a fresh
  `class extends Base {}`, the block run with that class as `this`, and
  `rbModMethodDefined` (`packages/ruby-compat/src/object.ts:900`) for the
  check. A Ruby `authenticate!` is `authenticateBang` per
  `docs/ruby-ts-conventions.md`; check the table before naming.
- `lib/warden/strategies/base.rb:1-182`: `attr_accessor :user, :message`,
  `attr_reader :env, :scope, :status` (`:32-39`), `initialize(env, scope = nil)`
  (`:44-50`), `_run!` (`:53-57`), `performed?`, `clear!`, `valid?`, `headers`,
  `errors`, `halt!`, `halted?`, `store?`, `pass`, `successful?`, `success!`,
  `fail!` / `fail`, `redirect!` (`:159-170`, builds a `Location` from
  `Rack::Utils.build_nested_query`), `custom!` (`:174-178`). None of these
  throws; the throw is in `Proxy`.
- Spec support: `spec/helpers/strategies/*.rb` (7 files: `fail_with_user`,
  `failz`, `invalid`, `pass`, `pass_with_message`, `password`, `single`) are
  `Warden::Strategies.add(...)` calls the spec helper `load`s
  (`spec/spec_helper.rb:21-25`); port them under
  `packages/warden/src/test-helpers/strategies/` with a `loadStrategies()`
  matching `load_strategies`.
- Spec support: `spec/helpers/request_helper.rb:1-52` starts here as
  `packages/warden/src/test-helpers/request-helper.ts` with `env_with_params`
  (it needs only `Rack::MockRequest`); `port-warden-manager` adds the
  `Manager`-dependent `setup_rack`.
- Spec: `spec/warden/strategies_spec.rb` (9 examples) here; `base_spec.rb` is
  `port-warden-strategies-base-spec`.

## Acceptance criteria

- `mixins/common.ts`, `strategies.ts`, `strategies/base.ts` port every `def`
  at its Rails name; `parity:api` credits all three files.
- The class-eval shape is the one RFC Open question 2 recommends, or the PR
  records why not in the RFC.
- `strategies.test.ts` ports all 9 examples by name.
