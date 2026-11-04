---
title: "view-watch-runs-from-actionview-server-block"
status: done
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: trails#9720
claim: "2026-11-04T17:29:09Z"
assignee: "view-watch-runs-from-actionview-server-block"
blocked-by: null
closed-reason: null
---

## Context

`Trails::Server#start` (`packages/trailties/src/commands/server.ts`) runs `watchViews` (a `@noRailsEquivalent PERMANENT` helper rebuilding `.tse` views through `@blazetrails/trails-tsc` when `cacheTemplateLoading` is off) before serving. Rails' `start` (`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:32-41`) does no such thing; dev-time work that must run when a server boots goes in a railtie `server do … end` block, run by `Rails.application.load_server` (`railties/lib/rails/engine.rb` `load_server` → `run_server_blocks`), which config.ru calls. trails already ports that: `Engine#loadServer` (`packages/trailties/src/engine.ts:294-297`), and generated `config.ts` awaits it.

To route `start` through `super.start()` without losing view rebuilding, the watch moves into a `server` block registered by the ActionView railtie (`packages/trailties/src/trailties/action-view.ts`).

## Acceptance criteria

- [ ] View watching runs from a `server` block on the ActionView railtie, gated on `cacheTemplateLoading` / `isReloadingEnabled` exactly as `watchViews` is today.
- [ ] `watchViews` leaves `commands/server.ts`; the rebuild-on-change and `DetailsKey.clear()` behaviour is unchanged.
- [ ] A test boots `loadServer` in development and observes the watch started, and not in production.
