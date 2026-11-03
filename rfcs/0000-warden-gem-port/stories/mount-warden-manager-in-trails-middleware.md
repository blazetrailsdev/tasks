---
title: 'Mount Warden::Manager through config.middleware.use and reach request.env["warden"] from a controller'
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-wiring
packages: ["trailties", "actionpack"]
deps: ["port-warden-manager", "actionpack-rescue-paths-rethrow-kernel-throw"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails ships no Warden wiring (`grep -rn warden vendor/rails/v8.0.2` finds
only Gemfile comments, if anything). What this mirrors is Devise's railtie,
`config.app_middleware.use Warden::Manager do |config| Devise.warden_config =
config end` (devise 4.9.4 `lib/devise/rails.rb:11-13`), and the application
spelling `config.middleware.use Warden::Manager do |manager| … end` from
warden's README. Both surfaces exist in trails already:

- `MiddlewareStackProxy#use` (`packages/trailties/src/configuration.ts:36-38`)
  replays onto the app's `ActionDispatch::MiddlewareStack`; Rails
  `railties/lib/rails/configuration.rb` `MiddlewareStackProxy`.
- `Railtie::Configuration#app_middleware`
  (`packages/trailties/src/trailtie/configuration.ts:91-92`; Rails
  `railties/lib/rails/railtie/configuration.rb:39-41`), merged in
  `Application#build_middleware` (`packages/trailties/src/application.ts:349`).

What has to be verified, not invented:

1. The block passed to `use(Warden.Manager, opts, block)` reaches
   `Manager`'s constructor as its block (`manager.rb:19-24`, `yield @config`),
   through `ActionDispatch::MiddlewareStack::Middleware#build`
   (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb`,
   `klass.new(app, *args, &block)`). Fix the trails port if the block is
   dropped.
2. A `use`d middleware sits after the session middleware in the default stack
   (`packages/trailties/src/application/default-middleware-stack.ts`), so
   `env["rack.session"]` is set when `Proxy` reads it (`mixins/common.rb:9`).
3. A controller reads `this.request.env["warden"]`
   (ActionDispatch `Request#env`). Devise's `warden` helper
   (`lib/devise/controllers/helpers.rb:144-146`) is Devise surface and is
   **not** added to `ActionController::Base`; adding it would be a public name
   with no Rails or Warden counterpart (CLAUDE.md § "Fidelity is the job").
   If a name proves unavoidable it carries
   `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` and the RFC is
   updated to say why.

## Acceptance criteria

- A trailties `boot-app-*.trails.test.ts` (the existing boot-app pattern)
  configures `config.middleware.use(Warden.Manager, …, (manager) => { … })`,
  boots, and asserts the block ran with a `Warden::Config` and that a request
  to a controller sees `request.env["warden"]` as a `Warden::Proxy` with a
  session.
- `packages/trailties` gains `@blazetrails/warden` only as a devDependency
  (test use); no runtime dependency from trailties or actionpack on warden.
- `parity:api:extra` unchanged for trailties and actionpack.
