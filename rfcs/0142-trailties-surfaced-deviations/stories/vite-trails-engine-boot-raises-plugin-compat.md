---
title: "vite-trails engine boot raises the vite-plugin-ruby compatibility check"
status: draft
updated: 2026-11-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

An app that lists `@blazetrails/vite-trails` and `vite-plugin-ruby@^5.1.1` but has no `config/vite.json`
cannot boot or run any `bin/trails` command: vite-trails' engine initializer awaits
`ViteAssets.prewarmConfig()` (packages/vite-trails/lib/engine.ts), and `Config.resolveConfig` raises
`ArgumentError: vite-plugin-ruby@^5.1.1 might not be compatible with vite_ruby-3.11.1`
(packages/vite-assets/lib/compatibility-check.ts:13-17). Rails' vite_rails engine
(vendor/vite_ruby/v3.11.1/vite_rails/lib/vite_rails/engine.rb) does not resolve config at boot, and
vite_ruby's `CompatibilityCheck.verify_plugin_version` (vite_ruby/lib/vite_ruby/compatibility_check.rb)
only runs from `ViteRuby.bootstrap` / the CLI, and it accepts plugin 5.x for vite_ruby 3.x
(`DEFAULT_PLUGIN_VERSION`). Found building examples/chatter, which dropped vite-trails for a plain vite build.

## Acceptance criteria

- Booting an app with vite-trails and no `config/vite.json` does not raise.
- `vite-plugin-ruby@^5.1.1` passes the compatibility check for vite_ruby 3.11.1, as upstream's does.
