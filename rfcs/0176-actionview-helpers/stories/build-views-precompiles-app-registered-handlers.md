---
title: "build-views-precompiles-app-registered-handlers"
status: in-progress
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9205
claim: "2026-10-22T00:48:07Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

## Context

trails#9196 made `build-views` (`packages/trails-tsc/src/build-views.ts`) precompile every file whose extension names a registered handler (`TemplateHandlers.templateHandlerExtensions()`). The CLI runs in its own process, so it sees only the handlers `Template`'s static block registers (`raw`, `tse`, `html`, `ruby`, `packages/actionview/src/template.ts:107-114`). An app registers its own with `register_template_handler` in an initializer (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers.rb:41-48`), and that never runs during `trails-tsc-views build`. Those files are skipped and raise `LoadError` at render time (`template.ts` loader).

## Acceptance criteria

- `build-views` loads the application's handler registrations before it walks the views. Either it boots the app's initializers or it takes a handlers module option. Then an app handler's files are precompiled like the built-in ones.
- A test registers a custom handler in a fixture app, builds, and renders the file from its emitted module.
