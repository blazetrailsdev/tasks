---
title: "trails server's view watcher moves to a Procfile.dev beside the server (bin/dev)"
status: draft
updated: 2026-10-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9153 made `trails server` (`packages/trailties/src/commands/server.ts`, the module-private `watchViews`) start `@blazetrails/trails-tsc`'s `watchViews` itself when template caching is off. The function carries `@noRailsEquivalent PERMANENT`. Rails' server command starts no watchers. `bin/dev` is `exec "./bin/rails", "server", *ARGV` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/bin/dev.tt`). Asset watchers instead run beside the server from a `Procfile.dev` that jsbundling/cssbundling install, and `bin/dev` runs that Procfile through foreman.

The server-side watcher also clears `ActionView::LookupContext::DetailsKey` after each `change` rebuild. Without that, a request inside the rebuild window caches the stale module. `ViewReloader`'s `FileUpdateChecker` watches `app/views` (`cache_expiry.rb:44-46`), but the emitted `.trails/views/*.js` lands after the `.tse` mtime the checker has already recorded.

## Acceptance criteria

- The `trails new` generator writes a `Procfile.dev` with `web: bin/trails server` and `views: trails-tsc-views dev --views app/views`. `bin/dev` runs that Procfile, as jsbundling's `bin/dev` does.
- `server.ts` no longer starts a watcher, and its `@noRailsEquivalent` receipt is removed.
- The stale-module race stays closed without a server-side `DetailsKey.clear`. For example, the reloader's watched dirs include the emitted views, or `build-views` touches the source after it emits. Cite the Rails line that each choice mirrors.
- The server tests "watches app/views when template caching is off" and "clears the template caches on a rebuild, not on the initial build" move to the Procfile/watcher flow or are retired.
