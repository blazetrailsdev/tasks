---
title: "trails build installs routes, environments, initializers and config file imports so an AOT build sees them"
status: draft
updated: 2026-11-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9850 makes `trails build` write `.trails/entry.generated.js`. It installs every autoloaded `app/` file as a literal `import()`, so an ahead-of-time compiler (perry-native, `examples/perry-native` FINDINGS wall 30) can see it. Boot still loads several other files by a path computed at run time, which an AOT compiler can't follow:

- routes: `RoutesReloader#load_paths` → `load(path)` (`vendor/rails/v8.0.2/railties/lib/rails/application/routes_reloader.rb:63-64`)
- environments: `paths["config/environments"].existent.each` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:566`)
- initializers: `load_config_initializer` (`engine.rb:691`)
- `config_for` (`application.rb:288`) and `database_configuration` (`application/configuration.rb:434`), which read YAML by path
- helpers, which are loaded by path

Rails loads all of these with `Kernel#load` / `require`, so the run-time behaviour stays as it is. What's missing is the build-time edge: `trails build` writes a generated map from path to a literal `import()` (YAML inlined), the same way `imports.generated.js` does for zeitwerk. Each loader prefers that map over the path when it's installed.

## Acceptance criteria

- `trails build` writes a generated module that maps each of these load paths to a literal import, and the entry installs it.
- Each loader site prefers the installed map and otherwise keeps its Rails path load unchanged.
- The perry-native app boots through the generated entry with routes, environments and initializers applied.
