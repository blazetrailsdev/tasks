---
title: "Port Pathname#exist? and use it at config_for / cable engine"
status: draft
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails reads a config path through `Pathname#exist?`: `config_for`'s `if yaml.exist?`
(`vendor/rails/v8.0.2/railties/lib/rails/application.rb:291`) and the cable engine's
`(config_path = Pathname.new(...)).exist?`
(`vendor/rails/v8.0.2/actioncable/lib/action_cable/engine.rb:50`).
ruby-compat's `Pathname` (`packages/ruby-compat/src/pathname.ts`) has no `exist?`, so
trails#9355 calls `File.isExist(configPath)` in `trailties/action-cable.ts` and keeps
`getFs().exists` in `Application#configFor`.

## Acceptance criteria

- `Pathname#isExist` is ported (MRI `ext/pathname/pathname.c` `path_exist_p`, delegating
  to `File.exist?`).
- `action-cable.ts` calls `configPath.isExist()`, and `configFor`'s Pathname arm checks
  `yaml.isExist()` as Rails does.
