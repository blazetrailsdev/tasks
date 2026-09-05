---
title: "Six invented statics on the moved framework railties have no railtie.rb counterpart"
status: in-progress
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 20
pr: 7503
claim: "2026-09-05T01:22:11Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

PR #7413 (`fold-the-two-trailtie-ports-into-one`) relocated the six framework
railtie ports into `packages/trailties/src/trailties/`. It moved their bodies
unchanged, so a set of pre-existing invented statics moved with them and is now
concentrated in one directory where it is easy to burn down together.

A Rails railtie class body is `initializer` / `config` / `rake_tasks` blocks and
nothing else. None of the following has a counterpart in the corresponding
`railtie.rb`:

- `packages/trailties/src/trailties/active-model.ts:45` — `static initialize(config?: TrailtieConfig)`.
  `activemodel/lib/active_model/railtie.rb` has only the three initializers
  (`:12`, `:16`, `:20`); there is no imperative entry point. It also carries a
  flat `i18nCustomizeFullMessage` backwards-compat arm that Rails does not have
  — Rails reads `config.active_model.delete(:i18n_customize_full_message) ||
false` (`railtie.rb:21`) and nothing else.
- `packages/trailties/src/trailties/global-id.ts:86` — `static initialize(app: TrailtieApp)`.
  Its own JSDoc says it mirrors the `initializer "global_id"` BLOCK, so the body
  belongs inline in that initializer.
- `packages/trailties/src/trailties/active-record.ts:37` — `export function loadDefaults(version)`,
  plus its `KNOWN_VERSIONS` / `FRAMEWORK_DEFAULTS` / `compareVersions` support.
  Rails' version defaults live in
  `railties/lib/rails/application/configuration.rb`'s `load_defaults`, which
  trails already ports at
  `packages/trailties/src/application/configuration.ts:99`. This is a second,
  divergent implementation of the same Rails method in the wrong file.
- `packages/trailties/src/trailties/action-dispatch.ts:184` — `static defaultMiddleware()`.
  Rails composes the stack in
  `railties/lib/rails/application/default_middleware_stack.rb`, which trails
  ports at `packages/trailties/src/application/default-middleware-stack.ts`.
- `packages/trailties/src/trailties/action-dispatch.ts:197` — `static seedContentSecurityPolicyEnv(request)`.
  Rails does this through `env_config` (`railties/lib/rails/application.rb:342-346`),
  which is a method on `Application`, not on the railtie.
- `packages/trailties/src/trailties/action-view.ts:34` — `export function defaultActionViewConfig()`.
  Rails writes the defaults inline in the class body's
  `config.action_view = ActiveSupport::OrderedOptions.new` block
  (`actionview/lib/action_view/railtie.rb:11-30`).

`defaultActionDispatchConfig` / `defaultActionControllerConfig` /
`defaultActiveRecordConfig` are the same shape as the last one and go the same
way.

## Converged shape

Each of these either inlines into the initializer or `config` block that Rails
writes it in, or moves to the Rails file that already owns the concept:

- the two `initialize` statics inline into their `initializer` blocks;
- `loadDefaults` is deleted in favour of `Application::Configuration#loadDefaults`,
  after checking whether its `partialInserts` / `raiseOnAssignToAttrReadonly`
  entries are already covered there and porting the gap if not;
- `defaultMiddleware` moves to `application/default-middleware-stack.ts`;
- `seedContentSecurityPolicyEnv` moves to `Application#envConfig`;
- the `default*Config()` helpers inline into their class bodies' `config.set(...)`
  calls, which is where Rails writes the literal.

Expect this to want splitting — file per-file follow-ups rather than one
oversized PR. The `est-loc` is the whole set.

## Acceptance criteria

- [ ] No `static initialize`, `defaultMiddleware`, `seedContentSecurityPolicyEnv`
      or `loadDefaults` remains in `packages/trailties/src/trailties/**`.
- [ ] The `default*Config()` helpers are inlined where Rails writes the literal.
- [ ] `loadDefaults`' behaviour is reachable through
      `Application::Configuration#loadDefaults` only, with no second version list.
- [ ] Callers and tests move with the code; existing test names are unchanged.
- [ ] `pnpm parity:api:extra --package trailties` shows these names gone and does
      not increase elsewhere.
