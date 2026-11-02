---
title: "Port Rails.autoloaders and the autoload path config"
status: done
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-railties
packages: ["trailties", "activesupport"]
deps: ["zeitwerk-eager-load-and-callbacks"]
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9603
claim: "2026-11-02T00:26:39Z"
assignee: "trailties-autoloaders-and-config-paths"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/autoloaders.rb`, `application/bootstrap.rb:92-109`, `application/finisher.rb:17-45`, `engine.rb:578-589`, `application/configuration.rb:471-493`. RFC 0213 § "Railties" and § "Loading: everything at boot". `zeitwerk_checker.rb` falls here too.

## Acceptance criteria

- `Trails.autoloaders` has `main` and `once` with Rails' tags and the existing inflector.
- Both setup initializers run, each followed by an awaited `eager_load`, whatever `config.eager_load` says.
- `autoload_paths`, `eager_load_paths`, `autoload_once_paths`, `autoload_lib` and `autoload_lib_once` reach the loaders.
- An `on_load` calls `registerX`, so seats keep working until Phase 4.
- RFC 0212's permanent unported rows for these files are retired.
