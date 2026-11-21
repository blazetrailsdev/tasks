---
title: "trails new writes Procfile.dev from an install step, as jsbundling does, not from AppGenerator#bin"
status: draft
updated: 2026-11-21
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

trails#10474 made `trails new` write `Procfile.dev` from `AppGenerator#bin` (`packages/trailties/lib/generators/trails/app/app-generator.ts`, `await this.template("Procfile.dev")`). Rails' `bin` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb`) writes no Procfile. jsbundling-rails writes `Procfile.dev` from its own install template (`lib/install/install.rb`: `add_line Procfile.dev "web: ..."` / `"js: ..."`), and vite-trails already does the same (`packages/vite-trails/lib/cli.ts`, `appendUnlessPresent(root.join("Procfile.dev"), "web: bin/trails s", { pattern: "web:" })`).

## Acceptance criteria

- `Procfile.dev` is written by an install step shaped like jsbundling's `install.rb` (the trails-tsc views watcher's installer, which `trails new` runs), not by `AppGenerator#bin`.
- `bin()` matches Rails' body again.
- The app-generator test still asserts `Procfile.dev` holds the `web:` and `views:` lines.
