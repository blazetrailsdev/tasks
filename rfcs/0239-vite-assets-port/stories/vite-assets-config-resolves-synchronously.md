---
title: "ViteAssets#config is read synchronously once prewarmed; peekConfig retires"
status: blocked
updated: 2026-11-16
rfc: "0239-vite-assets-port"
cluster: null
packages: [vite-assets]
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: "waiting on the vite-trails port: its app boot owns the awaited ViteAssets config prewarm that lets config() and DevServerProxy's constructor read synchronously (trails#10144 has merged; peekConfig now on main at packages/vite-assets/lib/vite-assets.ts:220)"
closed-reason: null
---

## Context

Filed from trails#10144.

`ViteRuby::DevServerProxy#initialize` (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/dev_server_proxy.rb:10-14`) reads `config.mode`, and `ViteRuby#config` (`vite_ruby.rb:128-134`) resolves lazily and synchronously. In trails, `ViteAssets#config()` (`packages/vite-assets/lib/vite-assets.ts`) is async, because `Config.resolveConfig` reads files. So the constructor reads `ViteAssets#peekConfig()`, which is `undefined` until something has awaited `config()`. When the config has not been resolved yet, `peekConfig` answers a stand-in whose `mode` comes from `Config.configDefaults` (env and the instance's options), which is where `resolveConfig` gets `mode` too.

## Acceptance criteria

- `ViteAssets` config resolution is made synchronous once it is prewarmed at boot. For example, the app's boot awaits `ViteAssets.config()` before the middleware stack is built, and `DevServerProxy` reads `config` directly.
- `Config.configDefaults` is `private` again, as `config_defaults` is under `class << self; private` (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/config.rb:142,154`); `peekConfig` is its only outside caller.
- `peekConfig` (called from `DevServerProxy`'s constructor, `packages/vite-assets/lib/dev-server-proxy.ts`) is deleted, along with its `CONVERGEABLE vite-assets-config-resolves-synchronously` receipt.
