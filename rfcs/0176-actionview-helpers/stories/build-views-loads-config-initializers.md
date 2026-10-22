---
title: "build-views registers app handlers by loading config/initializers, not a --handlers flag"
status: draft
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9205 gave `build-views` (`packages/trails-tsc/src/build-views.ts`) a `handlers` option (CLI `--handlers <module>`). It imports the named modules before walking `app/views`, so a handler an app registers is precompiled. That option has no Rails counterpart. In Rails an app registers a handler with `ActionView::Template.register_template_handler` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers.rb:41-48`) inside an initializer. `Rails::Engine`'s `load_config_initializers` initializer loads those initializers (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:610-614`, which calls `load_config_initializer` on each sorted file under `paths["config/initializers"]`). Nothing has to name the handler module.

## Acceptance criteria

- `trails-tsc-views build` loads the application's `config/initializers` the way `load_config_initializers` does, in sorted order, before it walks the views. A handler registered there is precompiled without a flag.
- The `handlers` option and `--handlers` flag are removed. Remove them only if the initializer path covers the fixture test in `packages/actionview/src/template/precompiled.trails.test.ts` ("precompiles a file under a handler the application registers"). In that case the fixture's `shout-handler.js` stays under `config/initializers/` and is picked up without the option.
