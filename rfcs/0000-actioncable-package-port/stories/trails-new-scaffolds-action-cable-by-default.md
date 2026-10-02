---
title: "trails new stops skipping Action Cable and scaffolds real cable files"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-actioncable-engine",
    "eager-load-app-channels-in-finisher",
    "port-actioncable-channel-generator",
  ]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new` switches Action Cable off in every generated app:
`UNPORTED_SUBSYSTEM_SKIP_DEFAULTS.skipActionCable: true`
(`packages/trailties/src/generators/app-base.ts:33-34`), filed by
`0104/generator-scaffolds-unported-subsystems` (done) because the generator
used to emit `export class Channel {}` for a package that did not exist. The
arms it guards are still there (`packages/trailties/src/generators/app-generator.ts:600,725,1071`).

Rails (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb`):
`template "cable.yml" unless options[:update] || options[:skip_action_cable]`
(`:130`), the `config/cable.yml` update arm (`:141-154`),
`delete_action_cable_files_skipping_action_cable` (`:542-546`), and in
`app_base.rb`: `class_option :skip_action_cable` (`:71-72`), the
`"action_cable/engine" => !options[:skip_action_cable]` framework require
(`:310`), `skip_action_cable?` (`:368-370`) and `cable_gemfile_entry`
(`:638-644`). The template is
`templates/config/cable.yml.tt`: `async` in development, `test` in test,
`redis` with `REDIS_URL` and `channel_prefix: <app>_production` in
production.

This story removes `skipActionCable` from the unported defaults and converges
each guarded arm onto its Rails body: the cable config, the
`application_cable` channel and connection (real subclasses of
`ActionCable.Channel.Base` and `ActionCable.Connection.Base`), the engine
in the generated app's framework list, and `@blazetrails/actioncable` in its
dependencies.

## Fidelity traps (predicted at authoring)

- [ ] **The production adapter is `redis`.** A generated app's production config must name an adapter trails has; if the Redis adapter has not landed when this is claimed, depend on `port-actioncable-redis-adapter` with `tasks set-deps` before writing a different default.
- [ ] **`skip_action_cable` is neither a reason nor an implication** in Rails' `OPTION_IMPLICATIONS` (`app_base.rb`); check the trails table at `packages/trailties/src/generators/app-base.ts:40-43` agrees.
- [ ] **`redis:` in the devcontainer options** (`app_generator.rb:268`) is `options[:skip_solid] && !(options[:skip_action_cable] && options[:skip_active_job])`.
- [ ] **Solid Cable is not ported.** `solid_cable:install` (`app_base.rb:750`) and the Solid arm of `cable_gemfile_entry` stay behind `skip_solid`; do not emit a Solid Cable config.
- [ ] **The app generator tests assert on generated file lists.** `app_generator_test.rb` and `shared_generator_tests.rb` have cable cases; port the ones this change turns on and say in the PR which were already ported behind the skip.
- [ ] **The website's in-browser generator** runs the same code; check it still builds.

## Acceptance criteria

- [ ] `trails new app` without `--skip-action-cable` generates a cable config, `application_cable` channel and connection classes, and an `@blazetrails/actioncable` dependency; with the flag it generates none of them.
- [ ] The generated app boots, and a WebSocket client receives a welcome message at `/cable`.
- [ ] `skipActionCable` is gone from `UNPORTED_SUBSYSTEM_SKIP_DEFAULTS`.

## Definition of done

Generated `export class Channel {}` placeholders do not close this story.
