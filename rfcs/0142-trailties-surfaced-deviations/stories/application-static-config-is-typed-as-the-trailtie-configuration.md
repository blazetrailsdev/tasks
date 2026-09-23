---
title: "Application.config (static) is typed as the trailtie Configuration, so the generated loadDefaults call does not typecheck"
status: draft
updated: 2026-09-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. `config/application.ts:3-16` in
trailmap has to cast to call `loadDefaults`:

```ts
interface LoadsDefaults { loadDefaults(targetVersion: string | number): void; }
...
(this.config as unknown as LoadsDefaults).loadDefaults("8.0");
```

Its comment names the cause: the static `config` accessor is typed as the
trailtie configuration, which has no `loadDefaults`.

The generator emits the same call with no cast
(`packages/trailties/src/generators/app-generator.ts:412-416`,
`this.config.loadDefaults("8.0")` inside `static {}`). So a freshly generated
application does not typecheck its own `config/application.ts`.

- `packages/trailties/src/trailtie.ts:71-73`:
  `static get config(): Configuration { return this.instance().config; }`
  returns the trailtie `Configuration` (`trailtie/configuration.ts:7`), which
  has no `loadDefaults`.
- `Application` overrides only the INSTANCE getter
  (`packages/trailties/src/application.ts:75`,
  `override get config(): Configuration`, the application configuration). The
  static side is never narrowed.

In Rails, `Rails::Railtie` class-side `config` delegates to the instance
(`railties/lib/rails/railtie.rb:146`, `delegate :config, to: :instance`).
`Rails::Application#config` (`railties/lib/rails/application.rb:451`) returns
`Application::Configuration`, so `config.load_defaults 8.0` in the class body
is the generated shape (`railties/lib/rails/generators/rails/app/templates/config/application.rb.tt`).

## Acceptance criteria

- `Application.config` (static) is typed as the application `Configuration`
  (and `Engine.config` as `EngineConfiguration`). The static getter mirrors the
  instance getter each class already overrides, so `this.config.loadDefaults(...)`
  in a subclass's `static {}` block typechecks.
- A typecheck test compiles the generator's `config/application.ts` output as
  emitted, with no cast.
- trailmap's `LoadsDefaults` cast comes out on its next re-vendor. That removal
  is tracked by trailmap's own story.
