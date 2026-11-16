---
title: "vite-trails-config-defaults-override"
status: in-progress
updated: 2026-11-16
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10184
claim: "2026-11-16T15:57:33Z"
assignee: "vite-trails-config-defaults-override"
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_rails/lib/vite_rails/config.rb:1-18` is
`ViteRails::Config`, prepended onto `ViteRuby::Config.singleton_class`: its
`config_defaults` override passes `asset_host` (from
`Rails.application.config.action_controller.asset_host`, nil for a Proc),
`mode: Rails.env.to_s` and `root: Rails.root || Dir.pwd` to `super`.
`packages/vite-assets/lib/config.ts` `Config.configDefaults` is the `super`
target. vite-trails-package-and-tag-helpers shipped `packages/vite-trails`
without it: the override reads `Trails.env` unguarded (Rails `require "rails"`),
so it needs a booted `Trails` in the vite-trails test setup.

## Acceptance criteria

- `packages/vite-trails/lib/config.ts` ports `ViteRails::Config` and is
  applied to `ViteAssets::Config`'s statics (`extend()` + `rbCallSuper`), with
  `config_defaults`' three arguments as in `config.rb:6-15`.
- `ViteTrails.Config` is seated; helper tests still pass with Trails booted.
