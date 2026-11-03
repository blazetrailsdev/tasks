---
title: "Port Warden::Proxy over kernelCatch / kernelThrow"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-core
packages: ["warden"]
deps:
  [
    "port-kernel-catch-throw",
    "port-warden-config",
    "port-warden-errors",
    "port-warden-hooks",
    "port-warden-strategies",
    "port-warden-session-serializer",
  ]
deps-rfc: []
est-loc: 560
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/warden/proxy.rb:1-395`, the object stored at `env["warden"]`.

- `UserNotSet < RuntimeError` (`:5`); `extend ::Forwardable`,
  `include ::Warden::Mixins::Common` (`:16-17`); `ENV_WARDEN_ERRORS`,
  `ENV_SESSION_OPTIONS` (`:19-20`).
- `def_delegators :winning_strategy, :headers, :status, :custom_response`
  (`:23`) and `def_delegators :config, :default_strategies` (`:26`): four
  written methods at those names (RFC Design §3), no Forwardable helper.
- `initialize(env, manager)` (`:28-33`): `@config = manager.config.dup`
  (`rbObjDup`, reaching `Config#initializeCopy`) and
  `@strategies = Hash.new { |h, k| h[k] = {} }` (`:32`), a default-proc Hash:
  use ruby-compat's `Hash` default proc if present (`packages/ruby-compat/src/hash.ts`),
  never `??=` at each read.
- Public: `on_request`, `errors`, `session_serializer`,
  `clear_strategies_cache!`, `lock!`, `authenticate`, `authenticate?`,
  `authenticate!` (`:132-136`: `throw(:warden, opts) unless user`),
  `authenticated?`, `unauthenticated?`, `set_user` (`:170-214`, runs
  `after_set_user` callbacks and stores through the serializer), `user`
  (`:217-241`, fetch-from-session with the `run_callbacks` option),
  `session(scope)` (`:244-252`, raises `NotAuthenticated`), `logout`
  (`:266-282`), `result`, `message`, `custom_failure!` / `custom_failure?`
  (`:298-306`, `instance_variable_defined?(:@custom_failure)`: keep the
  unset-vs-nil distinction), `asset_request?` (`:314-316`), `inspect`, `to_s`.
- Private: `_perform_authentication` (`:328-343`), `_retrieve_scope_and_opts`,
  `_run_strategies_for` (`:353-376`, `catch(:warden) { _update_winning_strategy }`
  at `:368`), `_fetch_strategy` (`:379-388`, raising unless
  `silence_missing_strategies?`), `_update_winning_strategy`.

Both throws use `kernelThrow` / `kernelCatch`
(`packages/ruby-compat/src/kernel-catch.ts:100,129-145`), story
`port-kernel-catch-throw` (done, trails#7758). A `kernelThrow` with no
enclosing catch raises `UncaughtThrowError` at the throw site, which is what
Ruby does for an `authenticate!` outside a `Manager`.

Nest `Errors` under `Proxy` here (`port-warden-errors` seated it on
`Warden`). The spec is split three ways (`port-warden-proxy-spec-*`); this
story carries a TS-only smoke test only.

## Acceptance criteria

- `proxy.ts` ports every `def` at its Rails name; `parity:api` credits
  `proxy.rb`; `parity:api:calls` shows `catch` / `throw` credited through
  `kernelCatch` / `kernelThrow` (story `gate-ruby-catch-calls-onto-kernel-catch`).
- No new catch/throw helper and no `ThrowSignal` handling outside
  ruby-compat.
- `proxy.trails.test.ts` covers one `authenticate!` that throws through a
  `kernelCatch("warden")` it sets up.
