---
title: "Converge the app glob's exclude onto Rails"
status: claimed
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - trailties-autoloaders-and-config-paths
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-02T02:56:09Z"
assignee: "app-glob-matches-rails-exclude"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/engine/configuration.rb:76-78` excludes only `assets` and `javascript_path` from the `app` glob. `packages/trailties/src/engine/configuration.ts:51` also excludes `views` and `views/concerns`, because `trails-tsc-views build --in-place` leaves `.js` modules beside templates (`packages/trails-tsc/src/build-views.ts:93-98`), and Zeitwerk's `ruby?` would read those as code. `paths["app/views"]` is not eager (`.rb` vs `.erb` keeps Rails safe).

## Acceptance criteria

- The `app` path's `exclude` matches Rails: `["assets", javascriptPath]`.
- An in-place build no longer leaves a module an autoloader can read as code under an `app/views` root (for example, emitted outside it), for every registered handler.
- `packages/trailties/CLAUDE.md`'s "`app/views` is not an autoload root" paragraph is removed.
