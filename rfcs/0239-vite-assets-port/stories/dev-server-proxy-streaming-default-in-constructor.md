---
title: "DevServerProxy applies the test-mode streaming default in its constructor"
status: ready
updated: 2026-11-15
rfc: "0239-vite-assets-port"
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

`ViteRuby::DevServerProxy#initialize` (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/dev_server_proxy.rb:10-14`) sets
`options[:streaming] = false if config.mode == "test" && !options.key?(:streaming)` before `super`.
trails#10111 moved that line into the forwarding arm of `performRequest`
(`packages/vite-assets/lib/dev-server-proxy.ts`), because `ViteAssets#config()`
(`packages/vite-assets/lib/vite-assets.ts`) is async and a constructor cannot await it. So the default
is applied per request, after `isViteShouldHandle` / `isDevServerRunning`, and it mutates `this.streaming`.

## Acceptance criteria

- The test-mode streaming default runs in `DevServerProxy`'s constructor, before `super(app, options)`, as upstream does.
  For example, `ViteAssets` exposes its resolved `Config` synchronously after an awaited boot step, the prewarm-and-peek
  shape CLAUDE.md uses for adapter facts.
- The per-request assignment in `performRequest` is deleted.
