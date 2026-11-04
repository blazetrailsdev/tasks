---
title: "rackup-builder-loads-config-ts"
status: done
updated: 2026-11-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: trails#9721
claim: "2026-11-04T17:28:59Z"
assignee: "rackup-builder-loads-config-ts"
blocked-by: null
closed-reason: null
---

## Context

`Rackup::Server#app` builds the app from `options[:config]` through `build_app_and_options_from_config` → `Rack::Builder.parse_file` (`vendor/rackup/v2.2.1/lib/rackup/server.rb`). trails ports that as `Builder.parseFile` (`packages/rack/src/builder.ts:38-88`), which `eval`s a config.ru-style script. A trails app's rackup file is `config.ts` (`packages/trailties/src/generators/trails/app/app-generator.ts:396-407`), an ES module that imports `config/environment.ts` and `export default Trails.application`; `eval` cannot load it, so `Rackup::Server#start` cannot boot a trails app (`packages/rackup/src/server.ts` `buildAppAndOptionsFromConfig`).

Rack's `Builder.load_file` treats a `.rb` file as `require`d Ruby (`vendor/rack` builder.rb `load_file`). The analogue here is an awaited `import()` of a `.ts`/`.js` config whose default export is the app, the `rbFLoad` shape (CLAUDE.md § "A migration file is loaded by `Kernel#load`").

## Acceptance criteria

- [ ] `Builder.parseFile` / `loadFile` load a `.ts` / `.js` config by awaited import and answer its default export; the config.ru text arm stays for `.ru`.
- [ ] `Rackup::Server#app` / `buildAppAndOptionsFromConfig` await that load; `wrappedApp` and `start` follow.
- [ ] `trails new`'s default `config` option and `ServerCommand`'s `--config` default name `config.ts` where Rails names `config.ru` (`server_command.rb` `class_option :config`).
- [ ] Tests: `spec_server.rb` / `spec_builder.rb` arms for a config file, plus a trails-only test loading a `.ts` config.
